import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/reports/inventory - Get inventory report data
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const LOW_STOCK_THRESHOLD = 10

    // Get all products with inventory info
    const products = await prisma.product.findMany({
      where: { active: true },
      include: {
        category: true,
        _count: {
          select: { orderItems: true },
        },
      },
    })

    // Calculate summary stats
    const totalProducts = products.length
    const lowStockProducts = products.filter(p => p.stock <= LOW_STOCK_THRESHOLD && p.stock > 0)
    const outOfStockProducts = products.filter(p => p.stock === 0)

    // Calculate total inventory value
    const totalInventoryValue = products.reduce((sum, product) => {
      return sum + (Number(product.price) * product.stock)
    }, 0)

    // Products by category
    const categoryMap = new Map<string, { name: string; productCount: number; totalStock: number; value: number }>()
    products.forEach(product => {
      const categoryId = product.categoryId
      const categoryName = product.category?.name || 'Uncategorized'
      const existing = categoryMap.get(categoryId) || {
        name: categoryName,
        productCount: 0,
        totalStock: 0,
        value: 0,
      }
      categoryMap.set(categoryId, {
        name: categoryName,
        productCount: existing.productCount + 1,
        totalStock: existing.totalStock + product.stock,
        value: existing.value + (Number(product.price) * product.stock),
      })
    })

    const inventoryByCategory = Array.from(categoryMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.value - a.value)

    // Low stock items
    const lowStockItems = lowStockProducts.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku || 'N/A',
      stock: product.stock,
      category: product.category?.name || 'Uncategorized',
      price: Number(product.price),
    })).sort((a, b) => a.stock - b.stock)

    // Out of stock items
    const outOfStockItems = outOfStockProducts.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku || 'N/A',
      category: product.category?.name || 'Uncategorized',
      price: Number(product.price),
      lastOrderCount: product._count.orderItems,
    }))

    // Top selling products (by order item count)
    const topMovingProducts = products
      .filter(p => p._count.orderItems > 0)
      .map(product => ({
        id: product.id,
        name: product.name,
        stock: product.stock,
        sold: product._count.orderItems,
        turnoverRate: product.stock > 0 ? product._count.orderItems / product.stock : 0,
      }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10)

    // Slow moving products (in stock but few sales)
    const slowMovingProducts = products
      .filter(p => p.stock > 10 && p._count.orderItems < 5)
      .map(product => ({
        id: product.id,
        name: product.name,
        stock: product.stock,
        sold: product._count.orderItems,
        value: Number(product.price) * product.stock,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    // Get recent stock movements if the model exists
    let recentMovements: any[] = []
    try {
      recentMovements = await prisma.stockMovement.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true } },
        },
      })
    } catch {
      // Model might not exist yet
    }

    // Get active inventory alerts if the model exists
    let activeAlerts: any[] = []
    try {
      activeAlerts = await prisma.inventoryAlert.findMany({
        where: { isResolved: false },
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, stock: true } },
        },
      })
    } catch {
      // Model might not exist yet
    }

    return NextResponse.json({
      summary: {
        totalProducts,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        totalInventoryValue,
      },
      inventoryByCategory,
      lowStockItems,
      outOfStockItems,
      topMovingProducts,
      slowMovingProducts,
      recentMovements,
      activeAlerts,
    })
  } catch (error) {
    console.error('Error fetching inventory report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory report' },
      { status: 500 }
    )
  }
}
