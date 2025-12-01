import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/reports/customers - Get customer report data
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '30' // days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Total customers
    const totalCustomers = await prisma.user.count({
      where: { role: 'CUSTOMER' },
    })

    // New customers in period
    const newCustomers = await prisma.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: { gte: startDate },
      },
    })

    // Customers with orders (repeat customers)
    const customersWithOrders = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        orders: { some: {} },
      },
      include: {
        _count: { select: { orders: true } },
        orders: {
          select: { total: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    const repeatCustomers = customersWithOrders.filter(c => c._count.orders > 1).length

    // Customer retention rate
    const retentionRate = totalCustomers > 0
      ? (repeatCustomers / totalCustomers) * 100
      : 0

    // Customer growth by month (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const customersByMonth = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        role: 'CUSTOMER',
        createdAt: { gte: sixMonthsAgo },
      },
      _count: true,
    })

    // Aggregate by month
    const monthlyGrowth: { month: string; count: number }[] = []
    const monthMap = new Map<string, number>()

    customersByMonth.forEach(item => {
      const monthKey = item.createdAt.toISOString().substring(0, 7) // YYYY-MM
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + item._count)
    })

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toISOString().substring(0, 7)
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      monthlyGrowth.push({
        month: monthName,
        count: monthMap.get(monthKey) || 0,
      })
    }

    // Top customers by lifetime value
    const topCustomers = customersWithOrders
      .map(customer => ({
        id: customer.id,
        name: customer.name || 'Anonymous',
        email: customer.email,
        totalSpent: customer.orders.reduce((sum, o) => sum + Number(o.total), 0),
        orderCount: customer._count.orders,
        lastOrder: customer.orders[0]?.createdAt,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)

    // Customer segments stats
    const segments = await prisma.customerSegment.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        memberIds: true,
      },
    })

    const segmentStats = segments.map(segment => ({
      id: segment.id,
      name: segment.name,
      color: segment.color,
      memberCount: (segment.memberIds as string[])?.length || 0,
    }))

    // Average customer lifetime value
    const totalLifetimeValue = customersWithOrders.reduce((sum, customer) => {
      return sum + customer.orders.reduce((orderSum, o) => orderSum + Number(o.total), 0)
    }, 0)
    const averageLifetimeValue = customersWithOrders.length > 0
      ? totalLifetimeValue / customersWithOrders.length
      : 0

    return NextResponse.json({
      summary: {
        totalCustomers,
        newCustomers,
        repeatCustomers,
        retentionRate,
        averageLifetimeValue,
      },
      monthlyGrowth,
      topCustomers,
      segmentStats,
    })
  } catch (error) {
    console.error('Error fetching customer report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer report' },
      { status: 500 }
    )
  }
}
