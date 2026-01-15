import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/invite/partner/verify - Verify partner invite token
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find user with this invite token
    const user = await prisma.user.findUnique({
      where: { inviteToken: token },
      include: {
        partner: {
          select: {
            partnerNumber: true,
            firstSaleRate: true,
            recurringRate: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 })
    }

    // Check if token is expired
    if (user.inviteTokenExpiry && new Date() > user.inviteTokenExpiry) {
      return NextResponse.json({ error: 'Invite link has expired. Please contact support.' }, { status: 400 })
    }

    // Check if user already has a password (already set up)
    if (user.password) {
      return NextResponse.json({ error: 'Account has already been set up. Please sign in.' }, { status: 400 })
    }

    // Check if user is a partner
    if (!user.partner) {
      return NextResponse.json({ error: 'Invalid invite link' }, { status: 400 })
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      partnerNumber: user.partner.partnerNumber,
      firstSaleRate: Number(user.partner.firstSaleRate),
      recurringRate: Number(user.partner.recurringRate),
    })
  } catch (error) {
    console.error('Error verifying invite:', error)
    return NextResponse.json({ error: 'Failed to verify invite' }, { status: 500 })
  }
}
