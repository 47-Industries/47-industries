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
  const limit = parseInt(searchParams.get('limit') || '100')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    // Get counts first for proper pagination across both sources
    const proposedWhere = status === 'ALL' ? {} : { status }
    const bankStatusFilter = status === 'ALL'
      ? {}
      : status === 'APPROVED'
        ? { approvalStatus: 'APPROVED' }
        : status === 'SKIPPED'
          ? { approvalStatus: 'SKIPPED' }
          : { approvalStatus: 'PENDING' }

    const [proposedTotal, bankTotal] = await Promise.all([
      prisma.proposedBill.count({ where: proposedWhere }),
      prisma.stripeTransaction.count({ where: bankStatusFilter })
    ])

    const combinedTotal = proposedTotal + bankTotal

    // Fetch items with combined pagination
    // Email bills come first, then bank transactions
    let proposedBills: any[] = []
    let bankTransactions: any[] = []

    if (offset < proposedTotal) {
      // Still have email bills to show
      const emailTake = Math.min(limit, proposedTotal - offset)
      proposedBills = await prisma.proposedBill.findMany({
        where: proposedWhere,
        orderBy: { createdAt: 'desc' },
        take: emailTake,
        skip: offset
      })

      // If we need more items to fill the limit, get bank transactions
      const remaining = limit - proposedBills.length
      if (remaining > 0) {
        bankTransactions = await prisma.stripeTransaction.findMany({
          where: bankStatusFilter,
          orderBy: { transactedAt: 'desc' },
          take: remaining,
          skip: 0,
          include: {
            financialAccount: {
              select: {
                institutionName: true,
                accountLast4: true
              }
            }
          }
        })
      }
    } else {
      // Past all email bills, only show bank transactions
      const bankOffset = offset - proposedTotal
      bankTransactions = await prisma.stripeTransaction.findMany({
        where: bankStatusFilter,
        orderBy: { transactedAt: 'desc' },
        take: limit,
        skip: bankOffset,
        include: {
          financialAccount: {
            select: {
              institutionName: true,
              accountLast4: true
            }
          }
        }
      })
    }

    // Get pending counts for badge
    const [pendingEmailCount, pendingBankCount] = await Promise.all([
      prisma.proposedBill.count({ where: { status: 'PENDING' } }),
      prisma.stripeTransaction.count({ where: { approvalStatus: 'PENDING' } })
    ])

    return NextResponse.json({
      proposedBills,
      bankTransactions,
      total: combinedTotal,
      pendingCount: pendingEmailCount + pendingBankCount,
      pendingEmailCount,
      pendingBankCount,
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
