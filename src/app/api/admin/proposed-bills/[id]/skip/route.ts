import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkExpensePermission } from '@/lib/expense-permissions'

// POST /api/admin/proposed-bills/[id]/skip - Skip an email bill (same as reject but with rule support)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const permission = await checkExpensePermission()
  if (!permission.canAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))

    const createRule = body.createRule === true
    const ruleType = body.ruleType || 'VENDOR'
    const vendorPattern = body.vendorPattern || body.vendorOverride
    const reason = body.reason || 'Skipped'

    // Get proposed bill
    const proposed = await prisma.proposedBill.findUnique({
      where: { id }
    })

    if (!proposed) {
      return NextResponse.json({ error: 'Proposed bill not found' }, { status: 404 })
    }

    if (proposed.status !== 'PENDING') {
      return NextResponse.json({ error: `Bill already ${proposed.status.toLowerCase()}` }, { status: 400 })
    }

    // Mark as skipped/rejected
    await prisma.proposedBill.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        reviewedBy: session.user.id,
        reviewedAt: new Date()
      }
    })

    let additionalSkipped = 0

    // Apply skip rule to other pending emails if requested
    if (createRule && vendorPattern) {
      const matchingPending = await prisma.proposedBill.findMany({
        where: {
          status: 'PENDING',
          id: { not: id },
          OR: [
            { vendor: { contains: vendorPattern } },
            { emailFrom: { contains: vendorPattern } },
            { emailSubject: { contains: vendorPattern } }
          ]
        }
      })

      for (const pending of matchingPending) {
        await prisma.proposedBill.update({
          where: { id: pending.id },
          data: {
            status: 'REJECTED',
            rejectionReason: `Auto-skipped: matches pattern "${vendorPattern}"`,
            reviewedBy: session.user.id,
            reviewedAt: new Date()
          }
        })
        additionalSkipped++
      }
    }

    return NextResponse.json({
      success: true,
      ruleCreated: createRule,
      additionalSkipped
    })
  } catch (error: any) {
    console.error('[PROPOSED_BILLS] Error skipping:', error.message)
    return NextResponse.json({ error: 'Failed to skip proposed bill' }, { status: 500 })
  }
}
