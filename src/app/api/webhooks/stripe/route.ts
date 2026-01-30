import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, formatAmountFromStripe, isStripeConfigured } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { sendOrderConfirmation, sendDigitalProductDelivery, sendPaymentFailureNotification, sendInvoicePaymentConfirmation } from '@/lib/email'
import Stripe from 'stripe'
import { randomBytes } from 'crypto'
import { calculateShopCommission } from '@/lib/affiliate-utils'

export async function POST(req: NextRequest) {
  if (!isStripeConfigured) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    )
  }

  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('Missing stripe-signature header')
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSessionCompleted(session)
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment succeeded:', paymentIntent.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.error('Payment failed:', paymentIntent.id)
        await handlePaymentFailed(paymentIntent)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {}

  // Check if this is an invoice payment
  if (metadata.invoiceId) {
    await handleInvoicePayment(session)
    return
  }

  const orderNumber = metadata.orderNumber
  const customerEmail = session.customer_email || metadata.customerEmail
  const customerName = metadata.customerName || 'Customer'

  if (!orderNumber) {
    console.error('No order number in session metadata')
    return
  }

  // Check if order already exists
  const existingOrder = await prisma.order.findUnique({
    where: { orderNumber },
  })

  if (existingOrder) {
    console.log('Order already exists:', orderNumber)
    // Update payment status if needed
    if (existingOrder.paymentStatus !== 'SUCCEEDED') {
      await prisma.order.update({
        where: { orderNumber },
        data: {
          paymentStatus: 'SUCCEEDED',
          status: 'PAID',
          stripePaymentId: session.payment_intent as string,
        },
      })
    }
    return
  }

  // Parse items from metadata
  let items: { productId: string; variantId?: string; quantity: number; productType?: string; customization?: Record<string, any> }[] = []
  try {
    items = JSON.parse(metadata.items || '[]')
  } catch (e) {
    console.error('Failed to parse items:', e)
  }

  const isDigitalOnly = metadata.isDigitalOnly === 'true'

  // Get product details
  const productIds = items.map(item => item.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  })

  // Calculate totals
  const subtotal = items.reduce((total, item) => {
    const product = products.find(p => p.id === item.productId)
    return total + (Number(product?.price) || 0) * item.quantity
  }, 0)

  const amountTotal = session.amount_total ? formatAmountFromStripe(session.amount_total) : subtotal
  const amountSubtotal = session.amount_subtotal ? formatAmountFromStripe(session.amount_subtotal) : subtotal
  const shipping = session.total_details?.amount_shipping
    ? formatAmountFromStripe(session.total_details.amount_shipping)
    : 0
  const tax = session.total_details?.amount_tax
    ? formatAmountFromStripe(session.total_details.amount_tax)
    : 0

  // Get shipping address from Stripe (cast to access property)
  const sessionWithShipping = session as any
  const shippingDetails = sessionWithShipping.shipping_details

  // Try to find existing user by email to link order
  let userId: string | null = null
  if (customerEmail) {
    const existingUser = await prisma.user.findUnique({
      where: { email: customerEmail },
      select: { id: true },
    })
    userId = existingUser?.id || null
  }

  // Get affiliate tracking data from metadata
  const affiliateCode = metadata.affiliateCode || null
  const affiliatePartnerId = metadata.affiliatePartnerId || null

  // Get external source data (for orders from BookFade, etc.)
  const source = metadata.source || null
  const sourceOrderId = metadata.sourceOrderId || null
  let sourceData = null
  if (metadata.sourceData) {
    try {
      sourceData = JSON.parse(metadata.sourceData)
    } catch (e) {
      sourceData = null
    }
  }
  // Also include shipping address in sourceData if present
  if (metadata.shippingAddress && !sourceData?.shippingAddress) {
    try {
      const shippingAddress = JSON.parse(metadata.shippingAddress)
      sourceData = { ...sourceData, shippingAddress }
    } catch (e) {
      // ignore
    }
  }

  // Create order with items
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      customerName,
      customerEmail: customerEmail || '',
      customerPhone: metadata.customerPhone || null,
      subtotal: amountSubtotal,
      tax,
      shipping,
      total: amountTotal,
      status: 'PAID',
      paymentStatus: 'SUCCEEDED',
      stripeSessionId: session.id,
      stripePaymentId: session.payment_intent as string,
      // Affiliate tracking
      affiliateCode,
      affiliatePartnerId,
      // External source tracking
      source,
      sourceOrderId,
      sourceData,
      items: {
        create: items.map(item => {
          const product = products.find(p => p.id === item.productId)
          const images = product?.images as string[] | null

          return {
            productId: item.productId,
            name: product?.name || 'Unknown Product',
            price: Number(product?.price) || 0,
            quantity: item.quantity,
            total: (Number(product?.price) || 0) * item.quantity,
            image: images?.[0] || null,
            sku: product?.sku || null,
            variantId: item.variantId || null,
            customization: item.customization || null,
          }
        }),
      },
    },
    include: {
      items: true,
    },
  })

  // Update product stock (only for physical products)
  for (const item of items) {
    const product = products.find(p => p.id === item.productId)
    // Only decrement stock for physical products
    if (product?.productType !== 'DIGITAL') {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      })
    }
  }

  console.log('Order created:', order.orderNumber)

  // Create affiliate referral and commission if this order has affiliate attribution
  if (affiliatePartnerId) {
    try {
      // Get partner's commission rate
      const partner = await prisma.partner.findUnique({
        where: { id: affiliatePartnerId },
        select: {
          id: true,
          shopCommissionRate: true,
          affiliateLinks: {
            where: { platform: 'SHOP', isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true },
          },
        },
      })

      if (partner) {
        const commissionRate = Number(partner.shopCommissionRate) || 5.00
        const commissionAmount = calculateShopCommission(amountTotal, commissionRate)
        const linkId = partner.affiliateLinks[0]?.id || null

        // Create referral and commission in a transaction
        await prisma.$transaction(async (tx) => {
          // Create the referral
          const referral = await tx.affiliateReferral.create({
            data: {
              partnerId: affiliatePartnerId,
              linkId,
              platform: 'SHOP',
              eventType: 'ORDER',
              orderId: order.id,
              customerEmail: customerEmail || null,
              customerName: customerName || null,
              orderTotal: amountTotal,
            },
          })

          // Create the commission
          await tx.affiliateCommission.create({
            data: {
              partnerId: affiliatePartnerId,
              referralId: referral.id,
              type: 'SHOP_ORDER',
              baseAmount: amountTotal,
              rate: commissionRate,
              amount: commissionAmount,
              status: 'PENDING',
              notes: `Order ${orderNumber}`,
            },
          })

          // Update affiliate link stats if applicable
          if (linkId) {
            await tx.affiliateLink.update({
              where: { id: linkId },
              data: {
                totalReferrals: { increment: 1 },
                totalRevenue: { increment: amountTotal },
              },
            })
          }
        })

        console.log(`Affiliate commission created for partner ${affiliatePartnerId}: $${commissionAmount}`)
      }
    } catch (affiliateError) {
      // Don't fail the order if affiliate tracking fails
      console.error('Failed to create affiliate referral/commission:', affiliateError)
    }
  }

  // Check if order contains any digital products
  const digitalProducts = products.filter(p => p.productType === 'DIGITAL')
  const hasDigitalProducts = digitalProducts.length > 0

  // Create download tokens for digital products
  const digitalDownloads: Array<{
    name: string
    downloadUrl: string
    downloadToken: string
    expiresAt: Date
    downloadLimit: number
  }> = []

  if (hasDigitalProducts) {
    for (const product of digitalProducts) {
      const orderItem = order.items.find(item => item.productId === product.id)
      if (!orderItem) continue

      // Generate unique download token
      const downloadToken = randomBytes(32).toString('hex')

      // Calculate expiry date
      const expiryDays = product.downloadExpiry || 30
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiryDays)

      // Create digital download record
      await prisma.digitalDownload.create({
        data: {
          productId: product.id,
          orderId: order.id,
          orderItemId: orderItem.id,
          downloadToken,
          downloadCount: 0,
          maxDownloads: product.downloadLimit,
          expiresAt,
          customerEmail: customerEmail || '',
        },
      })

      digitalDownloads.push({
        name: product.name,
        downloadUrl: product.digitalFileUrl || '',
        downloadToken,
        expiresAt,
        downloadLimit: product.downloadLimit || 5,
      })
    }
  }

  // Send appropriate email based on order type
  if (customerEmail) {
    try {
      if (isDigitalOnly && digitalDownloads.length > 0) {
        // Send digital product delivery email
        await sendDigitalProductDelivery({
          to: customerEmail,
          name: customerName,
          orderNumber,
          items: digitalDownloads,
          total: amountTotal,
        })
        console.log('Digital product delivery email sent to:', customerEmail)
      } else {
        // Send standard order confirmation
        await sendOrderConfirmation({
          to: customerEmail,
          name: customerName,
          orderNumber,
          items: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: Number(item.price),
          })),
          subtotal: amountSubtotal,
          shipping,
          tax,
          total: amountTotal,
        })
        console.log('Order confirmation email sent to:', customerEmail)

        // If mixed order (both physical and digital), also send digital download email
        if (digitalDownloads.length > 0) {
          await sendDigitalProductDelivery({
            to: customerEmail,
            name: customerName,
            orderNumber,
            items: digitalDownloads,
            total: amountTotal,
          })
          console.log('Digital product delivery email also sent for mixed order')
        }
      }
    } catch (emailError) {
      console.error('Failed to send email:', emailError)
    }
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata || {}
  const customerEmail = paymentIntent.receipt_email || metadata.customerEmail
  const customerName = metadata.customerName || 'Customer'
  const orderNumber = metadata.orderNumber

  if (!customerEmail) {
    console.log('No customer email for payment failure notification')
    return
  }

  const amount = paymentIntent.amount ? formatAmountFromStripe(paymentIntent.amount) : 0
  const failureMessage = paymentIntent.last_payment_error?.message

  try {
    await sendPaymentFailureNotification({
      to: customerEmail,
      name: customerName,
      orderNumber,
      amount,
      reason: failureMessage,
    })
    console.log('Payment failure notification sent to:', customerEmail)
  } catch (emailError) {
    console.error('Failed to send payment failure email:', emailError)
  }
}

async function handleInvoicePayment(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {}
  const invoiceId = metadata.invoiceId
  const invoiceNumber = metadata.invoiceNumber

  if (!invoiceId) {
    console.error('No invoice ID in session metadata')
    return
  }

  console.log('Processing invoice payment:', invoiceNumber)

  // Find the invoice
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true },
  })

  if (!invoice) {
    console.error('Invoice not found:', invoiceId)
    return
  }

  // Check if already paid
  if (invoice.status === 'PAID') {
    console.log('Invoice already paid:', invoiceNumber)
    return
  }

  // Update invoice status
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      stripePaymentId: session.payment_intent as string || session.id,
    },
  })

  console.log('Invoice marked as paid:', invoiceNumber)

  // Send payment confirmation email
  try {
    await sendInvoicePaymentConfirmation({
      to: invoice.customerEmail,
      name: invoice.customerName,
      invoiceNumber: invoice.invoiceNumber,
      total: parseFloat(invoice.total.toString()),
      items: invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        total: parseFloat(item.total.toString()),
      })),
    })
    console.log('Invoice payment confirmation sent to:', invoice.customerEmail)
  } catch (emailError) {
    console.error('Failed to send invoice payment confirmation:', emailError)
  }
}
