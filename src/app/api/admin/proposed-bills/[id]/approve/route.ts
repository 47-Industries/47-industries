import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { billParser } from '@/lib/bill-parser'
import { checkExpensePermission } from '@/lib/expense-permissions'

// POST /api/admin/proposed-bills/[id]/approve - Approve a proposed bill
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

    // Allow overrides for vendor, vendorType, amount, dueDate, and enableAutoApprove
    const overrides = {
      ...body.overrides,
      enableAutoApprove: body.enableAutoApprove || false
    }

    const result = await billParser.approveProposedBill(id, session.user.id, overrides)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      billInstanceId: result.billInstanceId,
      recurringBillId: result.recurringBillId,
      autoApproveEnabled: overrides.enableAutoApprove
    })
  } catch (error: any) {
    console.error('[PROPOSED_BILLS] Error approving:', error.message)
    return NextResponse.json({ error: 'Failed to approve proposed bill' }, { status: 500 })
  }
}
