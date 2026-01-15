import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/invoices/[id] - Get invoice details
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

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        inquiry: true,
        customRequest: true,
        client: {
          select: { id: true, name: true, clientNumber: true },
        },
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

// PUT /api/admin/invoices/[id] - Full invoice update (including line items)
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

    // Calculate totals from items
    const items = body.items.map((item: any) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity || 1,
      unitPrice: parseFloat(item.unitPrice) || 0,
      total: (item.quantity || 1) * (parseFloat(item.unitPrice) || 0),
    }))

    const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0)
    const taxRate = parseFloat(body.taxRate) || 0
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount

    // Get existing invoice to find items to delete
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Find items to delete (existing items not in the new list)
    const newItemIds = items.filter((i: any) => i.id).map((i: any) => i.id)
    const itemsToDelete = existingInvoice.items.filter(i => !newItemIds.includes(i.id))

    // Update invoice
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerCompany: body.customerCompany || null,
        customerPhone: body.customerPhone || null,
        subtotal,
        taxRate,
        taxAmount,
        total,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        notes: body.notes || null,
        internalNotes: body.internalNotes || null,
        status: body.status,
        paidAt: body.status === 'PAID' && !existingInvoice.paidAt ? new Date() : existingInvoice.paidAt,
      },
      include: {
        items: true,
        client: true,
      },
    })

    // Delete removed items
    if (itemsToDelete.length > 0) {
      await prisma.invoiceItem.deleteMany({
        where: { id: { in: itemsToDelete.map(i => i.id) } },
      })
    }

    // Update or create items
    for (const item of items) {
      if (item.id) {
        // Update existing item
        await prisma.invoiceItem.update({
          where: { id: item.id },
          data: {
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          },
        })
      } else {
        // Create new item
        await prisma.invoiceItem.create({
          data: {
            invoiceId: id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          },
        })
      }
    }

    // Update client outstanding if linked
    if (existingInvoice.clientId) {
      const outstandingInvoices = await prisma.invoice.aggregate({
        where: {
          clientId: existingInvoice.clientId,
          status: { in: ['SENT', 'VIEWED', 'OVERDUE'] },
        },
        _sum: { total: true },
      })
      await prisma.client.update({
        where: { id: existingInvoice.clientId },
        data: { totalOutstanding: outstandingInvoices._sum.total || 0 },
      })
    }

    // Fetch updated invoice with items
    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        client: true,
      },
    })

    return NextResponse.json({ success: true, invoice: updatedInvoice })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/invoices/[id] - Partial update invoice (status, notes, etc.)
export async function PATCH(
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
      where: { id },
      data: updateData,
      include: {
        items: true,
      },
    })

    // Update client outstanding if status changed
    if (body.status && invoice.clientId) {
      const outstandingInvoices = await prisma.invoice.aggregate({
        where: {
          clientId: invoice.clientId,
          status: { in: ['SENT', 'VIEWED', 'OVERDUE'] },
        },
        _sum: { total: true },
      })
      await prisma.client.update({
        where: { id: invoice.clientId },
        data: { totalOutstanding: outstandingInvoices._sum.total || 0 },
      })
    }

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get invoice to check client
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: { clientId: true },
    })

    await prisma.invoice.delete({
      where: { id },
    })

    // Update client outstanding if linked
    if (invoice?.clientId) {
      const outstandingInvoices = await prisma.invoice.aggregate({
        where: {
          clientId: invoice.clientId,
          status: { in: ['SENT', 'VIEWED', 'OVERDUE'] },
        },
        _sum: { total: true },
      })
      await prisma.client.update({
        where: { id: invoice.clientId },
        data: { totalOutstanding: outstandingInvoices._sum.total || 0 },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}
