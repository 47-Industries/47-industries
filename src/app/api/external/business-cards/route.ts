import { NextRequest, NextResponse } from 'next/server'
import { generateBusinessCard, BarberCardData } from '@/lib/business-card-generator'
import { prisma } from '@/lib/prisma'

// API Key validation for external partners
function validateApiKey(request: NextRequest): { valid: boolean; source: string | null } {
  const apiKey = request.headers.get('x-api-key')

  if (apiKey === process.env.BOOKFADE_API_KEY) {
    return { valid: true, source: 'bookfade' }
  }

  return { valid: false, source: null }
}

// POST /api/external/business-cards - Generate business cards from barber data
export async function POST(request: NextRequest) {
  const auth = validateApiKey(request)
  if (!auth.valid) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      // Barber info (required)
      name,
      slug,
      // Optional customization
      tagline,
      shopName,
      address,
      city,
      state,
      profileImage,
      heroImage,
      themeColor,
      // Order tracking
      orderId,
      orderNumber,
    } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    const cardData: BarberCardData = {
      name,
      slug,
      tagline,
      shopName,
      address,
      city,
      state,
      profileImage,
      heroImage,
      themeColor,
    }

    // Generate both front and back
    const { front, back } = generateBusinessCard(cardData)

    // If order tracking provided, save the generated cards
    if (orderId || orderNumber) {
      try {
        // Find the order
        const whereClause = orderId
          ? { id: orderId }
          : { orderNumber }

        const order = await prisma.order.findFirst({
          where: whereClause,
        })

        if (order) {
          // Update order with generated card data
          await prisma.order.update({
            where: { id: order.id },
            data: {
              sourceData: {
                ...(order.sourceData as any || {}),
                generatedCards: {
                  generatedAt: new Date().toISOString(),
                  cardData,
                },
              },
            },
          })
        }
      } catch (dbError) {
        // Don't fail the request if DB update fails
        console.error('Failed to update order with card data:', dbError)
      }
    }

    return NextResponse.json({
      success: true,
      cards: {
        front,
        back,
      },
      cardData,
    })
  } catch (error) {
    console.error('Error generating business cards:', error)
    return NextResponse.json(
      { error: 'Failed to generate business cards' },
      { status: 500 }
    )
  }
}

// GET /api/external/business-cards - Get card data for an order
export async function GET(request: NextRequest) {
  const auth = validateApiKey(request)
  if (!auth.valid) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('orderId')
  const orderNumber = searchParams.get('orderNumber')

  if (!orderId && !orderNumber) {
    return NextResponse.json(
      { error: 'orderId or orderNumber is required' },
      { status: 400 }
    )
  }

  try {
    const whereClause = orderId
      ? { id: orderId }
      : { orderNumber: orderNumber! }

    const order = await prisma.order.findFirst({
      where: whereClause,
      select: {
        id: true,
        orderNumber: true,
        sourceData: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const sourceData = order.sourceData as any
    const generatedCards = sourceData?.generatedCards

    if (!generatedCards) {
      return NextResponse.json({
        success: true,
        generated: false,
        message: 'Cards not yet generated for this order',
      })
    }

    // Regenerate cards from saved data
    const { front, back } = generateBusinessCard(generatedCards.cardData)

    return NextResponse.json({
      success: true,
      generated: true,
      generatedAt: generatedCards.generatedAt,
      cards: {
        front,
        back,
      },
      cardData: generatedCards.cardData,
    })
  } catch (error) {
    console.error('Error fetching card data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch card data' },
      { status: 500 }
    )
  }
}
