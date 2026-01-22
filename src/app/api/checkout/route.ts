import { NextRequest, NextResponse } from 'next/server'
import { stripe, formatAmountForStripe, isStripeConfigured } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { isFeatureEnabled } from '@/lib/features'
import { AFFILIATE_COOKIE_NAME } from '@/lib/affiliate-utils'
import { cookies } from 'next/headers'

interface CheckoutItem {
  productId: string
  name: string
  price: number
  quantity: number
  image: string | null
  productType?: 'PHYSICAL' | 'DIGITAL'
}

interface ShippingInfo {
  email: string
  name?: string
  phone?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}

interface ShippingRate {
  id: string
  carrier: string
  service: string
  serviceName: string
  price: number
  deliveryDays: number | null
  isRealTime: boolean
}

// Generate order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `47-${timestamp}-${random}`
}

export async function POST(req: NextRequest) {
  try {
    // Check if shop is enabled
    const shopEnabled = await isFeatureEnabled('shopEnabled')
    if (!shopEnabled) {
      return NextResponse.json(
        { error: 'Shop is currently unavailable' },
        { status: 404 }
      )
    }

    if (!isStripeConfigured) {
      return NextResponse.json(
        { error: 'Payment processing is not configured' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { items, shipping, shippingRate, shipmentId, tax, isDigitalOnly, affiliateCode: bodyAffiliateCode } = body as {
      items: CheckoutItem[]
      shipping: ShippingInfo
      shippingRate?: ShippingRate | null
      shipmentId?: string | null
      tax?: number
      isDigitalOnly?: boolean
      affiliateCode?: string
    }

    // Get affiliate code from request body or cookie
    let affiliateCode = bodyAffiliateCode
    let affiliatePartnerId: string | null = null

    if (!affiliateCode) {
      // Try to get from cookie
      const cookieStore = await cookies()
      affiliateCode = cookieStore.get(AFFILIATE_COOKIE_NAME)?.value || undefined
    }

    // Resolve partner from affiliate code
    if (affiliateCode) {
      const partner = await prisma.partner.findFirst({
        where: {
          affiliateCode: affiliateCode,
          status: 'ACTIVE',
        },
        select: { id: true },
      })
      if (partner) {
        affiliatePartnerId = partner.id
      }
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      )
    }

    // For digital-only orders, we only need email
    if (isDigitalOnly) {
      if (!shipping?.email) {
        return NextResponse.json(
          { error: 'Email is required for digital products' },
          { status: 400 }
        )
      }
    } else {
      // For physical products, we need full shipping info
      if (!shipping?.email || !shipping?.name || !shipping?.address1) {
        return NextResponse.json(
          { error: 'Missing shipping information' },
          { status: 400 }
        )
      }
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

    // Determine shipping cost and options
    const shippingCost = isDigitalOnly ? 0 : (shippingRate?.price || 0)
    const taxAmount = tax || 0

    // Build shipping options for Stripe (only for physical products)
    const stripeShippingOptions: any[] = []

    if (!isDigitalOnly) {
      if (shippingRate) {
        // Use selected shipping rate
        const deliveryDays = shippingRate.deliveryDays || 7
        stripeShippingOptions.push({
          shipping_rate_data: {
            type: 'fixed_amount' as const,
            fixed_amount: {
              amount: formatAmountForStripe(shippingCost),
              currency: 'usd',
            },
            display_name: shippingRate.serviceName,
            delivery_estimate: {
              minimum: { unit: 'business_day' as const, value: Math.max(1, deliveryDays - 2) },
              maximum: { unit: 'business_day' as const, value: deliveryDays + 2 },
            },
            metadata: {
              carrier: shippingRate.carrier,
              service: shippingRate.service,
              rateId: shippingRate.id,
              isRealTime: shippingRate.isRealTime ? 'true' : 'false',
            },
          },
        })
      } else {
        // Fallback shipping options
        stripeShippingOptions.push(
          {
            shipping_rate_data: {
              type: 'fixed_amount' as const,
              fixed_amount: {
                amount: subtotal >= 50 ? 0 : 799,
                currency: 'usd',
              },
              display_name: subtotal >= 50 ? 'Free Shipping' : 'Standard Shipping',
              delivery_estimate: {
                minimum: { unit: 'business_day' as const, value: 5 },
                maximum: { unit: 'business_day' as const, value: 10 },
              },
            },
          },
          {
            shipping_rate_data: {
              type: 'fixed_amount' as const,
              fixed_amount: {
                amount: 1499,
                currency: 'usd',
              },
              display_name: 'Express Shipping',
              delivery_estimate: {
                minimum: { unit: 'business_day' as const, value: 2 },
                maximum: { unit: 'business_day' as const, value: 3 },
              },
            },
          }
        )
      }
    }

    // Add tax as a line item if we have pre-calculated tax
    if (taxAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Sales Tax',
            images: [],
            metadata: {
              productId: 'TAX',
            },
          },
          unit_amount: formatAmountForStripe(taxAmount),
        },
        quantity: 1,
      })
    }

    // Create Stripe checkout session
    const sessionConfig: any = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      customer_email: shipping.email,
      metadata: {
        orderNumber,
        customerName: shipping.name || '',
        customerEmail: shipping.email,
        customerPhone: shipping.phone || '',
        isDigitalOnly: isDigitalOnly ? 'true' : 'false',
        // Only include shipping details for physical orders
        ...(isDigitalOnly ? {} : {
          shippingAddress1: shipping.address1 || '',
          shippingAddress2: shipping.address2 || '',
          shippingCity: shipping.city || '',
          shippingState: shipping.state || '',
          shippingZipCode: shipping.zipCode || '',
          shippingCountry: shipping.country || '',
          shippingCarrier: shippingRate?.carrier || '',
          shippingService: shippingRate?.service || '',
          shipmentId: shipmentId || '',
        }),
        taxAmount: taxAmount.toString(),
        items: JSON.stringify(
          items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            productType: item.productType || 'PHYSICAL',
          }))
        ),
        // Affiliate tracking
        ...(affiliateCode && { affiliateCode }),
        ...(affiliatePartnerId && { affiliatePartnerId }),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cart`,
    }

    // Only add shipping options for physical products
    if (!isDigitalOnly && stripeShippingOptions.length > 0) {
      sessionConfig.shipping_options = stripeShippingOptions
    }

    // Only enable automatic tax if we don't have pre-calculated tax
    // This allows either our custom tax calculation OR Stripe's automatic tax
    if (taxAmount === 0) {
      sessionConfig.automatic_tax = { enabled: true }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
