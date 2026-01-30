import { NextRequest, NextResponse } from 'next/server'

const BOOKFADE_API_URL = process.env.BOOKFADE_API_URL || 'https://bookfade.app'
const BOOKFADE_API_KEY = process.env.BOOKFADE_API_KEY

// GET /api/bookfade/lookup - Public endpoint to lookup BookFade profiles by slug
// Used by shop pages to fetch barber info for product customization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      )
    }

    if (!BOOKFADE_API_KEY) {
      return NextResponse.json(
        { error: 'BookFade integration not configured' },
        { status: 503 }
      )
    }

    const res = await fetch(
      `${BOOKFADE_API_URL}/api/external/barbers?slug=${encodeURIComponent(slug)}`,
      {
        headers: {
          'x-api-key': BOOKFADE_API_KEY,
        },
        // Cache for 5 minutes
        next: { revalidate: 300 },
      }
    )

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ barber: null })
      }
      return NextResponse.json(
        { error: 'Failed to fetch from BookFade' },
        { status: res.status }
      )
    }

    const data = await res.json()

    // Return only the fields needed for customization (no email or sensitive data)
    if (data.barber) {
      return NextResponse.json({
        barber: {
          id: data.barber.id,
          name: data.barber.name,
          slug: data.barber.slug,
          businessName: data.barber.businessName,
          businessPhone: data.barber.businessPhone,
          businessAddress: data.barber.businessAddress,
          businessCity: data.barber.businessCity,
          businessState: data.barber.businessState,
          profileImage: data.barber.profileImage,
          heroImage: data.barber.heroImage,
          heroTitle: data.barber.heroTitle,
          galleryImages: data.barber.galleryImages || [],
          themeColor: data.barber.themeColor,
          bio: data.barber.bio,
          socialInstagram: data.barber.socialInstagram,
          allowWalkIns: data.barber.allowWalkIns ?? true,
        },
      })
    }

    return NextResponse.json({ barber: null })
  } catch (error) {
    console.error('Error looking up BookFade profile:', error)
    return NextResponse.json(
      { error: 'Failed to lookup profile' },
      { status: 500 }
    )
  }
}
