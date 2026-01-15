import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth, getAdminAuthInfo } from '@/lib/auth-helper'

// GET /api/admin/partners/payouts/[id] - Get payout details
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

    const payout = await prisma.partnerPayout.findUnique({
      where: { id },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            partnerNumber: true,
            email: true,
            zelleEmail: true,
            zellePhone: true,
            venmoUsername: true,
            cashAppTag: true,
            mailingAddress: true,
            stripeConnectId: true,
            stripeConnectStatus: true,
          },
        },
        commissions: {
          include: {
            lead: {
              select: { id: true, businessName: true, leadNumber: true },
            },
          },
        },
      },
    })

    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
    }

    return NextResponse.json({ payout })
  } catch (error) {
    console.error('Error fetching payout:', error)
    return NextResponse.json({ error: 'Failed to fetch payout' }, { status: 500 })
  }
}

// PUT /api/admin/partners/payouts/[id] - Update payout (mark as paid, etc.)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const auth = await getAdminAuthInfo(req)
    const { id } = await params
    const body = await req.json()

    const updateData: any = {
      method: body.method,
      reference: body.reference,
      notes: body.notes,
    }

    // If marking as paid
    if (body.status === 'PAID') {
      updateData.status = 'PAID'
      updateData.paidAt = new Date()
      updateData.paidBy = auth.userId
    } else if (body.status) {
      updateData.status = body.status
    }

    const payout = await prisma.partnerPayout.update({
      where: { id },
      data: updateData,
      include: {
        partner: {
          select: { id: true, name: true, partnerNumber: true, email: true },
        },
        commissions: true,
      },
    })

    // If marked as paid, update all commissions to PAID status
    if (body.status === 'PAID') {
      await prisma.partnerCommission.updateMany({
        where: { payoutId: id },
        data: { status: 'PAID' },
      })
    }

    return NextResponse.json({ success: true, payout })
  } catch (error) {
    console.error('Error updating payout:', error)
    return NextResponse.json({ error: 'Failed to update payout' }, { status: 500 })
  }
}

// DELETE /api/admin/partners/payouts/[id] - Cancel/delete payout
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

    const payout = await prisma.partnerPayout.findUnique({
      where: { id },
    })

    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
    }

    if (payout.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cannot delete a completed payout' },
        { status: 400 }
      )
    }

    // Unlink commissions from this payout
    await prisma.partnerCommission.updateMany({
      where: { payoutId: id },
      data: { payoutId: null, status: 'PENDING' },
    })

    // Delete the payout
    await prisma.partnerPayout.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting payout:', error)
    return NextResponse.json({ error: 'Failed to delete payout' }, { status: 500 })
  }
}
