import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/account/partner/payouts - Get partner's payout history
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

    const payouts = await prisma.partnerPayout.findMany({
      where: { partnerId: partner.id },
      include: {
        commissions: {
          select: { id: true, amount: true, type: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get totals
    const totalPaid = await prisma.partnerPayout.aggregate({
      where: { partnerId: partner.id, status: 'PAID' },
      _sum: { amount: true },
    })

    const pendingPayouts = await prisma.partnerPayout.aggregate({
      where: { partnerId: partner.id, status: 'PENDING' },
      _sum: { amount: true },
    })

    return NextResponse.json({
      payouts,
      totals: {
        totalPaid: totalPaid._sum.amount || 0,
        pending: pendingPayouts._sum.amount || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching payouts:', error)
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
  }
}
