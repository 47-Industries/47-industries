import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/account/client/amendments - Get amendments for authenticated client
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user and their linked client
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        client: {
          select: { id: true },
        },
      },
    })

    if (!user?.client) {
      return NextResponse.json({ error: 'No client account linked' }, { status: 404 })
    }

    // Fetch amendments for this client's contracts
    const amendments = await prisma.contractAmendment.findMany({
      where: {
        clientContract: {
          clientId: user.client.id,
        },
        // Only show amendments that have been sent or later
        status: {
          in: ['SENT', 'SIGNED', 'ACTIVE'],
        },
      },
      include: {
        clientContract: {
          select: {
            id: true,
            title: true,
            contractNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ amendments })
  } catch (error) {
    console.error('Error fetching client amendments:', error)
    return NextResponse.json({ error: 'Failed to fetch amendments' }, { status: 500 })
  }
}
