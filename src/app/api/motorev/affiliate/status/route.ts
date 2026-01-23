import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { POINTS } from '@/lib/user-affiliate-points'

// GET /api/motorev/affiliate/status?motorevUserId=xxx
// Returns the affiliate status for a MotoRev user
// Auth: X-API-Key header (shared secret)
export async function GET(req: NextRequest) {
  try {
    // Validate API key
    const apiKey = req.headers.get('x-api-key')
    const expectedKey = process.env.MOTOREV_AFFILIATE_API_KEY

    if (!expectedKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const motorevUserId = req.nextUrl.searchParams.get('motorevUserId')

    if (!motorevUserId) {
      return NextResponse.json(
        { error: 'Missing required parameter: motorevUserId' },
        { status: 400 }
      )
    }

    // Find the user affiliate by MotoRev user ID
    const userAffiliate = await prisma.userAffiliate.findFirst({
      where: { motorevUserId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        partner: {
          select: {
            id: true,
            name: true,
            shopCommissionRate: true,
            motorevProBonus: true,
          },
        },
      },
    })

    // Also check for Partner record directly (for users who may have become partners/store affiliates)
    let partner = null
    let pendingApplication = null

    if (userAffiliate) {
      partner = await prisma.partner.findUnique({
        where: { userId: userAffiliate.user.id },
        select: {
          partnerType: true,
          shopCommissionRate: true,
          status: true,
        },
      })

      // Check for pending applications
      pendingApplication = await prisma.partnerApplication.findFirst({
        where: {
          userId: userAffiliate.user.id,
          status: 'PENDING',
        },
        select: {
          type: true,
          status: true,
        },
      })
    }

    if (!userAffiliate) {
      return NextResponse.json({
        connected: false,
        message: 'No 47 Industries account connected',
      })
    }

    // Determine commission rates (use partner rates if upgraded)
    const isPartner = userAffiliate.isPartner && userAffiliate.partner
    const rates = isPartner && userAffiliate.partner
      ? {
          shopCommissionRate: Number(userAffiliate.partner.shopCommissionRate),
          motorevProBonus: Number(userAffiliate.partner.motorevProBonus),
          retentionBonus: Number(userAffiliate.retentionBonus), // Partners use same retention
        }
      : {
          shopCommissionRate: Number(userAffiliate.shopCommissionRate),
          motorevProBonus: Number(userAffiliate.motorevProBonus),
          retentionBonus: Number(userAffiliate.retentionBonus),
        }

    // Calculate points progress
    const availablePoints = userAffiliate.totalPoints - userAffiliate.pointsRedeemed
    const pointsToNextReward = POINTS.REDEMPTION_THRESHOLD - (availablePoints % POINTS.REDEMPTION_THRESHOLD)
    const progressPercent = Math.round(
      ((availablePoints % POINTS.REDEMPTION_THRESHOLD) / POINTS.REDEMPTION_THRESHOLD) * 100
    )

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
      connected: true,
      affiliateCode: userAffiliate.affiliateCode,
      user: {
        id: userAffiliate.user.id,
        email: userAffiliate.user.email,
        name: userAffiliate.user.name,
      },
      rewardPreference: userAffiliate.rewardPreference,
      isPartner: userAffiliate.isPartner,
      stats: {
        totalReferrals: userAffiliate.totalReferrals,
        totalEarnings: Number(userAffiliate.totalEarnings),
        pendingEarnings: Number(userAffiliate.pendingEarnings),
        proTimeEarnedDays: userAffiliate.proTimeEarnedDays,
      },
      // Points system data
      points: {
        total: userAffiliate.totalPoints,
        available: availablePoints,
        redeemed: userAffiliate.pointsRedeemed,
        toNextReward: availablePoints >= POINTS.REDEMPTION_THRESHOLD ? 0 : pointsToNextReward,
        progressPercent,
      },
      // Partner/Store Affiliate info
      partnerInfo,
      partnerEligible: userAffiliate.totalReferrals >= POINTS.PARTNER_CTA_THRESHOLD && !partnerInfo.isPartner,
      shareLink: `https://motorev.app/signup?ref=${userAffiliate.affiliateCode}`,
      rates,
      connectedAt: userAffiliate.connectedAt,
    })
  } catch (error) {
    console.error('Error fetching affiliate status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch affiliate status' },
      { status: 500 }
    )
  }
}
