import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isWithinProWindow } from '@/lib/affiliate-utils'
import {
  isValidUserAffiliateCode,
  cashToProDays,
} from '@/lib/user-affiliate-utils'

// POST /api/affiliate/motorev
// Called by MotoRev backend when a referred user converts to Pro
// Supports both Partner codes and User Affiliate codes (MR-XXXXXX)
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

    const signupDate = signupAt ? new Date(signupAt) : null
    const conversionDate = convertedAt ? new Date(convertedAt) : new Date()

    // Check if this is a User Affiliate code (MR-XXXXXX format)
    if (isValidUserAffiliateCode(referralCode)) {
      return handleUserAffiliateConversion(
        referralCode.toUpperCase(),
        motorevUserId,
        email,
        signupDate,
        conversionDate
      )
    }

    // Otherwise, try to find a Partner by affiliate code
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
        { error: 'Affiliate code not found or inactive' },
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
      commissionAmount: Number(bonusAmount),
      partnerName: partner.name,
      affiliateType: 'partner',
    })
  } catch (error) {
    console.error('Error processing MotoRev affiliate conversion:', error)
    return NextResponse.json(
      { error: 'Failed to process conversion' },
      { status: 500 }
    )
  }
}

// Handle conversion for User Affiliate (MR-XXXXXX codes)
async function handleUserAffiliateConversion(
  affiliateCode: string,
  motorevUserId: string,
  email: string | undefined,
  signupDate: Date | null,
  conversionDate: Date
) {
  // Find the user affiliate by code
  const userAffiliate = await prisma.userAffiliate.findUnique({
    where: { affiliateCode },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!userAffiliate) {
    return NextResponse.json(
      { error: 'Affiliate code not found' },
      { status: 404 }
    )
  }

  // Check if this MotoRev user was already credited (prevent duplicates)
  const existingReferral = await prisma.userAffiliateReferral.findFirst({
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

  // Check if conversion is within the 30-day window
  const windowDays = 30

  if (signupDate && !isWithinProWindow(signupDate, conversionDate, windowDays)) {
    return NextResponse.json({
      success: false,
      message: `Pro conversion is outside the ${windowDays}-day window`,
      eligible: false,
    })
  }

  // Determine bonus and reward type based on preference
  const bonusAmount = Number(userAffiliate.motorevProBonus)
  const rewardType = userAffiliate.rewardPreference
  const proTimeDays = rewardType === 'PRO_TIME' ? cashToProDays(bonusAmount) : null

  // Create referral and commission in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the referral
    const referral = await tx.userAffiliateReferral.create({
      data: {
        userAffiliateId: userAffiliate.id,
        platform: 'MOTOREV',
        eventType: 'PRO_CONVERSION',
        motorevUserId,
        motorevEmail: email || null,
        signupAt: signupDate,
        convertedAt: conversionDate,
      },
    })

    // Create the commission
    const commission = await tx.userAffiliateCommission.create({
      data: {
        userAffiliateId: userAffiliate.id,
        referralId: referral.id,
        type: 'PRO_CONVERSION',
        baseAmount: 0,
        rate: null,
        amount: bonusAmount,
        rewardType,
        proTimeDays,
        status: 'PENDING',
      },
    })

    // Update affiliate stats
    await tx.userAffiliate.update({
      where: { id: userAffiliate.id },
      data: {
        totalReferrals: { increment: 1 },
        pendingEarnings: rewardType === 'CASH'
          ? { increment: bonusAmount }
          : undefined,
        proTimeEarnedDays: rewardType === 'PRO_TIME' && proTimeDays
          ? { increment: proTimeDays }
          : undefined,
      },
    })

    // If reward type is PRO_TIME, create a credit record
    if (rewardType === 'PRO_TIME' && proTimeDays) {
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + 12) // Credits expire in 12 months

      await tx.proTimeCredit.create({
        data: {
          userAffiliateId: userAffiliate.id,
          days: proTimeDays,
          source: 'PRO_CONVERSION',
          commissionId: commission.id,
          status: 'PENDING',
          expiresAt,
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
    rewardType,
    proTimeDays,
    affiliateName: userAffiliate.user.name,
    affiliateType: 'user',
  })
}
