import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/account/partner/commissions - Get partner's commissions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Not a partner' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: any = { partnerId: partner.id }

    if (status && status !== 'all') {
      where.status = status
    }

    const commissions = await prisma.partnerCommission.findMany({
      where,
      include: {
        lead: {
          select: { id: true, businessName: true, leadNumber: true },
        },
        payout: {
          select: { id: true, payoutNumber: true, status: true, paidAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get totals
    const totals = await prisma.partnerCommission.aggregate({
      where: { partnerId: partner.id },
      _sum: { amount: true },
    })

    const pendingTotal = await prisma.partnerCommission.aggregate({
      where: { partnerId: partner.id, status: 'PENDING' },
      _sum: { amount: true },
    })

    return NextResponse.json({
      commissions,
      totals: {
        total: totals._sum.amount || 0,
        pending: pendingTotal._sum.amount || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching commissions:', error)
    return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 })
  }
}
