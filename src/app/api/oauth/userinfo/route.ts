import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/oauth/userinfo
// OAuth 2.0 UserInfo Endpoint (OpenID Connect)
export async function GET(req: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'invalid_token', error_description: 'Missing or invalid Authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove "Bearer "

    // Find the access token
    const accessToken = await prisma.oAuthAccessToken.findUnique({
      where: { token },
      include: {
        application: true
      }
    })

    if (!accessToken) {
      return NextResponse.json(
        { error: 'invalid_token', error_description: 'Invalid access token' },
        { status: 401 }
      )
    }

    // Validate token
    if (accessToken.revoked) {
      return NextResponse.json(
        { error: 'invalid_token', error_description: 'Token has been revoked' },
        { status: 401 }
      )
    }

    if (accessToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'invalid_token', error_description: 'Token has expired' },
        { status: 401 }
      )
    }

    if (!accessToken.application.active) {
      return NextResponse.json(
        { error: 'invalid_token', error_description: 'Application is disabled' },
        { status: 401 }
      )
    }

    // Update last used timestamp
    await prisma.oAuthAccessToken.update({
      where: { id: accessToken.id },
      data: { lastUsedAt: new Date() }
    })

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: accessToken.userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'invalid_token', error_description: 'User not found' },
        { status: 404 }
      )
    }

    // Return user info based on granted scopes
    const scopes = accessToken.scopes as string[]
    const userInfo: any = {}

    if (scopes.includes('openid')) {
      userInfo.sub = user.id
    }

    if (scopes.includes('email')) {
      userInfo.email = user.email
      userInfo.email_verified = !!user.emailVerified
    }

    if (scopes.includes('profile')) {
      userInfo.name = user.name
      userInfo.picture = user.image
    }

    return NextResponse.json(userInfo)
  } catch (error) {
    console.error('OAuth userinfo error:', error)
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    )
  }
}
