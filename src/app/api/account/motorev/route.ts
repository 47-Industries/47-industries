import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateUserAffiliateCode, generateConnectionToken } from '@/lib/user-affiliate-utils'

// GET /api/account/motorev
// Get MotoRev connection status and affiliate info
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has a UserAffiliate record
    const userAffiliate = await prisma.userAffiliate.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        affiliateCode: true,
        motorevUserId: true,
        motorevEmail: true,
        motorevUsername: true,
        motorevProfilePicture: true,
        motorevBadgeName: true,
        motorevBadgeIcon: true,
        motorevBadgeColor: true,
        connectedAt: true,
        rewardPreference: true,
        totalReferrals: true,
        totalEarnings: true,
        pendingEarnings: true,
        proTimeEarnedDays: true,
        shopCommissionRate: true,
        motorevProBonus: true,
        retentionBonus: true,
        isPartner: true,
      },
    })

    if (!userAffiliate) {
      return NextResponse.json({
        connected: false,
        hasAffiliate: false,
      })
    }

    const isConnected = !!userAffiliate.motorevUserId

    return NextResponse.json({
      connected: isConnected,
      hasAffiliate: true,
      affiliate: {
        id: userAffiliate.id,
        affiliateCode: userAffiliate.affiliateCode,
        motorevUserId: userAffiliate.motorevUserId,
        motorevEmail: userAffiliate.motorevEmail,
        motorevUsername: userAffiliate.motorevUsername,
        motorevProfilePicture: userAffiliate.motorevProfilePicture,
        motorevBadge: userAffiliate.motorevBadgeIcon ? {
          name: userAffiliate.motorevBadgeName,
          icon: userAffiliate.motorevBadgeIcon,
          color: userAffiliate.motorevBadgeColor,
        } : null,
        connectedAt: userAffiliate.connectedAt?.toISOString() || null,
        rewardPreference: userAffiliate.rewardPreference,
        stats: {
          totalReferrals: userAffiliate.totalReferrals,
          totalEarnings: Number(userAffiliate.totalEarnings),
          pendingEarnings: Number(userAffiliate.pendingEarnings),
          proTimeEarnedDays: userAffiliate.proTimeEarnedDays,
        },
        rates: {
          shopCommission: Number(userAffiliate.shopCommissionRate),
          proBonus: Number(userAffiliate.motorevProBonus),
          retentionBonus: Number(userAffiliate.retentionBonus),
        },
        isPartner: userAffiliate.isPartner,
      },
    })
  } catch (error) {
    console.error('Error fetching MotoRev status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MotoRev status' },
      { status: 500 }
    )
  }
}

// POST /api/account/motorev
// Create affiliate record and/or generate connection token
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { action } = body

    // Get or create UserAffiliate record
    let userAffiliate = await prisma.userAffiliate.findUnique({
      where: { userId: session.user.id },
    })

    if (!userAffiliate) {
      // Create new affiliate record
      const affiliateCode = generateUserAffiliateCode()
      userAffiliate = await prisma.userAffiliate.create({
        data: {
          userId: session.user.id,
          affiliateCode,
        },
      })
    }

    if (action === 'generate-token') {
      // Generate a connection token for the MotoRev app
      const token = generateConnectionToken(
        session.user.id,
        session.user.email || '',
        session.user.name || undefined
      )

      // Build deep link URL
      const deepLink = `motorev://affiliate-connect?token=${encodeURIComponent(token)}`
      const webLink = `https://motorevapp.com/connect?token=${encodeURIComponent(token)}`

      return NextResponse.json({
        success: true,
        affiliateCode: userAffiliate.affiliateCode,
        token,
        deepLink,
        webLink,
      })
    }

    // Default: just return the affiliate info
    return NextResponse.json({
      success: true,
      affiliateCode: userAffiliate.affiliateCode,
      connected: !!userAffiliate.motorevUserId,
    })
  } catch (error) {
    console.error('Error creating MotoRev connection:', error)
    return NextResponse.json(
      { error: 'Failed to create connection' },
      { status: 500 }
    )
  }
}

// DELETE /api/account/motorev
// Disconnect MotoRev account
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userAffiliate = await prisma.userAffiliate.findUnique({
      where: { userId: session.user.id },
    })

    if (!userAffiliate) {
      return NextResponse.json(
        { error: 'No affiliate record found' },
        { status: 404 }
      )
    }

    if (!userAffiliate.motorevUserId) {
      return NextResponse.json(
        { error: 'MotoRev account not connected' },
        { status: 400 }
      )
    }

    // Clear MotoRev connection but keep the affiliate record
    await prisma.userAffiliate.update({
      where: { id: userAffiliate.id },
      data: {
        motorevUserId: null,
        motorevEmail: null,
        connectedAt: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'MotoRev account disconnected',
    })
  } catch (error) {
    console.error('Error disconnecting MotoRev:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect MotoRev' },
      { status: 500 }
    )
  }
}

// PUT /api/account/motorev
// Update affiliate preferences
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { rewardPreference } = body

    if (rewardPreference && !['CASH', 'PRO_TIME'].includes(rewardPreference)) {
      return NextResponse.json(
        { error: 'Invalid reward preference' },
        { status: 400 }
      )
    }

    const userAffiliate = await prisma.userAffiliate.findUnique({
      where: { userId: session.user.id },
    })

    if (!userAffiliate) {
      return NextResponse.json(
        { error: 'No affiliate record found' },
        { status: 404 }
      )
    }

    const updated = await prisma.userAffiliate.update({
      where: { id: userAffiliate.id },
      data: {
        rewardPreference: rewardPreference || userAffiliate.rewardPreference,
      },
    })

    return NextResponse.json({
      success: true,
      rewardPreference: updated.rewardPreference,
    })
  } catch (error) {
    console.error('Error updating MotoRev preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
