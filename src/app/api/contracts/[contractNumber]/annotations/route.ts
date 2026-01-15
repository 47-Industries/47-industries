import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/contracts/[contractNumber]/annotations
// Save annotations for a contract (public - for signers)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contractNumber: string }> }
) {
  try {
    const { contractNumber } = await params
    const { annotations } = await req.json()

    // Find the contract
    const contract = await prisma.contract.findUnique({
      where: { contractNumber },
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Only allow annotations on SENT contracts (not already signed)
    if (contract.status !== 'SENT') {
      return NextResponse.json(
        { error: 'This contract cannot be annotated' },
        { status: 403 }
      )
    }

    // Update annotations
    const updated = await prisma.contract.update({
      where: { contractNumber },
      data: {
        annotations: annotations,
      },
    })

    return NextResponse.json({
      success: true,
      annotations: updated.annotations,
    })
  } catch (error) {
    console.error('Error saving annotations:', error)
    return NextResponse.json(
      { error: 'Failed to save annotations' },
      { status: 500 }
    )
  }
}

// GET /api/contracts/[contractNumber]/annotations
// Get annotations for a contract
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contractNumber: string }> }
) {
  try {
    const { contractNumber } = await params

    const contract = await prisma.contract.findUnique({
      where: { contractNumber },
      select: {
        annotations: true,
        status: true,
      },
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    return NextResponse.json({
      annotations: contract.annotations || [],
      status: contract.status,
    })
  } catch (error) {
    console.error('Error fetching annotations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch annotations' },
      { status: 500 }
    )
  }
}
