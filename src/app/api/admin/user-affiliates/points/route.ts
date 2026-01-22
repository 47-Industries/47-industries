import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { adminAdjustPoints } from '@/lib/user-affiliate-points'

// GET /api/admin/user-affiliates/points
// Lists all point transactions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const affiliateId = searchParams.get('affiliateId')

    const where = affiliateId ? { userAffiliateId: affiliateId } : {}

    const transactions = await prisma.pointTransaction.findMany({
      where,
      include: {
        userAffiliate: {
          select: {
            id: true,
            affiliateCode: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Get aggregate stats
    const totalStats = await prisma.pointTransaction.aggregate({
      _sum: { points: true },
      _count: true,
    })

    const redemptions = await prisma.pointRedemption.findMany({
      where: affiliateId ? { userAffiliateId: affiliateId } : {},
      include: {
        userAffiliate: {
          select: {
            affiliateCode: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        points: t.points,
        description: t.description,
        motorevEmail: t.motorevEmail,
        createdAt: t.createdAt.toISOString(),
        userAffiliate: t.userAffiliate,
      })),
      redemptions: redemptions.map(r => ({
        id: r.id,
        pointsRedeemed: r.pointsRedeemed,
        proDaysGranted: r.proDaysGranted,
        status: r.status,
        appliedAt: r.appliedAt?.toISOString(),
        failureReason: r.failureReason,
        createdAt: r.createdAt.toISOString(),
        affiliateName: r.userAffiliate.user.name,
        affiliateCode: r.userAffiliate.affiliateCode,
      })),
      stats: {
        totalPointsAwarded: totalStats._sum.points || 0,
        totalTransactions: totalStats._count,
      },
    })
  } catch (error) {
    console.error('Error fetching point transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch point transactions' },
      { status: 500 }
    )
  }
}

// POST /api/admin/user-affiliates/points
// Manually adjust points for an affiliate
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { userAffiliateId, points, reason } = body

    if (!userAffiliateId || points === undefined || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: userAffiliateId, points, reason' },
        { status: 400 }
      )
    }

    if (typeof points !== 'number' || isNaN(points)) {
      return NextResponse.json(
        { error: 'Points must be a number' },
        { status: 400 }
      )
    }

    const transaction = await adminAdjustPoints(
      userAffiliateId,
      points,
      reason,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        type: transaction.type,
        points: transaction.points,
        description: transaction.description,
        createdAt: transaction.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error adjusting points:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to adjust points' },
      { status: 500 }
    )
  }
}
