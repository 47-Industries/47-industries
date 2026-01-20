import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkExpensePermission } from '@/lib/expense-permissions'

// POST /api/admin/financial-connections/transactions/[id]/approve - Approve transaction as company expense
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

    // Get the transaction
    const transaction = await prisma.stripeTransaction.findUnique({
      where: { id },
      include: { financialAccount: true }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (transaction.matchedBillInstanceId) {
      return NextResponse.json({ error: 'Transaction already matched to an expense' }, { status: 400 })
    }

    // Get team members who split expenses
    const splitters = await prisma.teamMember.findMany({
      where: { splitsExpenses: true, status: 'ACTIVE' },
      select: { id: true }
    })

    // Use absolute value for expense amount (transactions are often negative for expenses)
    const amount = Math.abs(transaction.amount.toNumber())
    const vendor = body.vendor || transaction.merchantName || transaction.description || 'Bank Transaction'
    const vendorType = body.vendorType || 'OTHER'

    // Determine period from transaction date
    const txnDate = new Date(transaction.transactedAt)
    const period = txnDate.toISOString().slice(0, 7)

    // Create bill instance
    const billInstance = await prisma.billInstance.create({
      data: {
        vendor,
        vendorType,
        amount,
        dueDate: txnDate,
        period,
        status: 'PAID', // Bank transactions are already paid
        paidDate: txnDate,
        paidVia: `${transaction.financialAccount.institutionName} ****${transaction.financialAccount.accountLast4 || ''}`,
        stripeTransactionId: transaction.stripeTransactionId
      }
    })

    // Create bill splits
    if (splitters.length > 0 && amount > 0) {
      const splitAmount = amount / splitters.length
      const splits = splitters.map(splitter => ({
        billInstanceId: billInstance.id,
        teamMemberId: splitter.id,
        amount: splitAmount,
        status: 'PENDING' as const, // Partner still owes their share
        paidDate: null
      }))

      await prisma.billSplit.createMany({ data: splits })
    }

    // Link transaction to bill instance
    await prisma.stripeTransaction.update({
      where: { id },
      data: {
        matchedBillInstanceId: billInstance.id,
        matchConfidence: 100 // Manual match
      }
    })

    return NextResponse.json({
      success: true,
      billInstanceId: billInstance.id
    })
  } catch (error: any) {
    console.error('[TRANSACTIONS] Error approving:', error.message)
    return NextResponse.json({ error: 'Failed to approve transaction' }, { status: 500 })
  }
}
