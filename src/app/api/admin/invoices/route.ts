import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth, getAdminAuthInfo } from '@/lib/auth-helper'
import { stripe, isStripeConfigured } from '@/lib/stripe'

// POST /api/admin/invoices - Create a new invoice
export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const auth = await getAdminAuthInfo(req)

    const body = await req.json()

    // Validate required fields
    if (!body.customerName || !body.customerEmail || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Customer name, email, and at least one item are required' },
        { status: 400 }
      )
    }

    // Generate invoice number
    const date = new Date()
    const prefix = 'INV'
    const timestamp = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0')
    const count = await prisma.invoice.count()
    const invoiceNumber = `${prefix}-${timestamp}-${(count + 1).toString().padStart(4, '0')}`

    // Calculate totals
    const items = body.items.map((item: any) => ({
      description: item.description,
      quantity: item.quantity || 1,
      unitPrice: parseFloat(item.unitPrice),
      total: (item.quantity || 1) * parseFloat(item.unitPrice),
    }))

    const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0)
    const taxRate = parseFloat(body.taxRate || '0')
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId: body.clientId || null,
        inquiryId: body.inquiryId || null,
        customRequestId: body.customRequestId || null,
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
        isRecurring: body.isRecurring || false,
        recurringDay: body.recurringDay ? parseInt(body.recurringDay) : null,
        createdBy: auth.userId,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
        client: true,
      },
    })

    // If linked to a client, update client's outstanding balance
    if (body.clientId) {
      const outstandingInvoices = await prisma.invoice.aggregate({
        where: {
          clientId: body.clientId,
          status: { in: ['SENT', 'VIEWED', 'OVERDUE'] },
        },
        _sum: { total: true },
      })
      await prisma.client.update({
        where: { id: body.clientId },
        data: { totalOutstanding: outstandingInvoices._sum.total || 0 },
      })
    }

    // Auto-generate Stripe payment link
    let updatedInvoice = invoice
    if (isStripeConfigured && stripe) {
      try {
        const stripePaymentLink = await stripe.paymentLinks.create({
          line_items: items.map((item: any) => ({
            price_data: {
              currency: 'usd',
              product_data: {
                name: item.description,
              },
              unit_amount: Math.round(item.unitPrice * 100),
            },
            quantity: item.quantity,
          })),
          after_completion: {
            type: 'redirect',
            redirect: {
              url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://47industries.com'}/payment/success?invoice=${invoiceNumber}`,
            },
          },
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoiceNumber,
          },
        })

        updatedInvoice = await prisma.invoice.update({
          where: { id: invoice.id },
          data: { stripePaymentLink: stripePaymentLink.url },
          include: { items: true, client: true },
        })
      } catch (stripeError) {
        console.error('Failed to create Stripe payment link:', stripeError)
        // Continue without payment link - can be generated later
      }
    }

    return NextResponse.json({ success: true, invoice: updatedInvoice })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}

// GET /api/admin/invoices - List all invoices
export async function GET(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
      ]
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        items: true,
        client: {
          select: { id: true, name: true, clientNumber: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}
