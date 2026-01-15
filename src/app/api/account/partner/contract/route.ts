import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/account/partner/contract - Get partner's contract
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
      include: {
        contract: true,
      },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Not a partner' }, { status: 404 })
    }

    if (!partner.contract) {
      return NextResponse.json({ error: 'No contract found' }, { status: 404 })
    }

    return NextResponse.json({
      contract: partner.contract,
      commissionRates: {
        firstSaleRate: partner.firstSaleRate,
        recurringRate: partner.recurringRate,
        commissionType: partner.commissionType,
      },
    })
  } catch (error) {
    console.error('Error fetching contract:', error)
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 })
  }
}
