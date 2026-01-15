import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST /api/invite/partner/complete - Complete partner invite (set password)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Find user with this invite token
    const user = await prisma.user.findUnique({
      where: { inviteToken: token },
      include: {
        partner: true,
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

    // Hash password and update user
    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        inviteToken: null, // Clear the invite token
        inviteTokenExpiry: null,
        emailVerified: new Date(), // Mark email as verified since they clicked the link
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error completing invite:', error)
    return NextResponse.json({ error: 'Failed to complete setup' }, { status: 500 })
  }
}
