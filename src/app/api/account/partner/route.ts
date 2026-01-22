import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/account/partner - Get current user's partner dashboard data
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
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
    })
  } catch (error) {
    console.error('Error fetching partner data:', error)
    return NextResponse.json({ error: 'Failed to fetch partner data' }, { status: 500 })
  }
}
