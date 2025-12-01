import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/reports/sales - Get sales report data
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

    // Get orders in period
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: 'CANCELLED' },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Calculate total revenue
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Get previous period for comparison
    const previousStartDate = new Date(startDate)
    previousStartDate.setDate(previousStartDate.getDate() - parseInt(period))

    const previousOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: previousStartDate, lt: startDate },
        status: { not: 'CANCELLED' },
      },
    })

    const previousRevenue = previousOrders.reduce((sum, order) => sum + Number(order.total), 0)
    const revenueGrowth = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0

    // Calculate revenue by day for chart
    const revenueByDay: { date: string; revenue: number; orders: number }[] = []
    const dayMap = new Map<string, { revenue: number; orders: number }>()

    orders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0]
      const existing = dayMap.get(dateKey) || { revenue: 0, orders: 0 }
      dayMap.set(dateKey, {
        revenue: existing.revenue + Number(order.total),
        orders: existing.orders + 1,
      })
    })

    // Fill in missing days
    const currentDate = new Date(startDate)
    const endDate = new Date()
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0]
      const data = dayMap.get(dateKey) || { revenue: 0, orders: 0 }
      revenueByDay.push({ date: dateKey, ...data })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Top selling products
    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>()
    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.productId
        const existing = productSales.get(productId) || {
          name: item.product?.name || 'Unknown',
          quantity: 0,
          revenue: 0
        }
        productSales.set(productId, {
          name: existing.name,
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + Number(item.price) * item.quantity,
        })
      })
    })

    const topProducts = Array.from(productSales.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Revenue by category
    const categorySales = new Map<string, { name: string; revenue: number }>()
    orders.forEach(order => {
      order.items.forEach(item => {
        const categoryName = item.product?.category?.name || 'Uncategorized'
        const categoryId = item.product?.categoryId || 'uncategorized'
        const existing = categorySales.get(categoryId) || { name: categoryName, revenue: 0 }
        categorySales.set(categoryId, {
          name: categoryName,
          revenue: existing.revenue + Number(item.price) * item.quantity,
        })
      })
    })

    const revenueByCategory = Array.from(categorySales.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)

    // Order status breakdown
    const allOrdersWithStatus = await prisma.order.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: true,
    })

    const ordersByStatus = allOrdersWithStatus.map(item => ({
      status: item.status,
      count: item._count,
    }))

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        revenueGrowth,
      },
      revenueByDay,
      topProducts,
      revenueByCategory,
      ordersByStatus,
    })
  } catch (error) {
    console.error('Error fetching sales report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales report' },
      { status: 500 }
    )
  }
}
