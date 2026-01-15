import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/partners/commissions/[id] - Get commission details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const commission = await prisma.partnerCommission.findUnique({
      where: { id },
      include: {
        partner: {
          select: { id: true, name: true, partnerNumber: true, email: true },
        },
        lead: {
          select: { id: true, businessName: true, leadNumber: true, email: true },
        },
        payout: true,
      },
    })

    if (!commission) {
      return NextResponse.json({ error: 'Commission not found' }, { status: 404 })
    }

    return NextResponse.json({ commission })
  } catch (error) {
    console.error('Error fetching commission:', error)
    return NextResponse.json({ error: 'Failed to fetch commission' }, { status: 500 })
  }
}

// PUT /api/admin/partners/commissions/[id] - Update commission (approve, etc.)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const commission = await prisma.partnerCommission.update({
      where: { id },
      data: {
        status: body.status,
        amount: body.amount ? parseFloat(body.amount) : undefined,
        notes: body.notes,
      },
      include: {
        partner: {
          select: { id: true, name: true, partnerNumber: true },
        },
        lead: {
          select: { id: true, businessName: true, leadNumber: true },
        },
      },
    })

    return NextResponse.json({ success: true, commission })
  } catch (error) {
    console.error('Error updating commission:', error)
    return NextResponse.json({ error: 'Failed to update commission' }, { status: 500 })
  }
}

// DELETE /api/admin/partners/commissions/[id] - Delete commission
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if commission is part of a payout
    const commission = await prisma.partnerCommission.findUnique({
      where: { id },
    })

    if (commission?.payoutId) {
      return NextResponse.json(
        { error: 'Cannot delete commission that is part of a payout' },
        { status: 400 }
      )
    }

    await prisma.partnerCommission.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting commission:', error)
    return NextResponse.json({ error: 'Failed to delete commission' }, { status: 500 })
  }
}
