import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  generateBusinessCard,
  generateCardHTML,
  convertLegacyData,
  type BusinessCardData,
  type BarberCardData,
} from '@/lib/business-card-generator'

// POST /api/admin/business-cards/generate - Generate business card HTML
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Check if this is the new format (has 'layout' field) or legacy format (has 'slug' as required)
    const isNewFormat = 'layout' in body

    if (isNewFormat) {
      // New universal format
      const {
        name,
        title,
        company,
        companyTagline,
        email,
        phone,
        website,
        socialLinks,
        profileImage,
        logoImage,
        backgroundImage,
        qrCode,
        themeColor,
        layout,
        brand,
        // Legacy fields for backward compatibility
        slug,
        tagline,
        shopName,
        address,
        city,
        state,
        heroImage,
        side, // 'front', 'back', or 'both' (default)
      } = body

      if (!name) {
        return NextResponse.json(
          { error: 'Name is required' },
          { status: 400 }
        )
      }

      const cardData: BusinessCardData = {
        name,
        title,
        company,
        companyTagline,
        email,
        phone,
        website,
        socialLinks,
        profileImage,
        logoImage,
        backgroundImage,
        qrCode,
        themeColor,
        layout: layout || 'standard',
        brand,
        // Legacy fields
        slug,
        tagline,
        shopName,
        address,
        city,
        state,
        heroImage,
      }

      if (side === 'front') {
        return NextResponse.json({
          front: generateCardHTML(cardData, 'front'),
          layout: cardData.layout,
        })
      }

      if (side === 'back') {
        return NextResponse.json({
          back: generateCardHTML(cardData, 'back'),
          layout: cardData.layout,
        })
      }

      // Default: generate both
      const result = generateBusinessCard(cardData)

      return NextResponse.json({
        front: result.front,
        back: result.back,
        layout: result.layout,
      })
    } else {
      // Legacy BookFade format
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
        side,
      } = body

      if (!name || !slug) {
        return NextResponse.json(
          { error: 'Name and slug are required' },
          { status: 400 }
        )
      }

      const legacyData: BarberCardData = {
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

      const cardData = convertLegacyData(legacyData)

      if (side === 'front') {
        return NextResponse.json({
          front: generateCardHTML(cardData, 'front'),
        })
      }

      if (side === 'back') {
        return NextResponse.json({
          back: generateCardHTML(cardData, 'back'),
        })
      }

      // Default: generate both
      const result = generateBusinessCard(cardData)

      return NextResponse.json({
        front: result.front,
        back: result.back,
      })
    }
  } catch (error) {
    console.error('Error generating business card:', error)
    return NextResponse.json(
      { error: 'Failed to generate business card' },
      { status: 500 }
    )
  }
}
