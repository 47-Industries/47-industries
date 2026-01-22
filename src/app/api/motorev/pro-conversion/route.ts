import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  isValidUserAffiliateCode,
  MOTOREV_PRO_WINDOW_DAYS,
  cashToProDays,
} from '@/lib/user-affiliate-utils'
import { awardProConversionPoints } from '@/lib/user-affiliate-points'

// POST /api/motorev/pro-conversion
// Called by MotoRev when a referred user upgrades to Pro
// Auth: X-API-Key header (shared secret)
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
      referralCode,
      motorevUserId,
      motorevEmail,
      productId, // monthly, yearly, etc.
      signupAt,
      convertedAt,
    } = body

    // Validate required fields
    if (!referralCode || !motorevUserId || !convertedAt) {
      return NextResponse.json(
        { error: 'Missing required fields: referralCode, motorevUserId, convertedAt' },
        { status: 400 }
      )
    }

    const signupDate = signupAt ? new Date(signupAt) : null
    const conversionDate = new Date(convertedAt)

    // Check Pro window (30 days from signup) if we have signup date
    if (signupDate) {
      const daysSinceSignup = (conversionDate.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24)

      if (daysSinceSignup > MOTOREV_PRO_WINDOW_DAYS) {
        return NextResponse.json({
          success: false,
          message: `Pro conversion outside ${MOTOREV_PRO_WINDOW_DAYS}-day window`,
          eligible: false,
          daysSinceSignup: Math.floor(daysSinceSignup),
        })
      }
    }

    // Check if this is a User Affiliate code (MR-XXXXXX format)
    if (isValidUserAffiliateCode(referralCode)) {
      return handleUserAffiliateProConversion(
        referralCode.toUpperCase(),
        motorevUserId,
        motorevEmail,
        productId,
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
      },
    })

    if (!partner) {
      return NextResponse.json(
        { error: 'Affiliate code not found or inactive' },
        { status: 404 }
      )
    }

    // Handle partner Pro conversion
    return handlePartnerProConversion(
      partner,
      referralCode,
      motorevUserId,
      motorevEmail,
      productId,
      signupDate,
      conversionDate
    )
  } catch (error) {
    console.error('Error processing Pro conversion:', error)
    return NextResponse.json(
      { error: 'Failed to process Pro conversion' },
      { status: 500 }
    )
  }
}

// Handle Pro conversion for User Affiliate (MR-XXXXXX codes)
async function handleUserAffiliateProConversion(
  affiliateCode: string,
  motorevUserId: string,
  motorevEmail: string | undefined,
  productId: string | undefined,
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
          email: true,
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

  // Check for duplicate conversion (prevent double-crediting)
  const existingConversion = await prisma.userAffiliateReferral.findFirst({
    where: {
      userAffiliateId: userAffiliate.id,
      motorevUserId,
      eventType: 'PRO_CONVERSION',
    },
  })

  if (existingConversion) {
    return NextResponse.json({
      success: false,
      message: 'Pro conversion already recorded for this user',
      duplicate: true,
    })
  }

  // Determine bonus and reward type based on user's preference
  const bonusAmount = Number(userAffiliate.motorevProBonus)
  const rewardType = userAffiliate.rewardPreference
  const proTimeDays = rewardType === 'PRO_TIME' ? cashToProDays(bonusAmount) : null

  // Create referral and commission in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the Pro conversion referral
    const referral = await tx.userAffiliateReferral.create({
      data: {
        userAffiliateId: userAffiliate.id,
        platform: 'MOTOREV',
        eventType: 'PRO_CONVERSION',
        motorevUserId,
        motorevEmail: motorevEmail || null,
        signupAt: signupDate,
        convertedAt: conversionDate,
      },
    })

    // Create the commission record
    const commission = await tx.userAffiliateCommission.create({
      data: {
        userAffiliateId: userAffiliate.id,
        referralId: referral.id,
        type: 'PRO_CONVERSION',
        baseAmount: productId === 'yearly' ? 49.99 : 4.99, // MotoRev Pro pricing
        rate: null, // Flat bonus, not percentage
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
      expiresAt.setFullYear(expiresAt.getFullYear() + 1) // Credits expire in 1 year

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

  // Award 10 points for Pro conversion (new points system)
  let pointsResult = null
  try {
    pointsResult = await awardProConversionPoints(
      userAffiliate.id,
      result.referral.id,
      motorevUserId,
      motorevEmail
    )
  } catch (error) {
    console.error('Error awarding Pro conversion points:', error)
    // Don't fail the request if points fail - conversion is still recorded
  }

  return NextResponse.json({
    success: true,
    message: 'Pro conversion recorded successfully',
    referralId: result.referral.id,
    commissionId: result.commission.id,
    commission: bonusAmount,
    rewardType,
    proTimeDays,
    affiliateName: userAffiliate.user.name,
    affiliateType: 'user',
    // Points system response
    pointsAwarded: pointsResult?.transaction?.points || 0,
    totalPoints: pointsResult?.affiliate?.availablePoints || 0,
    redemption: pointsResult?.redemption ? {
      id: pointsResult.redemption.id,
      pointsRedeemed: pointsResult.redemption.pointsRedeemed,
      proDaysGranted: pointsResult.redemption.proDaysGranted,
    } : null,
  })
}

// Handle Pro conversion for Partner affiliate codes
async function handlePartnerProConversion(
  partner: { id: string; name: string; motorevProBonus: unknown },
  affiliateCode: string,
  motorevUserId: string,
  motorevEmail: string | undefined,
  productId: string | undefined,
  signupDate: Date | null,
  conversionDate: Date
) {
  // Check for duplicate conversion
  const existingConversion = await prisma.partnerReferral.findFirst({
    where: {
      partnerId: partner.id,
      motorevUserId,
      eventType: 'PRO_CONVERSION',
    },
  })

  if (existingConversion) {
    return NextResponse.json({
      success: false,
      message: 'Pro conversion already recorded for this partner',
      duplicate: true,
    })
  }

  const bonusAmount = Number(partner.motorevProBonus)

  // Create partner referral and commission
  const result = await prisma.$transaction(async (tx) => {
    const referral = await tx.partnerReferral.create({
      data: {
        partnerId: partner.id,
        platform: 'MOTOREV',
        eventType: 'PRO_CONVERSION',
        motorevUserId,
        motorevEmail: motorevEmail || null,
        signupAt: signupDate,
        convertedAt: conversionDate,
      },
    })

    const commission = await tx.partnerCommission.create({
      data: {
        partnerId: partner.id,
        referralId: referral.id,
        type: 'PRO_CONVERSION',
        baseAmount: productId === 'yearly' ? 49.99 : 4.99,
        rate: null,
        amount: bonusAmount,
        status: 'PENDING',
      },
    })

    // Update partner stats
    await tx.partner.update({
      where: { id: partner.id },
      data: {
        totalReferrals: { increment: 1 },
        pendingEarnings: { increment: bonusAmount },
      },
    })

    return { referral, commission }
  })

  return NextResponse.json({
    success: true,
    message: 'Pro conversion recorded successfully',
    referralId: result.referral.id,
    commissionId: result.commission.id,
    commission: bonusAmount,
    affiliateName: partner.name,
    affiliateType: 'partner',
  })
}
