import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/expenses-summary-v2 - New dashboard summary
export async function GET(request: NextRequest) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || new Date().toISOString().slice(0, 7) // Default to current month

    // Get founders
    const founders = await prisma.user.findMany({
      where: { isFounder: true },
      select: { id: true, name: true, email: true, image: true }
    })

    const founderCount = founders.length

    // Get current month's bill instances
    const currentMonthBills = await prisma.billInstance.findMany({
      where: { period },
      orderBy: { dueDate: 'asc' },
      include: {
        recurringBill: {
          select: { id: true, name: true, paymentMethod: true, amountType: true }
        },
        founderPayments: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    })

    // Calculate outstanding balances for each founder
    const founderBalances = await Promise.all(founders.map(async (founder) => {
      // Get all pending payments for this founder
      const pendingPayments = await prisma.founderPayment.findMany({
        where: {
          userId: founder.id,
          status: 'PENDING'
        },
        include: {
          billInstance: {
            select: { vendor: true, dueDate: true }
          }
        }
      })

      const paidPayments = await prisma.founderPayment.findMany({
        where: {
          userId: founder.id,
          status: 'PAID'
        }
      })

      const pendingAmount = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0)
      const paidAmount = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0)

      // Get what bills they owe for (for display)
      const owesFor = pendingPayments.map(p => p.billInstance.vendor)

      return {
        founder,
        pendingAmount,
        pendingCount: pendingPayments.length,
        paidAmount,
        paidCount: paidPayments.length,
        owesFor: [...new Set(owesFor)] // Unique vendors
      }
    }))

    // Bills by status
    const billsByStatus = {
      pending: currentMonthBills.filter(b => b.status === 'PENDING'),
      paid: currentMonthBills.filter(b => b.status === 'PAID'),
      overdue: currentMonthBills.filter(b => b.status === 'OVERDUE' ||
        (b.status === 'PENDING' && new Date(b.dueDate) < new Date()))
    }

    // Add per-person amount to each bill
    const enrichBill = (bill: any) => ({
      ...bill,
      founderCount,
      perPersonAmount: founderCount > 0 ? Number(bill.amount) / founderCount : Number(bill.amount)
    })

    // Totals
    const totalPending = billsByStatus.pending.reduce((sum, b) => sum + Number(b.amount), 0)
    const totalPaid = billsByStatus.paid.reduce((sum, b) => sum + Number(b.amount), 0)
    const totalOverdue = billsByStatus.overdue.reduce((sum, b) => sum + Number(b.amount), 0)

    // Outstanding balances total
    const totalOutstanding = founderBalances.reduce((sum, fb) => sum + fb.pendingAmount, 0)

    // Upcoming bills (next 7 days)
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const upcomingBills = await prisma.billInstance.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          gte: today,
          lte: nextWeek
        }
      },
      orderBy: { dueDate: 'asc' },
      include: {
        recurringBill: {
          select: { name: true, paymentMethod: true }
        }
      }
    })

    return NextResponse.json({
      period,
      founderCount,

      // Monthly bills view
      bills: {
        pending: billsByStatus.pending.map(enrichBill),
        paid: billsByStatus.paid.map(enrichBill),
        overdue: billsByStatus.overdue.map(enrichBill),
        all: currentMonthBills.map(enrichBill)
      },

      // Outstanding balances (who owes what)
      founderBalances,
      totalOutstanding,

      // Summary stats
      totals: {
        pending: totalPending,
        paid: totalPaid,
        overdue: totalOverdue,
        monthlyTotal: totalPending + totalPaid
      },

      // Upcoming
      upcomingBills: upcomingBills.map(enrichBill),
      upcomingCount: upcomingBills.length
    })
  } catch (error: any) {
    console.error('Error fetching expenses summary:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses summary' }, { status: 500 })
  }
}
