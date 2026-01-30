import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthInfo } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/admin/affiliates/[id] - Get affiliate details
export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await getAdminAuthInfo(req)
    const { id } = await context.params

    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const affiliate = await prisma.userAffiliate.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        referrals: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
    }

    // Calculate stats from referrals
    const proConversions = affiliate.referrals.filter(r => r.eventType === 'PRO_CONVERSION').length
    const successfulReferrals = affiliate.referrals.filter(r => r.convertedAt !== null).length

    return NextResponse.json({
      affiliate: {
        id: affiliate.id,
        affiliateCode: affiliate.affiliateCode,
        totalPoints: affiliate.totalPoints,
        availablePoints: affiliate.availablePoints,
        pointsRedeemed: affiliate.pointsRedeemed,
        totalReferrals: affiliate.totalReferrals,
        successfulReferrals,
        proConversions,
        proTimeEarnedDays: affiliate.proTimeEarnedDays,
        totalEarnings: Number(affiliate.totalEarnings),
        pendingEarnings: Number(affiliate.pendingEarnings),
        motorevProBonus: Number(affiliate.motorevProBonus),
        retentionBonus: Number(affiliate.retentionBonus),
        isPartner: affiliate.isPartner,
        rewardPreference: affiliate.rewardPreference,
        createdAt: affiliate.createdAt,
        user: affiliate.user,
        referrals: affiliate.referrals,
      },
    })
  } catch (error) {
    console.error('Error fetching affiliate:', error)
    return NextResponse.json({ error: 'Failed to fetch affiliate' }, { status: 500 })
  }
}

// PATCH /api/admin/affiliates/[id] - Update affiliate
export async function PATCH(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await getAdminAuthInfo(req)
    const { id } = await context.params

    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const affiliate = await prisma.userAffiliate.findUnique({
      where: { id },
    })

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
    }

    const updateData: any = {}

    // Points
    if (body.totalPoints !== undefined) updateData.totalPoints = parseInt(body.totalPoints) || 0
    if (body.availablePoints !== undefined) updateData.availablePoints = parseInt(body.availablePoints) || 0
    if (body.pointsRedeemed !== undefined) updateData.pointsRedeemed = parseInt(body.pointsRedeemed) || 0

    // Stats
    if (body.totalReferrals !== undefined) updateData.totalReferrals = parseInt(body.totalReferrals) || 0
    if (body.proTimeEarnedDays !== undefined) updateData.proTimeEarnedDays = parseInt(body.proTimeEarnedDays) || 0
    if (body.totalEarnings !== undefined) updateData.totalEarnings = parseFloat(body.totalEarnings) || 0
    if (body.pendingEarnings !== undefined) updateData.pendingEarnings = parseFloat(body.pendingEarnings) || 0

    // Commission rates
    if (body.motorevProBonus !== undefined) updateData.motorevProBonus = parseFloat(body.motorevProBonus) || 0
    if (body.retentionBonus !== undefined) updateData.retentionBonus = parseFloat(body.retentionBonus) || 0

    // Partner status
    if (body.isPartner !== undefined) updateData.isPartner = body.isPartner

    const updated = await prisma.userAffiliate.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json({ affiliate: updated })
  } catch (error) {
    console.error('Error updating affiliate:', error)
    return NextResponse.json({ error: 'Failed to update affiliate' }, { status: 500 })
  }
}

// DELETE /api/admin/affiliates/[id] - Delete affiliate
export async function DELETE(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await getAdminAuthInfo(req)
    const { id } = await context.params

    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is SUPER_ADMIN for delete operations
    if (auth.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only super admins can delete affiliates' }, { status: 403 })
    }

    const affiliate = await prisma.userAffiliate.findUnique({
      where: { id },
    })

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
    }

    // Delete the affiliate (referrals will cascade delete)
    await prisma.userAffiliate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting affiliate:', error)
    return NextResponse.json({ error: 'Failed to delete affiliate' }, { status: 500 })
  }
}
