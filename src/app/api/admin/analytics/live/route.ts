import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthInfo } from '@/lib/auth-helper'

import { prisma } from '@/lib/prisma'

// GET /api/admin/analytics/live - Get live analytics data (active users, etc)
export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)
    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Clean up stale sessions (inactive for more than 45 seconds)
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

    // Get page views in the last hour
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000)
    const recentPageViews = await prisma.pageView.count({
      where: {
        createdAt: { gte: lastHour }
      }
    })

    // Get orders in the last 24 hours
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: last24h }
      },
      select: {
        id: true,
        total: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    const todayRevenue = recentOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)

    return NextResponse.json({
      activeUsers: activeSessions.length,
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
      recentPageViews,
      recentOrders: recentOrders.length,
      todayRevenue,
      timestamp: now.toISOString()
    })
  } catch (error) {
    console.error('Live analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch live analytics' }, { status: 500 })
  }
}
