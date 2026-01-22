import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateUserAffiliateCode } from '@/lib/user-affiliate-utils'

// POST /api/mobile/connect
// Connect MotoRev account to 47 Industries user
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
    const { motorevUserId, motorevEmail, motorevUsername } = body

    if (!motorevUserId) {
      return NextResponse.json(
        { error: 'MotoRev user ID is required' },
        { status: 400 }
      )
    }

    // Check if this MotoRev account is already connected to another 47I user
    const existingConnection = await prisma.userAffiliate.findFirst({
      where: {
        motorevUserId: motorevUserId,
        userId: { not: session.user.id },
      },
    })

    if (existingConnection) {
      return NextResponse.json(
        { error: 'This MotoRev account is already connected to another 47 Industries account' },
        { status: 400 }
      )
    }

    // Get or create UserAffiliate record
    let userAffiliate = await prisma.userAffiliate.findUnique({
      where: { userId: session.user.id },
    })

    if (!userAffiliate) {
      // Create new affiliate record with MotoRev connection
      const affiliateCode = generateUserAffiliateCode()
      userAffiliate = await prisma.userAffiliate.create({
        data: {
          userId: session.user.id,
          affiliateCode,
          motorevUserId,
          motorevEmail: motorevEmail || null,
          motorevUsername: motorevUsername || null,
          connectedAt: new Date(),
        },
      })
    } else {
      // Update existing record with MotoRev connection
      userAffiliate = await prisma.userAffiliate.update({
        where: { id: userAffiliate.id },
        data: {
          motorevUserId,
          motorevEmail: motorevEmail || userAffiliate.motorevEmail,
          motorevUsername: motorevUsername || userAffiliate.motorevUsername,
          connectedAt: userAffiliate.connectedAt || new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      affiliateCode: userAffiliate.affiliateCode,
      connected: true,
    })
  } catch (error) {
    console.error('Error connecting MotoRev account:', error)
    return NextResponse.json(
      { error: 'Failed to connect account' },
      { status: 500 }
    )
  }
}
