import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - List all affiliate referrals with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const platform = searchParams.get('platform')
    const status = searchParams.get('status')
    const partnerId = searchParams.get('partnerId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build filters
    const where: any = {}

    if (platform) {
      where.platform = platform
    }

    if (partnerId) {
      where.partnerId = partnerId
    }

    if (status) {
      where.commission = { status }
    }

    // Get referrals with pagination
    const [referrals, total, stats] = await Promise.all([
      prisma.affiliateReferral.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          partner: {
            select: {
              id: true,
              name: true,
              partnerNumber: true,
            },
          },
          link: {
            select: {
              code: true,
              name: true,
            },
          },
          commission: {
            select: {
              id: true,
              type: true,
              amount: true,
              status: true,
            },
          },
        },
      }),

      prisma.affiliateReferral.count({ where }),

      // Get aggregate stats
      prisma.affiliateCommission.groupBy({
        by: ['status'],
        _sum: { amount: true },
        _count: true,
      }),
    ])

    // Process stats
    const totalPending = stats.find(s => s.status === 'PENDING')?._sum.amount || 0
    const totalApproved = stats.find(s => s.status === 'APPROVED')?._sum.amount || 0
    const totalPaid = stats.find(s => s.status === 'PAID')?._sum.amount || 0

    return NextResponse.json({
      referrals: referrals.map(r => ({
        id: r.id,
        platform: r.platform,
        eventType: r.eventType,
        orderId: r.orderId,
        motorevUserId: r.motorevUserId,
        customerEmail: r.customerEmail,
        customerName: r.customerName,
        orderTotal: r.orderTotal ? Number(r.orderTotal) : null,
        signupAt: r.signupAt,
        convertedAt: r.convertedAt,
        partner: r.partner,
        link: r.link,
        commission: r.commission ? {
          ...r.commission,
          amount: Number(r.commission.amount),
        } : null,
        createdAt: r.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalPending: Number(totalPending),
        totalApproved: Number(totalApproved),
        totalPaid: Number(totalPaid),
        pendingCount: stats.find(s => s.status === 'PENDING')?._count || 0,
        approvedCount: stats.find(s => s.status === 'APPROVED')?._count || 0,
        paidCount: stats.find(s => s.status === 'PAID')?._count || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching affiliate referrals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch affiliate referrals' },
      { status: 500 }
    )
  }
}
