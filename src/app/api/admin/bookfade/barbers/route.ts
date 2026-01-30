import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const BOOKFADE_API_URL = process.env.BOOKFADE_API_URL || 'https://bookfade.app'
const BOOKFADE_API_KEY = process.env.BOOKFADE_API_KEY

// GET /api/admin/bookfade/barbers - Fetch barbers from BookFade
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!BOOKFADE_API_KEY) {
      return NextResponse.json(
        { error: 'BookFade API key not configured' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const id = searchParams.get('id')
    const search = searchParams.get('search')

    // Build query params for BookFade API
    const params = new URLSearchParams()
    if (slug) params.append('slug', slug)
    if (id) params.append('id', id)
    if (search) params.append('search', search)

    const res = await fetch(
      `${BOOKFADE_API_URL}/api/external/barbers?${params}`,
      {
        headers: {
          'x-api-key': BOOKFADE_API_KEY,
        },
      }
    )

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: error.error || 'Failed to fetch from BookFade' },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching barbers from BookFade:', error)
    return NextResponse.json(
      { error: 'Failed to fetch barbers' },
      { status: 500 }
    )
  }
}
