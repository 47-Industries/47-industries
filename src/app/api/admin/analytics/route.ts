import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthInfo } from '@/lib/auth-helper'

import { prisma } from '@/lib/prisma'

// GET /api/admin/analytics - Get analytics data
export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)
    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '7d' // 24h, 7d, 30d, 90d

    // Calculate date range
    const now = new Date()
    let startDate: Date
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Clean up stale sessions (inactive for more than 45 seconds)
    // Heartbeat runs every 30s, so missing one means user left
    const cutoffTime = new Date(now.getTime() - 45 * 1000)
    await prisma.activeSession.deleteMany({
      where: {
        lastActive: { lt: cutoffTime }
      }
    })

    // Get active users with location data
    const activeSessions = await prisma.activeSession.findMany({
      where: {
        lastActive: { gte: cutoffTime }
      },
      select: {
        id: true,
        sessionId: true,
        currentPage: true,
        lastActive: true,
        country: true,
        countryCode: true,
        region: true,
        city: true,
        latitude: true,
        longitude: true
      }
    })
    const activeUsers = activeSessions.length

    // Get total page views in period
    const totalPageViews = await prisma.pageView.count({
      where: {
        createdAt: { gte: startDate }
      }
    })

    // Get unique visitors in period
    const uniqueVisitors = await prisma.pageView.groupBy({
      by: ['visitorId'],
      where: {
        createdAt: { gte: startDate }
      }
    })

    // Get unique sessions in period
    const uniqueSessions = await prisma.pageView.groupBy({
      by: ['sessionId'],
      where: {
        createdAt: { gte: startDate }
      }
    })

    // Get top pages
    const topPages = await prisma.pageView.groupBy({
      by: ['path'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } },
      take: 10
    })

    // Get traffic by device
    const deviceStats = await prisma.pageView.groupBy({
      by: ['device'],
      where: {
        createdAt: { gte: startDate },
        device: { not: null }
      },
      _count: { device: true }
    })

    // Get traffic by browser
    const browserStats = await prisma.pageView.groupBy({
      by: ['browser'],
      where: {
        createdAt: { gte: startDate },
        browser: { not: null }
      },
      _count: { browser: true },
      orderBy: { _count: { browser: 'desc' } },
      take: 5
    })

    // Get page views over time (daily breakdown)
    const pageViewsByDay = await getPageViewsByDay(startDate, now)

    // Get referrer stats
    const referrerStats = await prisma.pageView.groupBy({
      by: ['referrer'],
      where: {
        createdAt: { gte: startDate },
        referrer: { not: null }
      },
      _count: { referrer: true },
      orderBy: { _count: { referrer: 'desc' } },
      take: 10
    })

    // Get abandoned carts
    const abandonedCarts = await prisma.abandonedCart.findMany({
      where: {
        createdAt: { gte: startDate },
        recoveredAt: null
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    const abandonedCartValue = await prisma.abandonedCart.aggregate({
      where: {
        createdAt: { gte: startDate },
        recoveredAt: null
      },
      _sum: { totalValue: true },
      _count: true
    })

    return NextResponse.json({
      activeUsers,
      activeSessions: activeSessions.map(s => ({
        id: s.id,
        currentPage: s.currentPage,
        lastActive: s.lastActive,
        country: s.country,
        countryCode: s.countryCode,
        region: s.region,
        city: s.city,
        latitude: s.latitude,
        longitude: s.longitude
      })),
      totalPageViews,
      uniqueVisitors: uniqueVisitors.length,
      uniqueSessions: uniqueSessions.length,
      topPages: topPages.map(p => ({ path: p.path, views: p._count.path })),
      deviceStats: deviceStats.map(d => ({ device: d.device, count: d._count.device })),
      browserStats: browserStats.map(b => ({ browser: b.browser, count: b._count.browser })),
      pageViewsByDay,
      referrerStats: referrerStats.map(r => ({
        referrer: r.referrer ? new URL(r.referrer).hostname : 'Direct',
        count: r._count.referrer
      })),
      abandonedCarts: {
        count: abandonedCartValue._count,
        totalValue: abandonedCartValue._sum.totalValue || 0,
        items: abandonedCarts
      },
      period
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

async function getPageViewsByDay(startDate: Date, endDate: Date) {
  const pageViews = await prisma.pageView.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      createdAt: true
    }
  })

  // Group by day
  const byDay: Record<string, number> = {}
  pageViews.forEach(pv => {
    const day = pv.createdAt.toISOString().split('T')[0]
    byDay[day] = (byDay[day] || 0) + 1
  })

  // Fill in missing days with 0
  const result: { date: string; views: number }[] = []
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    result.push({ date: dateStr, views: byDay[dateStr] || 0 })
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return result
}
