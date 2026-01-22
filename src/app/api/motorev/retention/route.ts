import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  isValidUserAffiliateCode,
  cashToProDays,
  getRetentionMonth,
} from '@/lib/user-affiliate-utils'

// POST /api/motorev/retention
// Called monthly by MotoRev for active Pro users to credit retention bonuses
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
      email,
      signupAt,
      renewalDate,
    } = body

    // Validate required fields
    if (!referralCode || !motorevUserId || !signupAt) {
      return NextResponse.json(
        { error: 'Missing required fields: referralCode, motorevUserId, signupAt' },
        { status: 400 }
      )
    }

    const signupDate = new Date(signupAt)
    const checkDate = renewalDate ? new Date(renewalDate) : new Date()

    // Calculate which retention month this is
    const retentionMonth = getRetentionMonth(signupDate, checkDate)

    if (retentionMonth === 0) {
      return NextResponse.json({
        success: false,
        message: 'Not eligible for retention bonus yet (must be at least 1 month since signup)',
        eligible: false,
      })
    }

    if (retentionMonth > 12) {
      return NextResponse.json({
        success: false,
        message: 'Retention bonus period has ended (12 months maximum)',
        eligible: false,
      })
    }

    // Check if this is a User Affiliate code (MR-XXXXXX format)
    if (isValidUserAffiliateCode(referralCode)) {
      return handleUserAffiliateRetention(
        referralCode.toUpperCase(),
        motorevUserId,
        email,
        signupDate,
        retentionMonth
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

    // Partners don't currently have retention bonuses in the existing system
    // You could add this later if needed
    return NextResponse.json({
      success: false,
      message: 'Retention bonuses are not available for partner affiliates at this time',
      eligible: false,
    })
  } catch (error) {
    console.error('Error processing retention bonus:', error)
    return NextResponse.json(
      { error: 'Failed to process retention bonus' },
      { status: 500 }
    )
  }
}

// Handle retention for User Affiliate (MR-XXXXXX codes)
async function handleUserAffiliateRetention(
  affiliateCode: string,
  motorevUserId: string,
  email: string | undefined,
  signupDate: Date,
  retentionMonth: number
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

  // Check if we already credited this retention month (prevent duplicates)
  const existingReferral = await prisma.userAffiliateReferral.findFirst({
    where: {
      userAffiliateId: userAffiliate.id,
      motorevUserId,
      eventType: 'RETENTION',
      retentionMonth,
    },
  })

  if (existingReferral) {
    return NextResponse.json(
      { error: `Retention bonus for month ${retentionMonth} already credited` },
      { status: 409 }
    )
  }

  // Verify there was an original PRO_CONVERSION referral for this user
  const originalReferral = await prisma.userAffiliateReferral.findFirst({
    where: {
      userAffiliateId: userAffiliate.id,
      motorevUserId,
      eventType: 'PRO_CONVERSION',
    },
  })

  if (!originalReferral) {
    return NextResponse.json(
      { error: 'No original Pro conversion found for this user from this affiliate' },
      { status: 404 }
    )
  }

  // Determine bonus and reward type based on preference
  const bonusAmount = Number(userAffiliate.retentionBonus)
  const rewardType = userAffiliate.rewardPreference
  const proTimeDays = rewardType === 'PRO_TIME' ? cashToProDays(bonusAmount) : null

  // Create referral and commission in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the retention referral
    const referral = await tx.userAffiliateReferral.create({
      data: {
        userAffiliateId: userAffiliate.id,
        platform: 'MOTOREV',
        eventType: 'RETENTION',
        motorevUserId,
        motorevEmail: email || null,
        signupAt: signupDate,
        retentionMonth,
      },
    })

    // Create the commission
    const commission = await tx.userAffiliateCommission.create({
      data: {
        userAffiliateId: userAffiliate.id,
        referralId: referral.id,
        type: 'RETENTION_BONUS',
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
          source: 'RETENTION_BONUS',
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
    message: `Retention bonus for month ${retentionMonth} recorded successfully`,
    referralId: result.referral.id,
    commissionId: result.commission.id,
    commissionAmount: bonusAmount,
    rewardType,
    proTimeDays,
    retentionMonth,
    affiliateName: userAffiliate.user.name,
    affiliateType: 'user',
  })
}
