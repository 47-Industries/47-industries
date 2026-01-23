import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getAffiliatePointsStats,
  getRecentPointTransactions,
} from '@/lib/user-affiliate-points'

// GET /api/account/affiliate
// Get affiliate dashboard data with points stats and partner info
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

    // Get partner info (if user is a partner or store affiliate)
    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
      select: {
        partnerType: true,
        shopCommissionRate: true,
        status: true,
      },
    })

    // Check for pending applications
    const pendingApplication = await prisma.partnerApplication.findFirst({
      where: {
        userId: session.user.id,
        status: 'PENDING',
      },
      select: {
        type: true,
        status: true,
      },
    })

    // Build partner info
    const partnerInfo = {
      isPartner: partner?.partnerType === 'BOTH' || partner?.partnerType === 'SERVICE_REFERRAL',
      isStoreAffiliate: partner?.partnerType === 'BOTH' || partner?.partnerType === 'PRODUCT_AFFILIATE',
      partnerType: partner?.partnerType ?? null,
      partnerStatus: partner?.status ?? null,
      shopCommissionRate: partner?.shopCommissionRate ? Number(partner.shopCommissionRate) : null,
      pendingApplication: pendingApplication ?? null,
    }

    return NextResponse.json({
      stats,
      partnerInfo,
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
