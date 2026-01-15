import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/contracts/[contractNumber]
// Public route for viewing contracts (by contract number)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contractNumber: string }> }
) {
  try {
    const { contractNumber } = await params

    const contract = await prisma.contract.findUnique({
      where: { contractNumber },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            clientNumber: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Only allow viewing if contract is SENT, SIGNED, or ACTIVE
    if (contract.status === 'DRAFT') {
      return NextResponse.json(
        { error: 'This contract is not available for viewing' },
        { status: 403 }
      )
    }

    return NextResponse.json({ contract })
  } catch (error) {
    console.error('Error fetching contract:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
      { status: 500 }
    )
  }
}
