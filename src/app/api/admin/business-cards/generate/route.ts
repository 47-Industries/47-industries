import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateBusinessCard, generateCardFrontHTML, generateCardBackHTML, BarberCardData } from '@/lib/business-card-generator'

// POST /api/admin/business-cards/generate - Generate business card HTML
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
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
      side, // 'front', 'back', or 'both' (default)
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

    if (side === 'front') {
      return NextResponse.json({
        front: generateCardFrontHTML(cardData),
      })
    }

    if (side === 'back') {
      return NextResponse.json({
        back: generateCardBackHTML(cardData),
      })
    }

    // Default: generate both
    const { front, back } = generateBusinessCard(cardData)

    return NextResponse.json({
      front,
      back,
    })
  } catch (error) {
    console.error('Error generating business card:', error)
    return NextResponse.json(
      { error: 'Failed to generate business card' },
      { status: 500 }
    )
  }
}
