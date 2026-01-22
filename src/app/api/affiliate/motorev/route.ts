import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isWithinProWindow } from '@/lib/affiliate-utils'

// POST /api/affiliate/motorev
// Called by MotoRev backend when a referred user converts to Pro
// Auth: API key in X-API-Key header (shared secret)
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
    const {
      event,
      referralCode,
      userId: motorevUserId,
      email,
      productId,
      signupAt,
      convertedAt,
    } = body

    // Validate required fields
    if (!event || !referralCode || !motorevUserId) {
      return NextResponse.json(
        { error: 'Missing required fields: event, referralCode, userId' },
        { status: 400 }
      )
    }

    // Only handle PRO_CONVERSION events
    if (event !== 'PRO_CONVERSION') {
      return NextResponse.json(
        { error: 'Unsupported event type. Only PRO_CONVERSION is supported.' },
        { status: 400 }
      )
    }

    // Find partner by affiliate code
    const partner = await prisma.partner.findFirst({
      where: {
        affiliateCode: referralCode,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        motorevProBonus: true,
        motorevProWindowDays: true,
      },
    })

    if (!partner) {
      return NextResponse.json(
        { error: 'Partner not found or inactive' },
        { status: 404 }
      )
    }

    // Check if this MotoRev user was already credited (prevent duplicates)
    const existingReferral = await prisma.affiliateReferral.findFirst({
      where: {
        motorevUserId,
        eventType: 'PRO_CONVERSION',
      },
    })

    if (existingReferral) {
      return NextResponse.json(
        { error: 'Pro conversion already credited for this user' },
        { status: 409 }
      )
    }

    // Check if conversion is within the Pro window
    const windowDays = partner.motorevProWindowDays || 30
    const signupDate = signupAt ? new Date(signupAt) : null
    const conversionDate = convertedAt ? new Date(convertedAt) : new Date()

    if (signupDate && !isWithinProWindow(signupDate, conversionDate, windowDays)) {
      return NextResponse.json({
        success: false,
        message: `Pro conversion is outside the ${windowDays}-day window`,
        eligible: false,
      })
    }

    // Calculate commission (flat bonus)
    const bonusAmount = partner.motorevProBonus || 2.50

    // Find the affiliate link used (if any)
    const affiliateLink = await prisma.affiliateLink.findFirst({
      where: {
        partnerId: partner.id,
        platform: 'MOTOREV',
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Create referral and commission in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the referral
      const referral = await tx.affiliateReferral.create({
        data: {
          partnerId: partner.id,
          linkId: affiliateLink?.id || null,
          platform: 'MOTOREV',
          eventType: 'PRO_CONVERSION',
          motorevUserId,
          customerEmail: email || null,
          signupAt: signupDate,
          convertedAt: conversionDate,
        },
      })

      // Create the commission
      const commission = await tx.affiliateCommission.create({
        data: {
          partnerId: partner.id,
          referralId: referral.id,
          type: 'APP_PRO_CONVERSION',
          baseAmount: 0, // No base for flat bonus
          rate: null, // Flat bonus, no rate
          amount: bonusAmount,
          status: 'PENDING',
          notes: `MotoRev Pro conversion - User ID: ${motorevUserId}${productId ? `, Product: ${productId}` : ''}`,
        },
      })

      // Update affiliate link stats if applicable
      if (affiliateLink) {
        await tx.affiliateLink.update({
          where: { id: affiliateLink.id },
          data: {
            totalReferrals: { increment: 1 },
          },
        })
      }

      return { referral, commission }
    })

    return NextResponse.json({
      success: true,
      message: 'Pro conversion recorded successfully',
      referralId: result.referral.id,
      commissionId: result.commission.id,
      commissionAmount: bonusAmount,
      partnerName: partner.name,
    })
  } catch (error) {
    console.error('Error processing MotoRev affiliate conversion:', error)
    return NextResponse.json(
      { error: 'Failed to process conversion' },
      { status: 500 }
    )
  }
}
