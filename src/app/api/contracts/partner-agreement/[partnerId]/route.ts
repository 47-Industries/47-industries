import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/contracts/partner-agreement/[partnerId] - Get partner data for agreement
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  try {
    const { partnerId } = await params

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        partnerNumber: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        firstSaleRate: true,
        recurringRate: true,
        createdAt: true,
        contract: {
          select: {
            signedAt: true,
          },
        },
      },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    return NextResponse.json({
      partner: {
        ...partner,
        firstSaleRate: Number(partner.firstSaleRate),
        recurringRate: Number(partner.recurringRate),
      },
    })
  } catch (error) {
    console.error('Error fetching partner for agreement:', error)
    return NextResponse.json({ error: 'Failed to fetch partner' }, { status: 500 })
  }
}
