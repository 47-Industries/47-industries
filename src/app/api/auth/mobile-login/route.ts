import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email/username and password are required' },
        { status: 400 }
      )
    }

    // Find user by email or username
    const identifier = email.toLowerCase()
    const isEmail = identifier.includes('@')

    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: identifier }
        : { username: identifier },
      include: {
        teamMember: {
          select: {
            id: true,
            name: true,
            gender: true,
            profileImageUrl: true,
          },
        },
        partner: {
          select: {
            id: true,
          },
        },
        client: {
          select: {
            id: true,
          },
        },
        userAffiliate: {
          select: {
            id: true,
            affiliateCode: true,
          },
        },
      },
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Determine portal access
    const portalAccess = {
      admin: user.role === 'ADMIN' || user.role === 'SUPER_ADMIN',
      partner: !!user.partner,
      client: !!user.client,
      affiliate: !!user.userAffiliate,
    }

    // Check if user has access to at least one portal
    const hasAnyAccess = portalAccess.admin || portalAccess.partner || portalAccess.client || portalAccess.affiliate
    if (!hasAnyAccess) {
      return NextResponse.json(
        { error: 'No portal access. Contact support if you believe this is an error.' },
        { status: 403 }
      )
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '30d' }
    )

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        isFounder: user.isFounder,
        image: user.image || user.teamMember?.profileImageUrl || null,
        permissions: user.permissions,
        partnerId: user.partner?.id || null,
        clientId: user.client?.id || null,
        affiliateId: user.userAffiliate?.id || null,
        teamMember: user.teamMember ? {
          id: user.teamMember.id,
          name: user.teamMember.name,
          gender: user.teamMember.gender,
        } : null,
      },
      portalAccess,
    })
  } catch (error) {
    console.error('Mobile login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
