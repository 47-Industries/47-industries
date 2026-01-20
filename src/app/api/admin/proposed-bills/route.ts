import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkExpensePermission } from '@/lib/expense-permissions'

// GET /api/admin/proposed-bills - List proposed bills
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const permission = await checkExpensePermission()
  if (!permission.canAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'PENDING'
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const [proposedBills, total] = await Promise.all([
      prisma.proposedBill.findMany({
        where: status === 'ALL' ? {} : { status },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.proposedBill.count({
        where: status === 'ALL' ? {} : { status }
      })
    ])

    // Get pending count for badge
    const pendingCount = await prisma.proposedBill.count({
      where: { status: 'PENDING' }
    })

    return NextResponse.json({
      proposedBills,
      total,
      pendingCount,
      limit,
      offset
    })
  } catch (error: any) {
    console.error('[PROPOSED_BILLS] Error listing:', error.message)
    return NextResponse.json({ error: 'Failed to fetch proposed bills' }, { status: 500 })
  }
}

// POST /api/admin/proposed-bills/bulk-approve - Bulk approve
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const permission = await checkExpensePermission()
  if (!permission.canAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { action, ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No bill IDs provided' }, { status: 400 })
    }

    if (action === 'bulk-approve') {
      const { billParser } = await import('@/lib/bill-parser')
      const results = { approved: 0, failed: 0, errors: [] as string[] }

      for (const id of ids) {
        const result = await billParser.approveProposedBill(id, session.user.id)
        if (result.success) {
          results.approved++
        } else {
          results.failed++
          results.errors.push(`${id}: ${result.error}`)
        }
      }

      return NextResponse.json(results)
    }

    if (action === 'bulk-reject') {
      const { reason } = body
      const { billParser } = await import('@/lib/bill-parser')
      const results = { rejected: 0, failed: 0, errors: [] as string[] }

      for (const id of ids) {
        const result = await billParser.rejectProposedBill(id, session.user.id, reason)
        if (result.success) {
          results.rejected++
        } else {
          results.failed++
          results.errors.push(`${id}: ${result.error}`)
        }
      }

      return NextResponse.json(results)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('[PROPOSED_BILLS] Error with bulk action:', error.message)
    return NextResponse.json({ error: 'Failed to process bulk action' }, { status: 500 })
  }
}
