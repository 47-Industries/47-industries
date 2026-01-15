import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth, getAdminAuthInfo } from '@/lib/auth-helper'

// GET /api/admin/invoices/[id]/payments - List payments for an invoice
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

    const payments = await prisma.invoicePayment.findMany({
      where: { invoiceId: id },
      orderBy: { paidAt: 'desc' },
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

// POST /api/admin/invoices/[id]/payments - Record a new payment
export async function POST(
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

    // Validate required fields
    if (!body.amount || !body.method) {
      return NextResponse.json(
        { error: 'Amount and payment method are required' },
        { status: 400 }
      )
    }

    const amount = parseFloat(body.amount)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    // Get the invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: {
        id: true,
        total: true,
        amountPaid: true,
        status: true,
        clientId: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const total = parseFloat(invoice.total.toString())
    const currentPaid = parseFloat(invoice.amountPaid.toString())
    const newAmountPaid = currentPaid + amount

    // Check if payment exceeds remaining balance
    const remaining = total - currentPaid
    if (amount > remaining + 0.01) { // Small buffer for floating point
      return NextResponse.json(
        { error: `Payment amount ($${amount.toFixed(2)}) exceeds remaining balance ($${remaining.toFixed(2)})` },
        { status: 400 }
      )
    }

    // Create the payment record
    const payment = await prisma.invoicePayment.create({
      data: {
        invoiceId: id,
        amount,
        method: body.method,
        reference: body.reference || null,
        stripePaymentId: body.stripePaymentId || null,
        notes: body.notes || null,
        paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
        recordedBy: auth.userId,
      },
    })

    // Update invoice amountPaid and status
    const isFullyPaid = newAmountPaid >= total - 0.01 // Small buffer for floating point
    const updateData: any = {
      amountPaid: newAmountPaid,
    }

    if (isFullyPaid) {
      updateData.status = 'PAID'
      updateData.paidAt = new Date()
      // Also set legacy fields for backward compatibility
      updateData.paymentMethod = body.method
      updateData.paymentReference = body.reference || null
    } else if (invoice.status === 'DRAFT') {
      // If draft and receiving payment, move to SENT at minimum
      updateData.status = 'SENT'
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        payments: {
          orderBy: { paidAt: 'desc' },
        },
      },
    })

    // Update client outstanding if linked
    if (invoice.clientId) {
      const outstandingInvoices = await prisma.invoice.aggregate({
        where: {
          clientId: invoice.clientId,
          status: { in: ['SENT', 'VIEWED', 'OVERDUE'] },
        },
        _sum: { total: true },
      })

      // Subtract amount paid from outstanding invoices
      const paidOnOutstanding = await prisma.invoice.aggregate({
        where: {
          clientId: invoice.clientId,
          status: { in: ['SENT', 'VIEWED', 'OVERDUE'] },
        },
        _sum: { amountPaid: true },
      })

      const outstanding = (outstandingInvoices._sum.total || 0) - (paidOnOutstanding._sum.amountPaid || 0)

      await prisma.client.update({
        where: { id: invoice.clientId },
        data: { totalOutstanding: Math.max(0, outstanding) },
      })
    }

    return NextResponse.json({
      success: true,
      payment,
      invoice: updatedInvoice,
      isFullyPaid,
    })
  } catch (error) {
    console.error('Error recording payment:', error)
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    )
  }
}
