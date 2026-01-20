import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkExpensePermission } from '@/lib/expense-permissions'

// POST /api/admin/financial-connections/transactions/[id]/match - Match transaction to a bill
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
    const body = await request.json()
    const { billInstanceId, confidence } = body

    const transaction = await prisma.stripeTransaction.findUnique({
      where: { id }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (billInstanceId) {
      // Match to a bill
      const billInstance = await prisma.billInstance.findUnique({
        where: { id: billInstanceId }
      })

      if (!billInstance) {
        return NextResponse.json({ error: 'Bill instance not found' }, { status: 404 })
      }

      await prisma.stripeTransaction.update({
        where: { id },
        data: {
          matchedBillInstanceId: billInstanceId,
          matchConfidence: confidence || 100,
          matchedAt: new Date(),
          matchedBy: session.user.id
        }
      })

      // Optionally mark bill as paid if transaction amount matches
      const txnAmount = Math.abs(Number(transaction.amount))
      const billAmount = Number(billInstance.amount)

      if (txnAmount >= billAmount * 0.95 && txnAmount <= billAmount * 1.05) {
        // Within 5% - likely the same bill
        await prisma.billInstance.update({
          where: { id: billInstanceId },
          data: {
            status: 'PAID',
            paidDate: transaction.transactedAt,
            paidVia: `Bank transaction - ${transaction.financialAccount?.institutionName || 'Unknown'}`
          }
        })

        // Mark all splits as paid
        await prisma.billSplit.updateMany({
          where: { billInstanceId },
          data: {
            status: 'PAID',
            paidDate: transaction.transactedAt
          }
        })
      }

      return NextResponse.json({ success: true, matched: true })
    } else {
      // Unmatch
      await prisma.stripeTransaction.update({
        where: { id },
        data: {
          matchedBillInstanceId: null,
          matchConfidence: null,
          matchedAt: null,
          matchedBy: null
        }
      })

      return NextResponse.json({ success: true, unmatched: true })
    }
  } catch (error: any) {
    console.error('[FINANCIAL_CONNECTIONS] Error matching transaction:', error.message)
    return NextResponse.json({ error: 'Failed to match transaction' }, { status: 500 })
  }
}

// DELETE /api/admin/financial-connections/transactions/[id]/match - Unmatch transaction
export async function DELETE(
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

    await prisma.stripeTransaction.update({
      where: { id },
      data: {
        matchedBillInstanceId: null,
        matchConfidence: null,
        matchedAt: null,
        matchedBy: null
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[FINANCIAL_CONNECTIONS] Error unmatching transaction:', error.message)
    return NextResponse.json({ error: 'Failed to unmatch transaction' }, { status: 500 })
  }
}
