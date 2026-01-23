import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    // Build where clause
    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }
    if (type && type !== 'all') {
      where.type = type
    }

    // Fetch applications with user info
    const applications = await prisma.partnerApplication.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            userAffiliate: {
              select: {
                affiliateCode: true,
                totalReferrals: true,
                totalPoints: true,
              },
            },
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // PENDING first
        { createdAt: 'desc' },
      ],
    })

    // Get stats
    const [total, pending, approved, rejected] = await Promise.all([
      prisma.partnerApplication.count(),
      prisma.partnerApplication.count({ where: { status: 'PENDING' } }),
      prisma.partnerApplication.count({ where: { status: 'APPROVED' } }),
      prisma.partnerApplication.count({ where: { status: 'REJECTED' } }),
    ])

    return NextResponse.json({
      applications,
      stats: { total, pending, approved, rejected },
    })
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}
