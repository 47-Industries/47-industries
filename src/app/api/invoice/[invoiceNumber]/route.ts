import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe, isStripeConfigured } from '@/lib/stripe'

// GET /api/invoice/[invoiceNumber] - Public endpoint to view invoice
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceNumber: string }> }
) {
  try {
    const { invoiceNumber } = await params

    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        items: true,
        inquiry: {
          select: {
            inquiryNumber: true,
            serviceType: true,
            description: true,
          },
        },
        customRequest: {
          select: {
            requestNumber: true,
            material: true,
            finish: true,
            color: true,
            quantity: true,
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Block access to DRAFT invoices - customer shouldn't see these
    if (invoice.status === 'DRAFT') {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Update viewedAt timestamp if not already viewed
    if (!invoice.viewedAt) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          viewedAt: new Date(),
          status: invoice.status === 'SENT' ? 'VIEWED' : invoice.status,
        },
      })
    }

    // Auto-generate payment link if missing and invoice is unpaid
    let stripePaymentLink = invoice.stripePaymentLink
    const isPaid = invoice.status === 'PAID'
    const isCancelled = invoice.status === 'CANCELLED'

    if (!stripePaymentLink && !isPaid && !isCancelled && isStripeConfigured && stripe) {
      try {
        const newPaymentLink = await stripe.paymentLinks.create({
          line_items: invoice.items.map((item) => ({
            price_data: {
              currency: 'usd',
              product_data: {
                name: item.description,
              },
              unit_amount: Math.round(parseFloat(item.unitPrice.toString()) * 100),
            },
            quantity: item.quantity,
          })),
          after_completion: {
            type: 'redirect',
            redirect: {
              url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://47industries.com'}/payment/success?invoice=${invoice.invoiceNumber}`,
            },
          },
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
          },
        })

        stripePaymentLink = newPaymentLink.url

        // Save the payment link for future use
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { stripePaymentLink },
        })
      } catch (stripeError) {
        console.error('Failed to auto-generate payment link:', stripeError)
      }
    }

    // Return invoice data (excluding internal notes and createdBy)
    const publicInvoice = {
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerCompany: invoice.customerCompany,
      customerPhone: invoice.customerPhone,
      items: invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      status: invoice.status,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt,
      notes: invoice.notes,
      stripePaymentLink,
      createdAt: invoice.createdAt,
      inquiry: invoice.inquiry,
      customRequest: invoice.customRequest,
    }

    return NextResponse.json({ invoice: publicInvoice })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}
