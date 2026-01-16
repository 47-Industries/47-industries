import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/account/partner/amendments - Get amendments for authenticated partner
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get partner for this user
    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
      include: {
        contract: {
          select: { id: true },
        },
      },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Not a partner' }, { status: 403 })
    }

    if (!partner.contract) {
      return NextResponse.json({ amendments: [] })
    }

    // Fetch amendments for this partner's contract
    const amendments = await prisma.contractAmendment.findMany({
      where: {
        partnerContractId: partner.contract.id,
        // Only show amendments that have been sent or later
        status: {
          in: ['SENT', 'SIGNED', 'ACTIVE'],
        },
      },
      include: {
        partnerContract: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ amendments })
  } catch (error) {
    console.error('Error fetching partner amendments:', error)
    return NextResponse.json({ error: 'Failed to fetch amendments' }, { status: 500 })
  }
}
