import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe, formatAmountForStripe, isStripeConfigured } from '@/lib/stripe'
import { randomBytes } from 'crypto'

// API Key validation for external partners
function validateApiKey(request: NextRequest): { valid: boolean; source: string | null } {
  const apiKey = request.headers.get('x-api-key')

  // BookFade API key
  if (apiKey === process.env.BOOKFADE_API_KEY) {
    return { valid: true, source: 'bookfade' }
  }

  // Add more partner API keys here as needed

  return { valid: false, source: null }
}

// Generate order number
function generateOrderNumber(): string {
  const prefix = '47'
  const randomPart = randomBytes(4).toString('hex').toUpperCase()
  return `${prefix}-${randomPart.slice(0, 6)}-${randomPart.slice(6, 10)}`
}

// GET /api/external/orders - List orders for a source
export async function GET(request: NextRequest) {
  const auth = validateApiKey(request)
  if (!auth.valid) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status')
  const sourceOrderId = searchParams.get('sourceOrderId')

  const where: any = {
    source: auth.source,
  }

  if (status) {
    where.status = status
  }

  if (sourceOrderId) {
    where.sourceOrderId = sourceOrderId
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])

  return NextResponse.json({
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

// POST /api/external/orders - Create an order from external source
export async function POST(request: NextRequest) {
  const auth = validateApiKey(request)
  if (!auth.valid) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  try {
    const body = await request.json()

    const {
      // Customer info
      customerName,
      customerEmail,
      customerPhone,
      // Items
      items, // Array of { productId, variantId?, quantity, customization? }
      // Shipping
      shippingAddress,
      // Source tracking
      sourceOrderId, // External order ID from BookFade
      sourceData, // Additional metadata (barber info, card customization, etc.)
      // Payment handling
      paymentMethod, // 'stripe_redirect' | 'prepaid'
      stripePaymentId, // If prepaid via Stripe
      // Optionals
      customerNotes,
      discountCode,
    } = body

    // Validate required fields
    if (!customerName || !customerEmail || !items?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: customerName, customerEmail, items' },
        { status: 400 }
      )
    }

    // Validate shipping address for physical products
    if (!shippingAddress?.address1 || !shippingAddress?.city || !shippingAddress?.state || !shippingAddress?.zipCode) {
      return NextResponse.json(
        { error: 'Missing shipping address fields' },
        { status: 400 }
      )
    }

    // Fetch products
    const productIds = items.map((item: any) => item.productId)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        active: true,
      },
      include: {
        variants: true,
      },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'One or more products not found or inactive' },
        { status: 400 }
      )
    }

    // Calculate totals with setup fee pricing model
    // First unit = price (includes setup), additional units = additionalPrice
    // If customer has existing design, all units use additionalPrice
    let subtotal = 0
    const orderItems: any[] = []
    const designsToCreate: any[] = [] // Track designs to create after order

    for (const item of items) {
      const product = products.find(p => p.id === item.productId)
      if (!product) continue

      let price = Number(product.price)
      let additionalPrice = price // Default: same as first unit price
      let sku = product.sku
      let variantName = null
      let hasExistingDesign = false

      // Check for variant
      if (item.variantId) {
        const variant = product.variants.find(v => v.id === item.variantId)
        if (variant) {
          price = Number(variant.price)
          additionalPrice = variant.additionalPrice ? Number(variant.additionalPrice) : price
          sku = variant.sku || sku
          variantName = variant.name
        }
      }

      // Check if customer has existing design for this product/variant (reorder pricing)
      if (item.customization) {
        const existingDesign = await prisma.customerDesign.findFirst({
          where: {
            customerEmail,
            productId: product.id,
            variantId: item.variantId || null,
            source: auth.source,
            status: 'COMPLETED',
          },
        })

        if (existingDesign) {
          hasExistingDesign = true
        }
      }

      // Calculate item total using setup fee pricing
      let itemTotal: number
      if (hasExistingDesign) {
        // Customer has existing design - all units at additional price
        itemTotal = additionalPrice * item.quantity
      } else if (additionalPrice !== price && item.quantity > 1) {
        // First unit at setup price, rest at additional price
        itemTotal = price + (additionalPrice * (item.quantity - 1))
      } else {
        // Standard pricing (no additional price difference)
        itemTotal = price * item.quantity
      }

      subtotal += itemTotal

      // Track if we need to create a design record for custom orders
      if (item.customization && !hasExistingDesign) {
        designsToCreate.push({
          customerEmail,
          source: auth.source,
          sourceCustomerId: sourceData?.barberId || sourceData?.customerId || null,
          productId: product.id,
          variantId: item.variantId || null,
          designName: item.customization.businessName
            ? `Custom - ${item.customization.businessName}`
            : `Custom - ${customerName}`,
          customization: item.customization,
        })
      }

      const images = product.images as string[] | null
      orderItems.push({
        productId: product.id,
        name: variantName ? `${product.name} - ${variantName}` : product.name,
        price: hasExistingDesign ? additionalPrice : price, // Show effective first-unit price
        quantity: item.quantity,
        total: itemTotal,
        image: images?.[0] || null,
        sku,
        // Store pricing info for reference
        metadata: {
          hasExistingDesign,
          setupPrice: price,
          additionalPrice,
        },
      })
    }

    // Calculate shipping (flat rate for now, can integrate Shippo later)
    const shipping = 5.99 // TODO: Calculate real shipping via Shippo

    // Calculate tax (simplified - can use Stripe Tax or TaxJar)
    const taxRate = 0.07 // 7% placeholder
    const tax = subtotal * taxRate

    const total = subtotal + shipping + tax

    // Generate order number
    const orderNumber = generateOrderNumber()

    // Create or get address
    // For external orders, we'll store address in sourceData instead of creating Address record
    const shippingAddressData = {
      fullName: customerName,
      address1: shippingAddress.address1,
      address2: shippingAddress.address2 || '',
      city: shippingAddress.city,
      state: shippingAddress.state,
      zipCode: shippingAddress.zipCode,
      country: shippingAddress.country || 'US',
      phone: customerPhone || '',
    }

    // Handle payment
    if (paymentMethod === 'stripe_redirect') {
      // Create Stripe Checkout session
      if (!isStripeConfigured) {
        return NextResponse.json(
          { error: 'Payment processing not configured' },
          { status: 500 }
        )
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: customerEmail,
        line_items: orderItems.map(item => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.name,
              images: item.image ? [item.image] : [],
            },
            unit_amount: formatAmountForStripe(item.price),
          },
          quantity: item.quantity,
        })),
        shipping_options: [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: {
                amount: formatAmountForStripe(shipping),
                currency: 'usd',
              },
              display_name: 'Standard Shipping',
              delivery_estimate: {
                minimum: { unit: 'business_day', value: 5 },
                maximum: { unit: 'business_day', value: 10 },
              },
            },
          },
        ],
        metadata: {
          orderNumber,
          source: auth.source,
          sourceOrderId: sourceOrderId || '',
          customerName,
          customerPhone: customerPhone || '',
          items: JSON.stringify(items),
          shippingAddress: JSON.stringify(shippingAddressData),
          sourceData: JSON.stringify(sourceData || {}),
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: sourceData?.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      })

      // Create pending order
      const order = await prisma.order.create({
        data: {
          orderNumber,
          customerName,
          customerEmail,
          customerPhone,
          subtotal,
          tax,
          shipping,
          total,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          stripeSessionId: session.id,
          source: auth.source,
          sourceOrderId,
          sourceData: {
            ...sourceData,
            shippingAddress: shippingAddressData,
          },
          customerNotes,
          discountCode,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
        },
      })

      // Create CustomerDesign records for custom orders (status: PENDING until design is created)
      for (const design of designsToCreate) {
        try {
          await prisma.customerDesign.upsert({
            where: {
              customerEmail_productId_variantId_source: {
                customerEmail: design.customerEmail,
                productId: design.productId,
                variantId: design.variantId || '',
                source: design.source || '',
              },
            },
            update: {
              // If design already exists but was archived, reactivate it
              status: 'PENDING',
              designNotes: `Reorder requested - Order ${orderNumber}`,
              customization: design.customization,
            },
            create: {
              customerEmail: design.customerEmail,
              source: design.source,
              sourceCustomerId: design.sourceCustomerId,
              productId: design.productId,
              variantId: design.variantId,
              designName: design.designName,
              customization: design.customization,
              originalOrderId: order.id,
              status: 'PENDING',
            },
          })
        } catch (designError) {
          console.error('Failed to create CustomerDesign record:', designError)
          // Don't fail the order for this
        }
      }

      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: Number(order.total),
        },
        checkout: {
          url: session.url,
          sessionId: session.id,
        },
      })
    } else if (paymentMethod === 'prepaid' && stripePaymentId) {
      // Order already paid via BookFade's Stripe account
      // Create order directly as PAID
      const order = await prisma.order.create({
        data: {
          orderNumber,
          customerName,
          customerEmail,
          customerPhone,
          subtotal,
          tax,
          shipping,
          total,
          status: 'PAID',
          paymentStatus: 'SUCCEEDED',
          stripePaymentId,
          source: auth.source,
          sourceOrderId,
          sourceData: {
            ...sourceData,
            shippingAddress: shippingAddressData,
            prepaidVia: 'bookfade',
          },
          customerNotes,
          discountCode,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
        },
      })

      // Decrement stock
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        })
      }

      // Create CustomerDesign records for custom orders
      for (const design of designsToCreate) {
        try {
          await prisma.customerDesign.upsert({
            where: {
              customerEmail_productId_variantId_source: {
                customerEmail: design.customerEmail,
                productId: design.productId,
                variantId: design.variantId || '',
                source: design.source || '',
              },
            },
            update: {
              status: 'PENDING',
              designNotes: `Reorder requested - Order ${orderNumber}`,
              customization: design.customization,
            },
            create: {
              customerEmail: design.customerEmail,
              source: design.source,
              sourceCustomerId: design.sourceCustomerId,
              productId: design.productId,
              variantId: design.variantId,
              designName: design.designName,
              customization: design.customization,
              originalOrderId: order.id,
              status: 'PENDING',
            },
          })
        } catch (designError) {
          console.error('Failed to create CustomerDesign record:', designError)
        }
      }

      // TODO: Send order confirmation email
      // await sendOrderConfirmation(order, orderItems)

      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          total: Number(order.total),
          items: order.items,
        },
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid payment method. Use "stripe_redirect" or "prepaid"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('External order creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
