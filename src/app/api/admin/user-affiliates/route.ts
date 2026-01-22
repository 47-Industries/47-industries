import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/user-affiliates
// Lists all user affiliates with stats
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all user affiliates
    const affiliates = await prisma.userAffiliate.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        partner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate stats
    const totalAffiliates = affiliates.length
    const connectedAffiliates = affiliates.filter(a => a.connectedAt).length

    // Get pending cash commissions
    const pendingCash = await prisma.userAffiliateCommission.aggregate({
      where: {
        status: 'PENDING',
        rewardType: 'CASH',
      },
      _sum: { amount: true },
      _count: true,
    })

    // Get pending Pro Time credits
    const pendingProTime = await prisma.userAffiliateCommission.aggregate({
      where: {
        status: 'PENDING',
        rewardType: 'PRO_TIME',
      },
      _sum: { proTimeDays: true },
      _count: true,
    })

    return NextResponse.json({
      affiliates: affiliates.map(a => ({
        id: a.id,
        affiliateCode: a.affiliateCode,
        motorevUserId: a.motorevUserId,
        motorevEmail: a.motorevEmail,
        connectedAt: a.connectedAt?.toISOString() || null,
        shopCommissionRate: Number(a.shopCommissionRate),
        motorevProBonus: Number(a.motorevProBonus),
        retentionBonus: Number(a.retentionBonus),
        isPartner: a.isPartner,
        totalReferrals: a.totalReferrals,
        totalEarnings: Number(a.totalEarnings),
        pendingEarnings: Number(a.pendingEarnings),
        proTimeEarnedDays: a.proTimeEarnedDays,
        rewardPreference: a.rewardPreference,
        // Points system
        totalPoints: a.totalPoints,
        availablePoints: a.availablePoints,
        pointsRedeemed: a.pointsRedeemed,
        user: a.user,
        partner: a.partner,
        createdAt: a.createdAt.toISOString(),
      })),
      stats: {
        totalAffiliates,
        connectedAffiliates,
        pendingCashTotal: Number(pendingCash._sum.amount || 0),
        pendingCashCount: pendingCash._count,
        pendingProTimeDays: pendingProTime._sum.proTimeDays || 0,
        pendingProTimeCount: pendingProTime._count,
      },
    })
  } catch (error) {
    console.error('Error fetching user affiliates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user affiliates' },
      { status: 500 }
    )
  }
}
