import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  validateConnectionToken,
  generateUserAffiliateCode,
} from '@/lib/user-affiliate-utils'

// POST /api/motorev/validate-connection
// Called by MotoRev backend to validate a connection token and link accounts
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
    const { token, motorevUserId, motorevEmail, motorevUsername, motorevProfilePicture } = body

    // Validate required fields
    if (!token || !motorevUserId) {
      return NextResponse.json(
        { error: 'Missing required fields: token, motorevUserId' },
        { status: 400 }
      )
    }

    // Validate the connection token
    const payload = validateConnectionToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const { userId, email, name } = payload

    // Check if MotoRev user is already connected to another 47I account
    const existingConnection = await prisma.userAffiliate.findFirst({
      where: { motorevUserId },
    })

    if (existingConnection && existingConnection.userId !== userId) {
      return NextResponse.json(
        { error: 'MotoRev account is already connected to another 47 Industries account' },
        { status: 409 }
      )
    }

    // Find or create the UserAffiliate record
    let userAffiliate = await prisma.userAffiliate.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    if (userAffiliate) {
      // Update existing record with MotoRev connection
      userAffiliate = await prisma.userAffiliate.update({
        where: { id: userAffiliate.id },
        data: {
          motorevUserId,
          motorevEmail: motorevEmail || email,
          motorevUsername: motorevUsername || null,
          motorevProfilePicture: motorevProfilePicture || null,
          connectedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })
    } else {
      // Generate a unique affiliate code
      let affiliateCode = generateUserAffiliateCode()
      let attempts = 0
      const maxAttempts = 10

      // Ensure code is unique
      while (attempts < maxAttempts) {
        const existing = await prisma.userAffiliate.findUnique({
          where: { affiliateCode },
        })
        if (!existing) break
        affiliateCode = generateUserAffiliateCode()
        attempts++
      }

      if (attempts >= maxAttempts) {
        return NextResponse.json(
          { error: 'Failed to generate unique affiliate code' },
          { status: 500 }
        )
      }

      // Create new UserAffiliate record
      userAffiliate = await prisma.userAffiliate.create({
        data: {
          userId,
          motorevUserId,
          motorevEmail: motorevEmail || email,
          motorevUsername: motorevUsername || null,
          motorevProfilePicture: motorevProfilePicture || null,
          connectedAt: new Date(),
          affiliateCode,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Account connected successfully',
      affiliateCode: userAffiliate.affiliateCode,
      user: {
        id: userAffiliate.user.id,
        email: userAffiliate.user.email,
        name: userAffiliate.user.name || name,
      },
      rewardPreference: userAffiliate.rewardPreference,
      shopCommissionRate: Number(userAffiliate.shopCommissionRate),
      motorevProBonus: Number(userAffiliate.motorevProBonus),
      retentionBonus: Number(userAffiliate.retentionBonus),
    })
  } catch (error) {
    console.error('Error validating MotoRev connection:', error)
    return NextResponse.json(
      { error: 'Failed to validate connection' },
      { status: 500 }
    )
  }
}
