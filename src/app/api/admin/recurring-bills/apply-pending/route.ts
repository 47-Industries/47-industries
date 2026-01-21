import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkExpensePermission } from '@/lib/expense-permissions'

// POST /api/admin/recurring-bills/apply-pending - Apply recurring bill rules to pending transactions
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
    const { recurringBillId, vendorPattern } = body

    if (!recurringBillId) {
      return NextResponse.json({ error: 'recurringBillId required' }, { status: 400 })
    }

    // Get the recurring bill
    const recurringBill = await prisma.recurringBill.findUnique({
      where: { id: recurringBillId }
    })

    if (!recurringBill) {
      return NextResponse.json({ error: 'Recurring bill not found' }, { status: 404 })
    }

    // Get team members who split expenses
    const splitters = await prisma.teamMember.findMany({
      where: { splitsExpenses: true, status: 'ACTIVE' },
      select: { id: true }
    })

    const pattern = vendorPattern || recurringBill.vendor

    let appliedTransactions = 0
    let appliedProposedBills = 0

    // 1. Apply to pending bank transactions
    const pendingTransactions = await prisma.stripeTransaction.findMany({
      where: {
        approvalStatus: 'PENDING',
        OR: [
          { description: { contains: pattern } },
          { merchantName: { contains: pattern } }
        ]
      },
      include: { financialAccount: true }
    })

    for (const txn of pendingTransactions) {
      const txnAmount = Math.abs(txn.amount.toNumber())
      const txnDate = new Date(txn.transactedAt)
      const txnPeriod = txnDate.toISOString().slice(0, 7)

      // Create bill instance
      const billInstance = await prisma.billInstance.create({
        data: {
          recurringBillId: recurringBill.id,
          vendor: recurringBill.vendor,
          vendorType: recurringBill.vendorType,
          amount: txnAmount,
          dueDate: txnDate,
          period: txnPeriod,
          status: 'PAID',
          paidDate: txnDate,
          paidVia: `${txn.financialAccount.institutionName} ****${txn.financialAccount.accountLast4 || ''}`,
          stripeTransactionId: txn.stripeTransactionId
        }
      })

      // Create bill splits
      if (splitters.length > 0 && txnAmount > 0) {
        const splitAmount = txnAmount / splitters.length
        await prisma.billSplit.createMany({
          data: splitters.map(s => ({
            billInstanceId: billInstance.id,
            teamMemberId: s.id,
            amount: splitAmount,
            status: 'PENDING'
          }))
        })
      }

      // Update transaction as approved
      await prisma.stripeTransaction.update({
        where: { id: txn.id },
        data: {
          matchedBillInstanceId: billInstance.id,
          matchConfidence: 85,
          approvalStatus: 'APPROVED',
          matchedBy: session.user.id,
          matchedAt: new Date()
        }
      })

      appliedTransactions++
    }

    // 2. Apply to pending proposed bills
    const pendingProposed = await prisma.proposedBill.findMany({
      where: {
        status: 'PENDING',
        OR: [
          { vendor: { contains: pattern } },
          { emailFrom: { contains: pattern } },
          { emailSubject: { contains: pattern } }
        ]
      }
    })

    for (const proposed of pendingProposed) {
      const amount = proposed.amount ? Number(proposed.amount) : 0
      const dueDate = proposed.dueDate || new Date()
      const period = dueDate.toISOString().slice(0, 7)

      // Create bill instance
      const billInstance = await prisma.billInstance.create({
        data: {
          recurringBillId: recurringBill.id,
          vendor: proposed.vendor || recurringBill.vendor,
          vendorType: recurringBill.vendorType,
          amount,
          dueDate,
          period,
          status: proposed.isPaid ? 'PAID' : 'PENDING',
          paidDate: proposed.isPaid ? dueDate : null,
          paidVia: proposed.paymentMethod
        }
      })

      // Create bill splits
      if (splitters.length > 0 && amount > 0) {
        const splitAmount = amount / splitters.length
        await prisma.billSplit.createMany({
          data: splitters.map(s => ({
            billInstanceId: billInstance.id,
            teamMemberId: s.id,
            amount: splitAmount,
            status: 'PENDING'
          }))
        })
      }

      // Mark proposed as approved
      await prisma.proposedBill.update({
        where: { id: proposed.id },
        data: {
          status: 'APPROVED',
          matchedRecurringBillId: recurringBill.id,
          createdBillInstanceId: billInstance.id,
          reviewedBy: session.user.id,
          reviewedAt: new Date()
        }
      })

      appliedProposedBills++
    }

    return NextResponse.json({
      success: true,
      applied: appliedTransactions + appliedProposedBills,
      transactions: appliedTransactions,
      proposedBills: appliedProposedBills
    })
  } catch (error: any) {
    console.error('[APPLY PENDING] Error:', error.message)
    return NextResponse.json({ error: 'Failed to apply rules: ' + error.message }, { status: 500 })
  }
}
