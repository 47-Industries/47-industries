import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import jwt from 'jsonwebtoken'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAffiliatePointsStats, getRecentPointTransactions } from '@/lib/user-affiliate-points'

// Helper to get user ID from either NextAuth session or bearer token
async function getUserId(request: NextRequest): Promise<string | null> {
  // First try NextAuth session (web)
  const session = await getServerSession(authOptions)
  if (session?.user?.id) {
    return session.user.id
  }

  // Then try JWT token (mobile)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7)
      const decoded = jwt.verify(
        token,
        process.env.NEXTAUTH_SECRET || 'fallback-secret'
      ) as { userId: string }
      return decoded.userId
    } catch {
      return null
    }
  }
  return null
}

// GET /api/account/partner - Get current user's partner dashboard data
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const partner = await prisma.partner.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            title: true,
          },
        },
        contract: true,
        leads: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        commissions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            lead: {
              select: { businessName: true, leadNumber: true },
            },
          },
        },
        payouts: {
          where: { status: 'PAID' },
          orderBy: { paidAt: 'desc' },
          take: 3,
        },
        referredProjects: {
          include: {
            client: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        // Affiliate data
        affiliateLinks: {
          orderBy: { createdAt: 'desc' },
        },
        affiliateReferrals: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            link: true,
            commission: true,
          },
        },
        affiliateCommissions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            referral: true,
          },
        },
      },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Not a partner' }, { status: 404 })
    }

    // Calculate totals
    const totalEarned = await prisma.partnerCommission.aggregate({
      where: { partnerId: partner.id },
      _sum: { amount: true },
    })

    const pendingAmount = await prisma.partnerCommission.aggregate({
      where: { partnerId: partner.id, status: 'PENDING' },
      _sum: { amount: true },
    })

    const totalPaid = await prisma.partnerPayout.aggregate({
      where: { partnerId: partner.id, status: 'PAID' },
      _sum: { amount: true },
    })

    const leadStats = await prisma.partnerLead.groupBy({
      by: ['status'],
      where: { partnerId: partner.id },
      _count: true,
    })

    // Affiliate commission stats
    const affiliateTotalEarned = await prisma.affiliateCommission.aggregate({
      where: { partnerId: partner.id },
      _sum: { amount: true },
    })

    const affiliatePendingAmount = await prisma.affiliateCommission.aggregate({
      where: { partnerId: partner.id, status: 'PENDING' },
      _sum: { amount: true },
    })

    // Affiliate referral stats
    const affiliateReferralStats = await prisma.affiliateReferral.groupBy({
      by: ['platform', 'eventType'],
      where: { partnerId: partner.id },
      _count: true,
    })

    // Total link clicks
    const totalClicks = await prisma.affiliateLink.aggregate({
      where: { partnerId: partner.id },
      _sum: { totalClicks: true },
    })

    // Get MotoRev affiliate (UserAffiliate) data if exists
    const userAffiliate = await prisma.userAffiliate.findUnique({
      where: { userId },
      select: { id: true },
    })

    let motorevAffiliate = null
    let motorevRecentActivity: any[] = []

    if (userAffiliate) {
      motorevAffiliate = await getAffiliatePointsStats(userAffiliate.id)
      const recentTx = await getRecentPointTransactions(userAffiliate.id, 5)
      motorevRecentActivity = recentTx.map((tx) => ({
        ...tx,
        createdAt: tx.createdAt.toISOString(),
      }))
    }

    return NextResponse.json({
      partner: {
        ...partner,
        // Service referral stats
        totalEarned: Number(totalEarned._sum.amount || 0),
        pendingAmount: Number(pendingAmount._sum.amount || 0),
        totalPaid: Number(totalPaid._sum.amount || 0),
        leadStats: leadStats.reduce((acc, curr) => {
          acc[curr.status] = curr._count
          return acc
        }, {} as Record<string, number>),
        // Affiliate stats
        affiliateTotalEarned: Number(affiliateTotalEarned._sum.amount || 0),
        affiliatePendingAmount: Number(affiliatePendingAmount._sum.amount || 0),
        affiliateReferralStats: affiliateReferralStats.reduce((acc, curr) => {
          const key = `${curr.platform}_${curr.eventType}`
          acc[key] = curr._count
          return acc
        }, {} as Record<string, number>),
        totalClicks: Number(totalClicks._sum.totalClicks || 0),
      },
      // MotoRev affiliate data (UserAffiliate points system)
      motorevAffiliate,
      motorevRecentActivity,
    })
  } catch (error) {
    console.error('Error fetching partner data:', error)
    return NextResponse.json({ error: 'Failed to fetch partner data' }, { status: 500 })
  }
}

// PATCH /api/account/partner - Update partner profile (phone, etc.)
export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const partner = await prisma.partner.findUnique({
      where: { userId },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Not a partner' }, { status: 404 })
    }

    const body = await req.json()
    const { phone } = body

    // Validate phone if provided
    if (phone !== undefined) {
      if (phone && typeof phone === 'string') {
        // Basic validation - should have at least 10 digits
        const digitsOnly = phone.replace(/\D/g, '')
        if (digitsOnly.length < 10) {
          return NextResponse.json({ error: 'Phone number must have at least 10 digits' }, { status: 400 })
        }
      }
    }

    // Update partner
    const updatedPartner = await prisma.partner.update({
      where: { id: partner.id },
      data: {
        ...(phone !== undefined && { phone: phone || null }),
      },
    })

    return NextResponse.json({
      success: true,
      partner: updatedPartner,
    })
  } catch (error) {
    console.error('Error updating partner:', error)
    return NextResponse.json({ error: 'Failed to update partner' }, { status: 500 })
  }
}
