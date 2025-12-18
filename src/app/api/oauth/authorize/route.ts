import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/oauth/authorize
// OAuth 2.0 Authorization Endpoint
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const clientId = searchParams.get('client_id')
    const redirectUri = searchParams.get('redirect_uri')
    const state = searchParams.get('state')
    const scope = searchParams.get('scope') || 'openid email profile'
    const responseType = searchParams.get('response_type') || 'code'
    const codeChallenge = searchParams.get('code_challenge')
    const codeChallengeMethod = searchParams.get('code_challenge_method')

    // Validate required parameters
    if (!clientId || !redirectUri) {
      return new NextResponse('Missing required parameters: client_id and redirect_uri', { status: 400 })
    }

    if (responseType !== 'code') {
      return new NextResponse('Unsupported response_type. Only "code" is supported.', { status: 400 })
    }

    // Find the OAuth application
    const application = await prisma.oAuthApplication.findUnique({
      where: { clientId }
    })

    if (!application) {
      return new NextResponse('Invalid client_id', { status: 400 })
    }

    if (!application.active) {
      return new NextResponse('Application is disabled', { status: 403 })
    }

    // Validate redirect URI
    const redirectUris = application.redirectUris as string[]
    if (!redirectUris.includes(redirectUri)) {
      return new NextResponse('Invalid redirect_uri', { status: 400 })
    }

    // Check if user is logged in
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      // Redirect to login, then back here
      const loginUrl = new URL('/admin/login', req.url)
      loginUrl.searchParams.set('callbackUrl', req.url)
      return NextResponse.redirect(loginUrl)
    }

    // Find the user in database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Generate authorization code
    const code = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await prisma.oAuthAuthorizationCode.create({
      data: {
        code,
        applicationId: application.id,
        userId: user.id,
        redirectUri,
        scopes: scope.split(' '),
        codeChallenge,
        codeChallengeMethod,
        expiresAt,
      }
    })

    // Redirect back to the application with the code
    const callback = new URL(redirectUri)
    callback.searchParams.set('code', code)
    if (state) {
      callback.searchParams.set('state', state)
    }

    return NextResponse.redirect(callback)
  } catch (error) {
    console.error('OAuth authorize error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
