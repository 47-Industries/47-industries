import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/account/client/contracts - Get contracts for authenticated client
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

    // Fetch contracts for this client
    const contracts = await prisma.contract.findMany({
      where: { clientId: user.client.id },
      select: {
        id: true,
        contractNumber: true,
        title: true,
        description: true,
        totalValue: true,
        monthlyValue: true,
        status: true,
        fileUrl: true,
        // Signature fields
        signedAt: true,
        signedByName: true,
        signatureUrl: true,
        // Countersignature fields
        countersignedAt: true,
        countersignedByName: true,
        countersignatureUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ contracts })
  } catch (error) {
    console.error('Error fetching contracts:', error)
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 })
  }
}
