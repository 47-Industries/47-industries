import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, formatAmountFromStripe, isStripeConfigured } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { sendOrderConfirmation } from '@/lib/email'
import Stripe from 'stripe'

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
        // TODO: Send failure email to customer
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
  let items: { productId: string; quantity: number }[] = []
  try {
    items = JSON.parse(metadata.items || '[]')
  } catch (e) {
    console.error('Failed to parse items:', e)
  }

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
          }
        }),
      },
    },
    include: {
      items: true,
    },
  })

  // Update product stock
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        stock: {
          decrement: item.quantity,
        },
      },
    })
  }

  console.log('Order created:', order.orderNumber)

  // Send order confirmation email
  if (customerEmail) {
    try {
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
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError)
    }
  }
}
