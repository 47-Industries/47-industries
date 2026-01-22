import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAffiliateUrl } from '@/lib/affiliate-utils'

// GET - Get affiliate stats for partner dashboard
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        affiliateCode: true,
        shopCommissionRate: true,
        motorevProBonus: true,
        motorevProWindowDays: true,
      },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    // Get aggregate stats
    const [
      totalClicks,
      totalReferrals,
      commissionStats,
      shopStats,
      motorevStats,
      recentReferrals,
      topLinks,
    ] = await Promise.all([
      // Total clicks across all links
      prisma.affiliateClick.count({
        where: { link: { partnerId: partner.id } },
      }),

      // Total referrals
      prisma.affiliateReferral.count({
        where: { partnerId: partner.id },
      }),

      // Commission totals by status
      prisma.affiliateCommission.groupBy({
        by: ['status'],
        where: { partnerId: partner.id },
        _sum: { amount: true },
        _count: true,
      }),

      // Shop-specific stats
      prisma.affiliateReferral.aggregate({
        where: {
          partnerId: partner.id,
          platform: 'SHOP',
        },
        _count: true,
        _sum: { orderTotal: true },
      }),

      // MotoRev-specific stats
      prisma.affiliateReferral.groupBy({
        by: ['eventType'],
        where: {
          partnerId: partner.id,
          platform: 'MOTOREV',
        },
        _count: true,
      }),

      // Recent referrals
      prisma.affiliateReferral.findMany({
        where: { partnerId: partner.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          commission: {
            select: {
              amount: true,
              status: true,
            },
          },
          link: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      }),

      // Top performing links
      prisma.affiliateLink.findMany({
        where: { partnerId: partner.id, isActive: true },
        orderBy: { totalReferrals: 'desc' },
        take: 5,
        select: {
          id: true,
          code: true,
          name: true,
          platform: true,
          targetType: true,
          targetId: true,
          totalClicks: true,
          totalReferrals: true,
          totalRevenue: true,
        },
      }),
    ])

    // Process commission stats
    const pendingCommissions = commissionStats.find(s => s.status === 'PENDING')?._sum.amount || 0
    const approvedCommissions = commissionStats.find(s => s.status === 'APPROVED')?._sum.amount || 0
    const paidCommissions = commissionStats.find(s => s.status === 'PAID')?._sum.amount || 0
    const totalCommissions = Number(pendingCommissions) + Number(approvedCommissions) + Number(paidCommissions)

    // Process MotoRev stats
    const motorevSignups = motorevStats.find(s => s.eventType === 'SIGNUP')?._count || 0
    const motorevProConversions = motorevStats.find(s => s.eventType === 'PRO_CONVERSION')?._count || 0

    // Format top links with URLs
    const formattedTopLinks = topLinks.map(link => ({
      ...link,
      url: getAffiliateUrl(
        link.platform as 'SHOP' | 'MOTOREV',
        link.code,
        link.targetId
      ),
    }))

    return NextResponse.json({
      summary: {
        totalClicks,
        totalReferrals,
        totalCommissions,
        pendingCommissions: Number(pendingCommissions),
        approvedCommissions: Number(approvedCommissions),
        paidCommissions: Number(paidCommissions),
      },
      byPlatform: {
        SHOP: {
          referrals: shopStats._count,
          revenue: Number(shopStats._sum.orderTotal || 0),
          commissionRate: partner.shopCommissionRate,
        },
        MOTOREV: {
          signups: motorevSignups,
          proConversions: motorevProConversions,
          proBonus: partner.motorevProBonus,
          windowDays: partner.motorevProWindowDays,
        },
      },
      recentReferrals: recentReferrals.map(r => ({
        id: r.id,
        platform: r.platform,
        eventType: r.eventType,
        customerEmail: r.customerEmail,
        orderTotal: r.orderTotal ? Number(r.orderTotal) : null,
        commission: r.commission ? {
          amount: Number(r.commission.amount),
          status: r.commission.status,
        } : null,
        linkName: r.link?.name || r.link?.code || null,
        createdAt: r.createdAt,
      })),
      topLinks: formattedTopLinks,
      affiliateCode: partner.affiliateCode,
      settings: {
        shopCommissionRate: partner.shopCommissionRate,
        motorevProBonus: partner.motorevProBonus,
        motorevProWindowDays: partner.motorevProWindowDays,
      },
    })
  } catch (error) {
    console.error('Error fetching affiliate stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch affiliate stats' },
      { status: 500 }
    )
  }
}
