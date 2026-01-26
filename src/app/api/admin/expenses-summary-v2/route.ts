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

    // Get team members who split expenses
    const splitters = await prisma.teamMember.findMany({
      where: { splitsExpenses: true, status: 'ACTIVE' },
      select: { id: true, name: true, email: true, profileImageUrl: true }
    })

    const splitterCount = splitters.length

    // Auto-generate missing bill instances for FIXED amount recurring bills only
    // Variable bills are created when we get actual amounts from email/bank scanning
    const recurringBills = await prisma.recurringBill.findMany({
      where: { active: true, amountType: 'FIXED' }
    })

    const [year, month] = period.split('-').map(Number)

    for (const recurring of recurringBills) {
      // Handle frequencies
      let shouldCreate = true
      let effectivePeriod = period

      if (recurring.frequency === 'QUARTERLY') {
        const quarterStartMonths = [1, 4, 7, 10]
        if (!quarterStartMonths.includes(month)) {
          shouldCreate = false
        } else {
          const quarter = Math.floor((month - 1) / 3) + 1
          effectivePeriod = `${year}-Q${quarter}`
        }
      } else if (recurring.frequency === 'ANNUAL') {
        if (month !== 1) shouldCreate = false
        else effectivePeriod = `${year}`
      }

      if (!shouldCreate) continue

      // Check if instance exists
      const existing = await prisma.billInstance.findFirst({
        where: { recurringBillId: recurring.id, period: effectivePeriod }
      })

      if (existing) continue

      // Create missing instance (only for FIXED amount bills)
      const dueDate = new Date(year, month - 1, recurring.dueDay || 1)
      const amount = Number(recurring.fixedAmount) || 0

      // Skip if no valid amount
      if (amount <= 0) continue

      const perPersonAmount = splitterCount > 0 ? amount / splitterCount : 0

      await prisma.billInstance.create({
        data: {
          recurringBillId: recurring.id,
          vendor: recurring.vendor,
          vendorType: recurring.vendorType,
          amount,
          dueDate,
          period: effectivePeriod,
          status: 'PENDING',
          billSplits: splitterCount > 0 ? {
            create: splitters.map(s => ({
              teamMemberId: s.id,
              amount: perPersonAmount,
              status: 'PENDING'
            }))
          } : undefined
        }
      })
    }

    // Get current month's bill instances
    const currentMonthBills = await prisma.billInstance.findMany({
      where: { period },
      orderBy: { dueDate: 'asc' },
      include: {
        recurringBill: {
          select: { id: true, name: true, paymentMethod: true, amountType: true }
        },
        billSplits: {
          include: {
            teamMember: {
              select: { id: true, name: true, email: true, profileImageUrl: true }
            }
          }
        }
      }
    })

    // Calculate outstanding balances for each team member
    const splitterBalances = await Promise.all(splitters.map(async (splitter) => {
      // Get all pending splits for this team member
      const pendingSplits = await prisma.billSplit.findMany({
        where: {
          teamMemberId: splitter.id,
          status: 'PENDING'
        },
        include: {
          billInstance: {
            select: { vendor: true, dueDate: true }
          }
        }
      })

      const paidSplits = await prisma.billSplit.findMany({
        where: {
          teamMemberId: splitter.id,
          status: 'PAID'
        }
      })

      const pendingAmount = pendingSplits.reduce((sum, p) => sum + Number(p.amount), 0)
      const paidAmount = paidSplits.reduce((sum, p) => sum + Number(p.amount), 0)

      // Get what bills they owe for (for display)
      const owesFor = pendingSplits.map(p => p.billInstance.vendor)

      return {
        splitter,
        pendingAmount,
        pendingCount: pendingSplits.length,
        paidAmount,
        paidCount: paidSplits.length,
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
      splitterCount,
      perPersonAmount: splitterCount > 0 ? Number(bill.amount) / splitterCount : Number(bill.amount)
    })

    // Totals
    const totalPending = billsByStatus.pending.reduce((sum, b) => sum + Number(b.amount), 0)
    const totalPaid = billsByStatus.paid.reduce((sum, b) => sum + Number(b.amount), 0)
    const totalOverdue = billsByStatus.overdue.reduce((sum, b) => sum + Number(b.amount), 0)

    // Outstanding balances total
    const totalOutstanding = splitterBalances.reduce((sum, sb) => sum + sb.pendingAmount, 0)

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
      splitterCount,
      splitters,

      // Monthly bills view
      bills: {
        pending: billsByStatus.pending.map(enrichBill),
        paid: billsByStatus.paid.map(enrichBill),
        overdue: billsByStatus.overdue.map(enrichBill),
        all: currentMonthBills.map(enrichBill)
      },

      // Outstanding balances (who owes what)
      splitterBalances,
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
