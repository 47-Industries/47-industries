// User Affiliate Points System
// Handles point awarding, auto-redemption, and MotoRev Pro grants

import { prisma } from './prisma'

// ============================================
// CONSTANTS
// ============================================

export const POINTS = {
  /** Points earned for each verified user signup */
  VERIFIED_SIGNUP: 1,
  /** Points earned for each Pro conversion */
  PRO_CONVERSION: 10,
  /** Points required for auto-redemption */
  REDEMPTION_THRESHOLD: 10,
  /** Pro days granted per redemption */
  DAYS_PER_REDEMPTION: 7,
  /** Total referrals needed to show Partner CTA */
  PARTNER_CTA_THRESHOLD: 25,
} as const

export type PointTransactionType = 'VERIFIED_SIGNUP' | 'PRO_CONVERSION' | 'MANUAL_ADJUSTMENT'

// ============================================
// POINT AWARDING
// ============================================

interface AwardPointsParams {
  userAffiliateId: string
  type: PointTransactionType
  points: number
  referralId?: string
  motorevUserId?: string
  motorevEmail?: string
  description?: string
}

/**
 * Award points to a user affiliate and check for auto-redemption
 * @returns The created PointTransaction and any PointRedemption
 */
export async function awardPoints(params: AwardPointsParams) {
  const {
    userAffiliateId,
    type,
    points,
    referralId,
    motorevUserId,
    motorevEmail,
    description,
  } = params

  // Create the point transaction and update user affiliate in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create point transaction
    const transaction = await tx.pointTransaction.create({
      data: {
        userAffiliateId,
        type,
        points,
        referralId,
        motorevUserId,
        motorevEmail,
        description,
      },
    })

    // Update user affiliate points
    const updatedAffiliate = await tx.userAffiliate.update({
      where: { id: userAffiliateId },
      data: {
        totalPoints: { increment: points },
        availablePoints: { increment: points },
      },
      select: {
        id: true,
        motorevUserId: true,
        availablePoints: true,
        totalReferrals: true,
      },
    })

    return { transaction, affiliate: updatedAffiliate }
  })

  // Check and auto-redeem if threshold met
  const redemption = await checkAndAutoRedeem(result.affiliate.id)

  return {
    transaction: result.transaction,
    affiliate: result.affiliate,
    redemption,
  }
}

/**
 * Award points for a verified signup event
 */
export async function awardSignupPoints(
  userAffiliateId: string,
  referralId: string,
  motorevUserId?: string,
  motorevEmail?: string
) {
  return awardPoints({
    userAffiliateId,
    type: 'VERIFIED_SIGNUP',
    points: POINTS.VERIFIED_SIGNUP,
    referralId,
    motorevUserId,
    motorevEmail,
    description: `Verified signup${motorevEmail ? ` from ${motorevEmail}` : ''}`,
  })
}

/**
 * Award points for a Pro conversion event
 */
export async function awardProConversionPoints(
  userAffiliateId: string,
  referralId: string,
  motorevUserId?: string,
  motorevEmail?: string
) {
  return awardPoints({
    userAffiliateId,
    type: 'PRO_CONVERSION',
    points: POINTS.PRO_CONVERSION,
    referralId,
    motorevUserId,
    motorevEmail,
    description: `Pro conversion${motorevEmail ? ` from ${motorevEmail}` : ''}`,
  })
}

// ============================================
// AUTO-REDEMPTION
// ============================================

/**
 * Check if user has enough points for auto-redemption and process if so
 * @param userAffiliateId - The user affiliate to check
 * @returns The PointRedemption if created, null otherwise
 */
