import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateUserAffiliateCode } from '@/lib/user-affiliate-utils'

// POST /api/account/motorev/complete
// Complete the OAuth connection by saving MotoRev user data
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { userId, username, email, profilePicture, badge } = body

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required MotoRev user data' },
        { status: 400 }
      )
    }

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
          motorevUserId: userId,
          motorevEmail: email,
          motorevUsername: username || null,
          motorevProfilePicture: profilePicture || null,
          motorevBadgeName: badge?.name || null,
          motorevBadgeIcon: badge?.icon || null,
          motorevBadgeColor: badge?.color || null,
          connectedAt: new Date(),
        },
      })
    } else {
      // Update existing record with MotoRev data
      userAffiliate = await prisma.userAffiliate.update({
        where: { id: userAffiliate.id },
        data: {
          motorevUserId: userId,
          motorevEmail: email,
          motorevUsername: username || null,
          motorevProfilePicture: profilePicture || null,
          motorevBadgeName: badge?.name || null,
          motorevBadgeIcon: badge?.icon || null,
          motorevBadgeColor: badge?.color || null,
          connectedAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      affiliateCode: userAffiliate.affiliateCode,
    })
  } catch (error) {
    console.error('Error completing MotoRev connection:', error)
    return NextResponse.json(
      { error: 'Failed to complete connection' },
      { status: 500 }
    )
  }
}
