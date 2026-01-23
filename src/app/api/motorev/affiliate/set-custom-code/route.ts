import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/motorev/affiliate/set-custom-code
// Set a custom referral code for a MotoRev user
// Auth: X-API-Key header (shared secret)
// Body: { motorevUserId: string, code: string }
export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { motorevUserId, code } = body

    if (!motorevUserId) {
      return NextResponse.json(
        { error: 'Missing required parameter: motorevUserId' },
        { status: 400 }
      )
    }

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
      return NextResponse.json(
        { error: 'Invalid code format. Must be MR- followed by 6 alphanumeric characters.' },
        { status: 400 }
      )
    }

    // Find the user affiliate by MotoRev user ID
    const userAffiliate = await prisma.userAffiliate.findFirst({
      where: { motorevUserId },
      select: { id: true, affiliateCode: true },
    })

    if (!userAffiliate) {
      return NextResponse.json(
        { error: 'No affiliate account found for this MotoRev user' },
        { status: 404 }
      )
    }

    // Check if code is already taken by someone else
    const existing = await prisma.userAffiliate.findUnique({
      where: { affiliateCode: normalizedCode },
      select: { id: true },
    })

    if (existing && existing.id !== userAffiliate.id) {
      return NextResponse.json(
        { error: 'This code is already taken' },
        { status: 400 }
      )
    }

    // Update the affiliate code
    const updated = await prisma.userAffiliate.update({
      where: { id: userAffiliate.id },
      data: { affiliateCode: normalizedCode },
      select: {
        affiliateCode: true,
        totalPoints: true,
        pointsRedeemed: true,
        totalReferrals: true,
      },
    })

    return NextResponse.json({
      success: true,
      affiliateCode: updated.affiliateCode,
      message: 'Custom code set successfully',
    })
  } catch (error) {
    console.error('Error setting custom code:', error)

    // Check for unique constraint violation
    if ((error as any)?.code === 'P2002') {
      return NextResponse.json(
        { error: 'This code is already taken' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to set custom code' },
      { status: 500 }
    )
  }
}