export async function checkAndAutoRedeem(userAffiliateId: string) {
  // Get current available points
  const affiliate = await prisma.userAffiliate.findUnique({
    where: { id: userAffiliateId },
    select: {
      id: true,
      availablePoints: true,
      motorevUserId: true,
      pointsRedeemed: true,
    },
  })

  if (!affiliate) {
    throw new Error(`User affiliate not found: ${userAffiliateId}`)
  }

  // Check if threshold met
  if (affiliate.availablePoints < POINTS.REDEMPTION_THRESHOLD) {
    return null
  }

  // Calculate how many redemptions to process
  const redemptionsCount = Math.floor(affiliate.availablePoints / POINTS.REDEMPTION_THRESHOLD)
  const pointsToRedeem = redemptionsCount * POINTS.REDEMPTION_THRESHOLD
  const daysToGrant = redemptionsCount * POINTS.DAYS_PER_REDEMPTION

  // Process redemption in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create redemption record
    const redemption = await tx.pointRedemption.create({
      data: {
        userAffiliateId,
        pointsRedeemed: pointsToRedeem,
        proDaysGranted: daysToGrant,
        status: 'PENDING',
      },
    })

    // Deduct points from available, add to redeemed
    await tx.userAffiliate.update({
      where: { id: userAffiliateId },
      data: {
        availablePoints: { decrement: pointsToRedeem },
        pointsRedeemed: { increment: pointsToRedeem },
        proTimeEarnedDays: { increment: daysToGrant },
      },
    })

    return redemption
  })

  // Notify MotoRev to grant Pro time if user is connected
  if (affiliate.motorevUserId) {
    await notifyMotoRevProGrant(affiliate.motorevUserId, daysToGrant, result.id)
  }

  return result
}

// ============================================
// MOTOREV INTEGRATION
// ============================================

/**
 * Notify MotoRev backend to grant Pro time to a user
 * @param motorevUserId - The MotoRev user ID
 * @param days - Number of Pro days to grant
 * @param redemptionId - The PointRedemption ID for tracking
 */
export async function notifyMotoRevProGrant(
  motorevUserId: string,
  days: number,
  redemptionId: string
) {
  const motorevApiUrl = process.env.MOTOREV_API_URL
  const apiKey = process.env.MOTOREV_AFFILIATE_API_KEY

  if (!motorevApiUrl || !apiKey) {
    console.error('MotoRev API not configured, cannot grant Pro time')
    await markRedemptionFailed(redemptionId, 'MotoRev API not configured')
    return false
  }

  try {
    const response = await fetch(`${motorevApiUrl}/api/affiliate/grant-pro-time`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        motorevUserId,
        days,
        source: 'affiliate_points',
        redemptionId,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to grant Pro time:', errorText)
      await markRedemptionFailed(redemptionId, `API error: ${response.status}`)
      return false
    }

    // Mark redemption as applied
    await prisma.pointRedemption.update({
      where: { id: redemptionId },
      data: {
        status: 'APPLIED',
        appliedAt: new Date(),
      },
    })

    return true
  } catch (error) {
    console.error('Error notifying MotoRev:', error)
    await markRedemptionFailed(
      redemptionId,
      error instanceof Error ? error.message : 'Unknown error'
    )
    return false
  }
}

/**
 * Mark a redemption as failed
 */
async function markRedemptionFailed(redemptionId: string, reason: string) {
  await prisma.pointRedemption.update({
    where: { id: redemptionId },
    data: {
      status: 'FAILED',
      failureReason: reason,
    },
  })
}

// ============================================
// STATS & QUERIES
// ============================================

/**
 * Get affiliate points stats for display
 */
export async function getAffiliatePointsStats(userAffiliateId: string) {
  const affiliate = await prisma.userAffiliate.findUnique({
    where: { id: userAffiliateId },
    select: {
      id: true,
      affiliateCode: true,
      totalPoints: true,
      availablePoints: true,
      pointsRedeemed: true,
      totalReferrals: true,
      proTimeEarnedDays: true,
      isPartner: true,
      partnerId: true,
      motorevUserId: true,
      motorevEmail: true,
      motorevUsername: true,
      motorevProfilePicture: true,
      motorevBadgeName: true,
      motorevBadgeIcon: true,
      motorevBadgeColor: true,
      _count: {
        select: {
          pointTransactions: true,
          pointRedemptions: true,
        },
      },
    },
  })

  if (!affiliate) {
    return null
  }

  // Count Pro conversions separately
  const proConversions = await prisma.pointTransaction.count({
    where: {
      userAffiliateId,
      type: 'PRO_CONVERSION',
    },
  })

  // Calculate points to next reward
  const pointsToNextReward = POINTS.REDEMPTION_THRESHOLD - (affiliate.availablePoints % POINTS.REDEMPTION_THRESHOLD)
  const progressPercent = Math.round(
    ((affiliate.availablePoints % POINTS.REDEMPTION_THRESHOLD) / POINTS.REDEMPTION_THRESHOLD) * 100
  )

  return {
    affiliateCode: affiliate.affiliateCode,
    points: {
      total: affiliate.totalPoints,
      available: affiliate.availablePoints,
      redeemed: affiliate.pointsRedeemed,
      toNextReward: affiliate.availablePoints >= POINTS.REDEMPTION_THRESHOLD ? 0 : pointsToNextReward,
      progressPercent,
    },
    stats: {
      totalReferrals: affiliate.totalReferrals,
      proConversions,
      proDaysEarned: affiliate.proTimeEarnedDays,
      totalTransactions: affiliate._count.pointTransactions,
      totalRedemptions: affiliate._count.pointRedemptions,
    },
    partnerEligible: affiliate.totalReferrals >= POINTS.PARTNER_CTA_THRESHOLD && !affiliate.isPartner,
    isPartner: affiliate.isPartner,
    partnerId: affiliate.partnerId,
    motorev: affiliate.motorevUserId ? {
      userId: affiliate.motorevUserId,
      email: affiliate.motorevEmail,
      username: affiliate.motorevUsername,
      profilePicture: affiliate.motorevProfilePicture,
      badge: affiliate.motorevBadgeName ? {
        name: affiliate.motorevBadgeName,
        icon: affiliate.motorevBadgeIcon,
        color: affiliate.motorevBadgeColor,
      } : null,
    } : null,
    shareLink: `https://motorev.app/signup?ref=${affiliate.affiliateCode}`,
  }
}

