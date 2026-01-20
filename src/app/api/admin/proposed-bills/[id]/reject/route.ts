import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { billParser } from '@/lib/bill-parser'
import { checkExpensePermission } from '@/lib/expense-permissions'

// POST /api/admin/proposed-bills/[id]/reject - Reject a proposed bill
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
    const { reason } = body

    const result = await billParser.rejectProposedBill(id, session.user.id, reason)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[PROPOSED_BILLS] Error rejecting:', error.message)
    return NextResponse.json({ error: 'Failed to reject proposed bill' }, { status: 500 })
  }
}
