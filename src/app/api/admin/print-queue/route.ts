import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const BOOKFADE_API_URL = process.env.BOOKFADE_API_URL || 'https://bookfade.app'
const BOOKFADE_API_KEY = process.env.BOOKFADE_API_KEY

// GET /api/admin/print-queue - Fetch print orders from BookFade
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
    const status = searchParams.get('status')

    // Build query params
    const params = new URLSearchParams()
    if (status) params.append('status', status)

    const res = await fetch(
      `${BOOKFADE_API_URL}/api/external/print-orders?${params}`,
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
    console.error('Error fetching print orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch print orders' },
      { status: 500 }
    )
  }
}
