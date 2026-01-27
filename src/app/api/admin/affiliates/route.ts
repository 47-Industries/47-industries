import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthInfo } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

// GET /api/admin/affiliates - List all affiliates
export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)
    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''

    const where: any = {}

    if (search) {
      where.OR = [
        { affiliateCode: { contains: search, mode: 'insensitive' } },
        { customCode: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [affiliates, total] = await Promise.all([
      prisma.userAffiliate.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          _count: {
            select: {
              referrals: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.userAffiliate.count({ where }),
    ])

    // Transform data to include calculated stats
    const transformedAffiliates = affiliates.map((affiliate) => ({
      id: affiliate.id,
      affiliateCode: affiliate.affiliateCode,
      customCode: affiliate.customCode,
      totalPoints: affiliate.totalPoints,
      availablePoints: affiliate.availablePoints,
      redeemedPoints: affiliate.redeemedPoints,
      totalReferrals: affiliate._count.referrals,
      successfulReferrals: affiliate.successfulReferrals,
      proConversions: affiliate.proConversions,
      totalEarnings: affiliate.totalEarnings,
      tier: affiliate.tier,
      partnerEligible: affiliate.partnerEligible,
      createdAt: affiliate.createdAt,
      user: affiliate.user,
    }))

    return NextResponse.json({
      affiliates: transformedAffiliates,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching affiliates:', error)
    return NextResponse.json({ error: 'Failed to fetch affiliates' }, { status: 500 })
  }
}