/**
 * Get recent point transactions for an affiliate
 */
export async function getRecentPointTransactions(
  userAffiliateId: string,
  limit = 10
) {
  return prisma.pointTransaction.findMany({
    where: { userAffiliateId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      type: true,
      points: true,
      description: true,
      motorevEmail: true,
      createdAt: true,
    },
  })
}

/**
 * Get point redemption history for an affiliate
 */
export async function getPointRedemptions(
  userAffiliateId: string,
  limit = 10
) {
  return prisma.pointRedemption.findMany({
    where: { userAffiliateId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      pointsRedeemed: true,
      proDaysGranted: true,
      status: true,
      appliedAt: true,
      failureReason: true,
      createdAt: true,
    },
  })
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

/**
 * Manually adjust points for an affiliate (admin only)
 */
export async function adminAdjustPoints(
  userAffiliateId: string,
  points: number,
  reason: string,
  adminUserId: string
) {
  return prisma.$transaction(async (tx) => {
    // Create transaction record
    const transaction = await tx.pointTransaction.create({
      data: {
        userAffiliateId,
        type: 'MANUAL_ADJUSTMENT',
        points,
        description: `Admin adjustment: ${reason} (by ${adminUserId})`,
      },
    })

    // Update affiliate points
    if (points > 0) {
      await tx.userAffiliate.update({
        where: { id: userAffiliateId },
        data: {
          totalPoints: { increment: points },
          availablePoints: { increment: points },
        },
      })
    } else {
      // For negative adjustments, only reduce available (not below 0)
      const affiliate = await tx.userAffiliate.findUnique({
        where: { id: userAffiliateId },
        select: { availablePoints: true },
      })

      if (!affiliate) {
        throw new Error('Affiliate not found')
      }

      const newAvailable = Math.max(0, affiliate.availablePoints + points)
      await tx.userAffiliate.update({
        where: { id: userAffiliateId },
        data: {
          availablePoints: newAvailable,
        },
      })
    }

    return transaction
  })
}

/**
 * Retry a failed redemption
 */
export async function retryFailedRedemption(redemptionId: string) {
  const redemption = await prisma.pointRedemption.findUnique({
    where: { id: redemptionId },
    include: {
      userAffiliate: {
        select: { motorevUserId: true },
      },
    },
  })

  if (!redemption) {
    throw new Error('Redemption not found')
  }

  if (redemption.status !== 'FAILED') {
    throw new Error('Redemption is not in FAILED status')
  }

  if (!redemption.userAffiliate.motorevUserId) {
    throw new Error('User does not have MotoRev connected')
  }

  // Reset status to pending
  await prisma.pointRedemption.update({
    where: { id: redemptionId },
    data: {
      status: 'PENDING',
      failureReason: null,
    },
  })

  // Retry the notification
  return notifyMotoRevProGrant(
    redemption.userAffiliate.motorevUserId,
    redemption.proDaysGranted,
    redemptionId
  )
}
