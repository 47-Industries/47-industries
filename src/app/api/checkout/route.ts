import { NextRequest, NextResponse } from 'next/server'
import { stripe, formatAmountForStripe, isStripeConfigured } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

interface CheckoutItem {
  productId: string
  name: string
  price: number
  quantity: number
  image: string | null
}

interface ShippingInfo {
  email: string
  name: string
  phone: string
  address1: string
  address2: string
  city: string
  state: string
  zipCode: string
  country: string
}

// Generate order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `47-${timestamp}-${random}`
}

export async function POST(req: NextRequest) {
  try {
    if (!isStripeConfigured) {
      return NextResponse.json(
        { error: 'Payment processing is not configured' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { items, shipping } = body as {
      items: CheckoutItem[]
      shipping: ShippingInfo
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      )
    }

    if (!shipping?.email || !shipping?.name || !shipping?.address1) {
      return NextResponse.json(
        { error: 'Missing shipping information' },
        { status: 400 }
      )
    }

    // Verify products exist and get current prices
    const productIds = items.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        active: true,
      },
    })

    if (products.length !== items.length) {
      return NextResponse.json(
        { error: 'Some products are no longer available' },
        { status: 400 }
      )
    }

    // Create line items for Stripe with current database prices
    const lineItems = items.map(item => {
      const product = products.find(p => p.id === item.productId)
      if (!product) {
        throw new Error(`Product ${item.productId} not found`)
      }

      // Use database price, not client-provided price
      const price = Number(product.price)
      const images = product.images as string[]

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            images: images?.length > 0 ? [images[0]] : [],
            metadata: {
              productId: product.id,
            },
          },
          unit_amount: formatAmountForStripe(price),
        },
        quantity: item.quantity,
      }
    })

    // Calculate subtotal
    const subtotal = items.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId)
      return total + (Number(product?.price) || 0) * item.quantity
    }, 0)

    // Generate order number
    const orderNumber = generateOrderNumber()

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      customer_email: shipping.email,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: subtotal >= 50 ? 0 : 799, // Free shipping over $50
              currency: 'usd',
            },
            display_name: subtotal >= 50 ? 'Free Shipping' : 'Standard Shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 5 },
              maximum: { unit: 'business_day', value: 10 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 1499,
              currency: 'usd',
            },
            display_name: 'Express Shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 2 },
              maximum: { unit: 'business_day', value: 3 },
            },
          },
        },
      ],
      automatic_tax: {
        enabled: true,
      },
      metadata: {
        orderNumber,
        customerName: shipping.name,
        customerEmail: shipping.email,
        customerPhone: shipping.phone || '',
        items: JSON.stringify(
          items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          }))
        ),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cart`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
