import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

// POST /api/admin/invoices/[id]/payment-link - Generate Stripe payment link
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { items: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Create Stripe payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: invoice.items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.description,
          },
          unit_amount: Math.round(parseFloat(item.unitPrice.toString()) * 100), // Convert to cents
        },
        quantity: item.quantity,
      })),
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?invoice=${invoice.invoiceNumber}`,
        },
      },
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      },
      custom_fields: [
        {
          key: 'invoice_number',
          label: {
            type: 'custom',
            custom: 'Invoice Number',
          },
          type: 'text',
          optional: true,
          text: {
            default_value: invoice.invoiceNumber,
          },
        },
      ],
    })

    // Update invoice with Stripe payment link
    await prisma.invoice.update({
      where: { id: params.id },
      data: {
        stripePaymentLink: paymentLink.url,
        status: 'SENT',
        sentAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      paymentLink: paymentLink.url,
    })
  } catch (error) {
    console.error('Error creating payment link:', error)
    return NextResponse.json(
      { error: 'Failed to create payment link' },
      { status: 500 }
    )
  }
}
