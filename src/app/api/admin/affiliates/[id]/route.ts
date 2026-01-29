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
          include: {
            referredUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
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
        customCode: null, // Not in schema
        totalPoints: affiliate.totalPoints,
        availablePoints: affiliate.availablePoints,
        redeemedPoints: affiliate.pointsRedeemed,
        totalReferrals: affiliate.totalReferrals,
        successfulReferrals,
        proConversions,
        proDaysEarned: affiliate.proTimeEarnedDays,
        totalEarnings: Number(affiliate.totalEarnings),
        tier: 'BRONZE', // Not in schema - default
        partnerEligible: affiliate.isPartner,
        isPartner: affiliate.isPartner,
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
    const { totalPoints, availablePoints, isPartner } = body

    const affiliate = await prisma.userAffiliate.findUnique({
      where: { id },
    })

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (totalPoints !== undefined) updateData.totalPoints = parseInt(totalPoints) || 0
    if (availablePoints !== undefined) updateData.availablePoints = parseInt(availablePoints) || 0
    if (isPartner !== undefined) updateData.isPartner = isPartner

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
