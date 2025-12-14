import { NextRequest, NextResponse } from 'next/server'
import { pushService } from '@/lib/push-notifications'
import { prisma } from '@/lib/prisma'

// POST /api/push-tokens - Register a push token (called from mobile app)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, platform, deviceName } = body

    if (!token || !platform) {
      return NextResponse.json(
        { error: 'Token and platform are required' },
        { status: 400 }
      )
    }

    const pushToken = await pushService.registerToken(token, platform, deviceName)

    return NextResponse.json({
      success: true,
      id: pushToken.id
    })
  } catch (error: any) {
    console.error('Error registering push token:', error)
    return NextResponse.json({ error: 'Failed to register push token' }, { status: 500 })
  }
}

// GET /api/push-tokens - List all push tokens (protected)
export async function GET(request: NextRequest) {
  // Simple auth check via header
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const tokens = await prisma.pushToken.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      tokens,
      total: tokens.length,
      active: tokens.filter(t => t.active).length
    })
  } catch (error: any) {
    console.error('Error fetching push tokens:', error)
    return NextResponse.json({ error: 'Failed to fetch push tokens' }, { status: 500 })
  }
}
