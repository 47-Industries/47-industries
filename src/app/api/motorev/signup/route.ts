import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidUserAffiliateCode } from '@/lib/user-affiliate-utils'
import { awardSignupPoints } from '@/lib/user-affiliate-points'

// POST /api/motorev/signup
// Called by MotoRev when a new user signs up with a referral code
// Records the signup event (no commission yet - commission only on Pro conversion)
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
      signupAt,
    } = body

    // Validate required fields
    if (!referralCode || !motorevUserId) {
      return NextResponse.json(
        { error: 'Missing required fields: referralCode, motorevUserId' },
        { status: 400 }
      )
    }

    const signupDate = signupAt ? new Date(signupAt) : new Date()

    // Check if this is a User Affiliate code (MR-XXXXXX format)
    if (isValidUserAffiliateCode(referralCode)) {
      return handleUserAffiliateSignup(
        referralCode.toUpperCase(),
        motorevUserId,
        motorevEmail,
        signupDate
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
      },
    })

    if (!partner) {
      return NextResponse.json(
        { error: 'Affiliate code not found or inactive' },
        { status: 404 }
      )
    }

    // Handle partner signup tracking
    return handlePartnerSignup(
      partner,
      motorevUserId,
      motorevEmail,
      signupDate
    )
  } catch (error) {
    console.error('Error processing signup:', error)
    return NextResponse.json(
      { error: 'Failed to process signup' },
      { status: 500 }
    )
  }
}

// Handle signup for User Affiliate (MR-XXXXXX codes)
async function handleUserAffiliateSignup(
  affiliateCode: string,
  motorevUserId: string,
  motorevEmail: string | undefined,
  signupDate: Date
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

  // Check for duplicate signup (prevent duplicate records)
  const existingSignup = await prisma.userAffiliateReferral.findFirst({
    where: {
      userAffiliateId: userAffiliate.id,
      motorevUserId,
      eventType: 'SIGNUP',
    },
  })

  if (existingSignup) {
    return NextResponse.json({
      success: false,
      message: 'Signup already recorded for this user',
      duplicate: true,
    })
  }

  // Create the signup referral and update referral count
  const referral = await prisma.$transaction(async (tx) => {
    const ref = await tx.userAffiliateReferral.create({
      data: {
        userAffiliateId: userAffiliate.id,
        platform: 'MOTOREV',
        eventType: 'SIGNUP',
        motorevUserId,
        motorevEmail: motorevEmail || null,
        signupAt: signupDate,
      },
    })

    // Increment total referrals count
    await tx.userAffiliate.update({
      where: { id: userAffiliate.id },
      data: {
        totalReferrals: { increment: 1 },
      },
    })

    return ref
  })

  // Award 1 point for verified signup
  let pointsResult = null
  try {
    pointsResult = await awardSignupPoints(
      userAffiliate.id,
      referral.id,
      motorevUserId,
      motorevEmail
    )
  } catch (error) {
    console.error('Error awarding signup points:', error)
    // Don't fail the request if points fail - signup is still recorded
  }

  return NextResponse.json({
    success: true,
    message: 'Signup recorded successfully',
    referralId: referral.id,
    affiliateName: userAffiliate.user.name,
    affiliateType: 'user',
    pointsAwarded: pointsResult?.transaction?.points || 0,
    totalPoints: pointsResult?.affiliate?.availablePoints || 0,
    redemption: pointsResult?.redemption ? {
      id: pointsResult.redemption.id,
      pointsRedeemed: pointsResult.redemption.pointsRedeemed,
      proDaysGranted: pointsResult.redemption.proDaysGranted,
    } : null,
  })
}

// Handle signup for Partner affiliate codes
async function handlePartnerSignup(
  partner: { id: string; name: string },
  motorevUserId: string,
  motorevEmail: string | undefined,
  signupDate: Date
) {
  // Check for duplicate signup
  const existingSignup = await prisma.partnerReferral.findFirst({
    where: {
      partnerId: partner.id,
      motorevUserId,
      eventType: 'SIGNUP',
    },
  })

  if (existingSignup) {
    return NextResponse.json({
      success: false,
      message: 'Signup already recorded for this partner',
      duplicate: true,
    })
  }

  // Create the signup referral
  const referral = await prisma.partnerReferral.create({
    data: {
      partnerId: partner.id,
      platform: 'MOTOREV',
      eventType: 'SIGNUP',
      motorevUserId,
      motorevEmail: motorevEmail || null,
      signupAt: signupDate,
    },
  })

  return NextResponse.json({
    success: true,
    message: 'Signup recorded successfully',
    referralId: referral.id,
    affiliateName: partner.name,
    affiliateType: 'partner',
  })
}
