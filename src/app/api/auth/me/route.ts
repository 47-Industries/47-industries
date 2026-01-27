import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'fallback-secret'
    ) as { userId: string; email: string; role: string }

    // Get user from database with team member profile image fallback
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        isFounder: true,
        permissions: true,
        partnerId: true,
        clientId: true,
        affiliateId: true,
        teamMember: {
          select: {
            profileImageUrl: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Use team member profile image if user image not set
    const userWithImage = {
      ...user,
      image: user.image || user.teamMember?.profileImageUrl || null,
      teamMember: undefined, // Remove nested teamMember from response
    }

    return NextResponse.json({ user: userWithImage })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    )
  }
}
