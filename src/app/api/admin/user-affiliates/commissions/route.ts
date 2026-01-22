import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/user-affiliates/commissions
// Lists all user affiliate commissions with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const status = req.nextUrl.searchParams.get('status')
    const rewardType = req.nextUrl.searchParams.get('rewardType')

    // Build where clause
    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }
    if (rewardType && rewardType !== 'all') {
      where.rewardType = rewardType
    }

    // Fetch commissions
    const commissions = await prisma.userAffiliateCommission.findMany({
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
        referral: {
          select: {
            platform: true,
            eventType: true,
            motorevEmail: true,
            orderTotal: true,
            retentionMonth: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({
      commissions: commissions.map(c => ({
        id: c.id,
        type: c.type,
        baseAmount: Number(c.baseAmount),
        rate: c.rate ? Number(c.rate) : null,
        amount: Number(c.amount),
        rewardType: c.rewardType,
        proTimeDays: c.proTimeDays,
        status: c.status,
        userAffiliate: c.userAffiliate,
        referral: {
          platform: c.referral.platform,
          eventType: c.referral.eventType,
          motorevEmail: c.referral.motorevEmail,
          orderTotal: c.referral.orderTotal ? Number(c.referral.orderTotal) : null,
          retentionMonth: c.referral.retentionMonth,
        },
        createdAt: c.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching user affiliate commissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch commissions' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/user-affiliates/commissions
// Bulk update commission statuses (approve, etc.)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { commissionIds, action } = body

    if (!commissionIds || !Array.isArray(commissionIds) || commissionIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid commissionIds' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // Approve selected commissions
      const result = await prisma.userAffiliateCommission.updateMany({
        where: {
          id: { in: commissionIds },
          status: 'PENDING',
        },
        data: {
          status: 'APPROVED',
          updatedAt: new Date(),
        },
      })

      // Update affiliate stats for approved cash commissions
      const approvedCommissions = await prisma.userAffiliateCommission.findMany({
        where: {
          id: { in: commissionIds },
          status: 'APPROVED',
        },
        select: {
          userAffiliateId: true,
          amount: true,
          rewardType: true,
        },
      })

      // Group by affiliate and sum amounts
      const affiliateUpdates: Record<string, { cash: number; pending: number }> = {}
      for (const c of approvedCommissions) {
        if (!affiliateUpdates[c.userAffiliateId]) {
          affiliateUpdates[c.userAffiliateId] = { cash: 0, pending: 0 }
        }
        if (c.rewardType === 'CASH') {
          affiliateUpdates[c.userAffiliateId].cash += Number(c.amount)
          affiliateUpdates[c.userAffiliateId].pending -= Number(c.amount)
        }
      }

      // Update each affiliate's stats
      for (const [affiliateId, amounts] of Object.entries(affiliateUpdates)) {
        await prisma.userAffiliate.update({
          where: { id: affiliateId },
          data: {
            totalEarnings: { increment: amounts.cash },
            pendingEarnings: { increment: amounts.pending },
          },
        })
      }

      return NextResponse.json({
        success: true,
        updated: result.count,
      })
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating commissions:', error)
    return NextResponse.json(
      { error: 'Failed to update commissions' },
      { status: 500 }
    )
  }
}
