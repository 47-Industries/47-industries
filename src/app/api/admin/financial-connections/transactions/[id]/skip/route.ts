import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkExpensePermission } from '@/lib/expense-permissions'

// POST /api/admin/financial-connections/transactions/[id]/skip - Skip transaction (not a company expense)
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

    // Get the transaction
    const transaction = await prisma.stripeTransaction.findUnique({
      where: { id }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Mark as skipped
    await prisma.stripeTransaction.update({
      where: { id },
      data: {
        approvalStatus: 'SKIPPED',
        matchedBy: session.user.id,
        matchedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[TRANSACTIONS] Error skipping:', error.message)
    return NextResponse.json({ error: 'Failed to skip transaction' }, { status: 500 })
  }
}
