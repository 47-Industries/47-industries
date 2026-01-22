import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getAffiliatePointsStats,
  getRecentPointTransactions,
} from '@/lib/user-affiliate-points'

// GET /api/account/affiliate
// Get affiliate dashboard data with points stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has a UserAffiliate record
    const userAffiliate = await prisma.userAffiliate.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!userAffiliate) {
      return NextResponse.json(
        { error: 'No affiliate account found. Please connect your MotoRev account first.' },
        { status: 404 }
      )
    }

    // Get points stats
    const stats = await getAffiliatePointsStats(userAffiliate.id)

    if (!stats) {
      return NextResponse.json(
        { error: 'Failed to load affiliate stats' },
        { status: 500 }
      )
    }

    // Get recent activity
    const recentActivity = await getRecentPointTransactions(userAffiliate.id, 10)

    return NextResponse.json({
      stats,
      recentActivity: recentActivity.map((tx) => ({
        ...tx,
        createdAt: tx.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching affiliate dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch affiliate data' },
      { status: 500 }
    )
  }
}
