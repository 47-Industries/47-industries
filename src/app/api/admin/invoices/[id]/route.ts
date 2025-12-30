import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminAuthInfo } from '@/lib/admin-auth'

// GET /api/admin/invoices/[id] - Get invoice details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAdminAuthInfo(req)

    if (!auth.isFounder && !auth.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        inquiry: true,
        customRequest: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/invoices/[id] - Update invoice
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAdminAuthInfo(req)

    if (!auth.isFounder && !auth.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()

    const updateData: any = {}

    if (body.status) updateData.status = body.status
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.internalNotes !== undefined) updateData.internalNotes = body.internalNotes
    if (body.dueDate) updateData.dueDate = new Date(body.dueDate)
    if (body.paidAt) updateData.paidAt = new Date(body.paidAt)
    if (body.sentAt) updateData.sentAt = new Date(body.sentAt)
    if (body.viewedAt) updateData.viewedAt = new Date(body.viewedAt)
    if (body.stripePaymentLink) updateData.stripePaymentLink = body.stripePaymentLink
    if (body.stripePaymentId) updateData.stripePaymentId = body.stripePaymentId

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        items: true,
      },
    })

    return NextResponse.json({ success: true, invoice })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/invoices/[id] - Delete invoice
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAdminAuthInfo(req)

    if (!auth.isFounder && !auth.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.invoice.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}
