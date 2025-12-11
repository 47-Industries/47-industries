import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/expenses-summary - Get summary of all bills for all founders
export async function GET(request: NextRequest) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all founders
    const founders = await prisma.user.findMany({
      where: { isFounder: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    })

    // Calculate totals for each founder
    const summary = await Promise.all(
      founders.map(async (founder) => {
        const [pendingPayments, paidPayments] = await Promise.all([
          prisma.billPayment.aggregate({
            where: { userId: founder.id, status: 'PENDING' },
            _sum: { amount: true },
            _count: true
          }),
          prisma.billPayment.aggregate({
            where: { userId: founder.id, status: 'PAID' },
            _sum: { amount: true },
            _count: true
          })
        ])

        return {
          founder: {
            id: founder.id,
            name: founder.name,
            email: founder.email,
            image: founder.image
          },
          pending: {
            count: pendingPayments._count,
            amount: Number(pendingPayments._sum.amount || 0)
          },
          paid: {
            count: paidPayments._count,
            amount: Number(paidPayments._sum.amount || 0)
          },
          totalOwed: Number(pendingPayments._sum.amount || 0),
          totalPaid: Number(paidPayments._sum.amount || 0)
        }
      })
    )

    // Get upcoming bills (next 7 days)
    const upcomingBills = await prisma.bill.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 10
    })

    // Get overdue bills
    const overdueBills = await prisma.bill.findMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: new Date() }
      },
      orderBy: { dueDate: 'asc' }
    })

    // Bill stats by status
    const billStats = await prisma.bill.groupBy({
      by: ['status'],
      _sum: { amount: true },
      _count: true
    })

    // Bill stats by vendor type
    const vendorTypeStats = await prisma.bill.groupBy({
      by: ['vendorType'],
      where: { status: 'PENDING' },
      _sum: { amount: true },
      _count: true
    })

    // Global totals
    const globalTotals = {
      totalPending: summary.reduce((sum, s) => sum + s.totalOwed, 0),
      totalPaid: summary.reduce((sum, s) => sum + s.totalPaid, 0),
      upcomingBillsCount: upcomingBills.length,
      overdueBillsCount: overdueBills.length,
      founderCount: founders.length
    }

    return NextResponse.json({
      summary,
      upcomingBills: upcomingBills.map(b => ({
        ...b,
        perPersonAmount: founders.length > 0 ? Number(b.amount) / founders.length : Number(b.amount)
      })),
      overdueBills: overdueBills.map(b => ({
        ...b,
        perPersonAmount: founders.length > 0 ? Number(b.amount) / founders.length : Number(b.amount)
      })),
      billStats: billStats.reduce((acc, s) => {
        acc[s.status] = { count: s._count, total: Number(s._sum.amount || 0) }
        return acc
      }, {} as Record<string, { count: number; total: number }>),
      vendorTypeStats: vendorTypeStats.reduce((acc, s) => {
        acc[s.vendorType] = { count: s._count, total: Number(s._sum.amount || 0) }
        return acc
      }, {} as Record<string, { count: number; total: number }>),
      globalTotals
    })
  } catch (error: any) {
    console.error('Error fetching expenses summary:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses summary' }, { status: 500 })
  }
}
