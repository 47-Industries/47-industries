import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/account/affiliate/custom-code?code=XXX
// Check if a custom referral code is available
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    // Normalize code to uppercase
    const normalizedCode = code.toUpperCase()

    // Validate format (MR-XXXXXX where X is alphanumeric)
    const codePattern = /^MR-[A-Z0-9]{6}$/
    if (!codePattern.test(normalizedCode)) {
      return NextResponse.json({
        available: false,
        error: 'Invalid code format. Must be MR- followed by 6 alphanumeric characters.'
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
    return NextResponse.json({ error: 'Failed to check code availability' }, { status: 500 })
  }
}

// POST /api/account/affiliate/custom-code
// Set a custom referral code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    // Normalize code to uppercase
    const normalizedCode = code.toUpperCase()

    // Validate format (MR-XXXXXX where X is alphanumeric)
    const codePattern = /^MR-[A-Z0-9]{6}$/
    if (!codePattern.test(normalizedCode)) {
      return NextResponse.json({
        error: 'Invalid code format. Must be MR- followed by 6 alphanumeric characters.'
      }, { status: 400 })
    }

    // Get user's affiliate record
    const userAffiliate = await prisma.userAffiliate.findUnique({
      where: { userId: session.user.id },
      select: { id: true, affiliateCode: true },
    })

    if (!userAffiliate) {
      return NextResponse.json({
        error: 'No affiliate account found'
      }, { status: 404 })
    }

    // Check if code is already taken by someone else
    const existing = await prisma.userAffiliate.findUnique({
      where: { affiliateCode: normalizedCode },
      select: { id: true },
    })

    if (existing && existing.id !== userAffiliate.id) {
      return NextResponse.json({
        error: 'This code is already taken'
      }, { status: 400 })
    }

    // Update the affiliate code
    const updated = await prisma.userAffiliate.update({
      where: { id: userAffiliate.id },
      data: { affiliateCode: normalizedCode },
      select: {
        affiliateCode: true,
        totalPoints: true,
        availablePoints: true,
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
      return NextResponse.json({ error: 'This code is already taken' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to set custom code' }, { status: 500 })
  }
}
