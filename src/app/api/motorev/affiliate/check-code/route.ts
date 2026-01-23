import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/motorev/affiliate/check-code?code=XXX
// Check if a custom referral code is available
// Auth: X-API-Key header (shared secret)
export async function GET(req: NextRequest) {
  try {
    // Validate API key
    const apiKey = req.headers.get('x-api-key')
    const expectedKey = process.env.MOTOREV_AFFILIATE_API_KEY

    if (!expectedKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const code = req.nextUrl.searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: 'Missing required parameter: code' },
        { status: 400 }
      )
    }

    // Normalize code to uppercase
    const normalizedCode = code.toUpperCase()

    // Validate format (MR-XXXXXX where X is alphanumeric)
    const codePattern = /^MR-[A-Z0-9]{6}$/
    if (!codePattern.test(normalizedCode)) {
      return NextResponse.json({
        available: false,
        error: 'Invalid code format. Must be MR- followed by 6 alphanumeric characters.',
      })
    }

    // Check if code is already taken
    const existing = await prisma.userAffiliate.findUnique({
      where: { affiliateCode: normalizedCode },
      select: { id: true },
    })

    return NextResponse.json({
      available: !existing,
      code: normalizedCode,
    })
  } catch (error) {
    console.error('Error checking code availability:', error)
    return NextResponse.json(
      { error: 'Failed to check code availability' },
      { status: 500 }
    )
  }
}
