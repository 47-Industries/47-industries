import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/motorev/affiliate/preference
// Updates the reward preference for a MotoRev affiliate
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
    const { motorevUserId, preference } = body

    // Validate required fields
    if (!motorevUserId || !preference) {
      return NextResponse.json(
        { error: 'Missing required fields: motorevUserId, preference' },
        { status: 400 }
      )
    }

    // Validate preference value
    if (!['CASH', 'PRO_TIME'].includes(preference)) {
      return NextResponse.json(
        { error: 'Invalid preference. Must be CASH or PRO_TIME' },
        { status: 400 }
      )
    }

    // Find the user affiliate by MotoRev user ID
    const userAffiliate = await prisma.userAffiliate.findFirst({
      where: { motorevUserId },
    })

    if (!userAffiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      )
    }

    // Update the preference
    const updated = await prisma.userAffiliate.update({
      where: { id: userAffiliate.id },
      data: {
        rewardPreference: preference,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Preference updated successfully',
      rewardPreference: updated.rewardPreference,
    })
  } catch (error) {
    console.error('Error updating affiliate preference:', error)
    return NextResponse.json(
      { error: 'Failed to update preference' },
      { status: 500 }
    )
  }
}
