import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatProTimeDuration } from '@/lib/user-affiliate-utils'

// GET /api/motorev/affiliate/dashboard?motorevUserId=xxx
// Returns detailed dashboard data for a MotoRev affiliate
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

    if (!userAffiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      )
    }

    // Get this month's stats
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Count referrals this month
    const thisMonthReferrals = await prisma.userAffiliateReferral.count({
      where: {
        userAffiliateId: userAffiliate.id,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    })

    // Sum earnings this month
    const thisMonthCommissions = await prisma.userAffiliateCommission.aggregate({
      where: {
        userAffiliateId: userAffiliate.id,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        rewardType: 'CASH',
      },
      _sum: {
        amount: true,
      },
    })

    // Sum Pro time earned this month
    const thisMonthProTime = await prisma.userAffiliateCommission.aggregate({
      where: {
        userAffiliateId: userAffiliate.id,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        rewardType: 'PRO_TIME',
      },
      _sum: {
        proTimeDays: true,
      },
    })

    // Get recent activity (last 10 items)
    const recentActivity = await prisma.userAffiliateReferral.findMany({
      where: {
        userAffiliateId: userAffiliate.id,
      },
      include: {
        commission: {
          select: {
            amount: true,
            rewardType: true,
            proTimeDays: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    // Format activity for display
    const formattedActivity = recentActivity.map((referral) => {
      let description = ''
      let rewardText = 'pending'

      if (referral.eventType === 'SIGNUP') {
        description = `${referral.motorevEmail || 'User'} signed up`
      } else if (referral.eventType === 'PRO_CONVERSION') {
        description = `${referral.motorevEmail || 'User'} went Pro`
      } else if (referral.eventType === 'RETENTION') {
        description = `${referral.motorevEmail || 'User'} - Month ${referral.retentionMonth} retention`
      } else if (referral.eventType === 'ORDER') {
        description = `Shop order $${Number(referral.orderTotal || 0).toFixed(2)}`
      }

      if (referral.commission) {
        if (referral.commission.status === 'PENDING') {
          rewardText = 'pending'
        } else if (referral.commission.rewardType === 'CASH') {
          rewardText = `+$${Number(referral.commission.amount).toFixed(2)}`
        } else if (referral.commission.rewardType === 'PRO_TIME' && referral.commission.proTimeDays) {
          rewardText = `+${referral.commission.proTimeDays}d Pro`
        }
      }

      return {
        id: referral.id,
        description,
        rewardText,
        platform: referral.platform,
        eventType: referral.eventType,
        date: referral.createdAt.toISOString(),
        status: referral.commission?.status || 'PENDING',
      }
    })

    // Determine commission rates
    const isPartner = userAffiliate.isPartner && userAffiliate.partner
    const rates = isPartner && userAffiliate.partner
      ? {
          shopCommissionRate: Number(userAffiliate.partner.shopCommissionRate),
          motorevProBonus: Number(userAffiliate.partner.motorevProBonus),
          retentionBonus: Number(userAffiliate.retentionBonus),
        }
      : {
          shopCommissionRate: Number(userAffiliate.shopCommissionRate),
          motorevProBonus: Number(userAffiliate.motorevProBonus),
          retentionBonus: Number(userAffiliate.retentionBonus),
        }

    return NextResponse.json({
      affiliateCode: userAffiliate.affiliateCode,
      rewardPreference: userAffiliate.rewardPreference,
      isPartner: userAffiliate.isPartner,
      rates,
      allTime: {
        totalReferrals: userAffiliate.totalReferrals,
        totalEarnings: Number(userAffiliate.totalEarnings),
        pendingEarnings: Number(userAffiliate.pendingEarnings),
        proTimeEarnedDays: userAffiliate.proTimeEarnedDays,
        proTimeFormatted: formatProTimeDuration(userAffiliate.proTimeEarnedDays),
      },
      thisMonth: {
        referrals: thisMonthReferrals,
        earnings: Number(thisMonthCommissions._sum.amount || 0),
        proTimeDays: thisMonthProTime._sum.proTimeDays || 0,
        proTimeFormatted: formatProTimeDuration(thisMonthProTime._sum.proTimeDays || 0),
      },
      recentActivity: formattedActivity,
      partnerUpgradeUrl: 'https://47industries.com/become-partner',
    })
  } catch (error) {
    console.error('Error fetching affiliate dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
