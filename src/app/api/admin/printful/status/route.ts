import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrintfulStatus, isPrintfulConfigured } from '@/lib/printful'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Printful is configured
    const isConfigured = isPrintfulConfigured()

    if (!isConfigured) {
      return NextResponse.json({
        connected: false,
        configured: false,
        error: 'Printful API key not configured',
      })
    }

    // Get Printful connection status
    const status = await getPrintfulStatus()

    // Get last sync info
    const lastSyncedProduct = await prisma.product.findFirst({
      where: {
        printfulSyncedAt: { not: null },
      },
      orderBy: { printfulSyncedAt: 'desc' },
      select: { printfulSyncedAt: true },
    })

    // Get counts
    const [printfulProductCount, printfulOrderCount, failedOrderCount] = await Promise.all([
      prisma.product.count({
        where: { fulfillmentType: 'PRINTFUL' },
      }),
      prisma.printfulOrder.count(),
      prisma.printfulOrder.count({
        where: { status: 'FAILED' },
      }),
    ])

    return NextResponse.json({
      ...status,
      configured: true,
      lastSyncedAt: lastSyncedProduct?.printfulSyncedAt || null,
      stats: {
        products: printfulProductCount,
        totalOrders: printfulOrderCount,
        failedOrders: failedOrderCount,
      },
    })
  } catch (error) {
    console.error('Printful status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check Printful status' },
      { status: 500 }
    )
  }
}
