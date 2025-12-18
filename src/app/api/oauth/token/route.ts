import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// POST /api/oauth/token
// OAuth 2.0 Token Endpoint
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      grant_type,
      code,
      redirect_uri,
      client_id,
      client_secret,
      code_verifier,
    } = body

    // Validate grant_type
    if (grant_type !== 'authorization_code') {
      return NextResponse.json(
        { error: 'unsupported_grant_type', error_description: 'Only authorization_code grant type is supported' },
        { status: 400 }
      )
    }

    // Validate required parameters
    if (!code || !redirect_uri || !client_id || !client_secret) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Find the OAuth application
    const application = await prisma.oAuthApplication.findUnique({
      where: { clientId: client_id }
    })

    if (!application || application.clientSecret !== client_secret) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Invalid client credentials' },
        { status: 401 }
      )
    }

    if (!application.active) {
      return NextResponse.json(
        { error: 'access_denied', error_description: 'Application is disabled' },
        { status: 403 }
      )
    }

    // Find the authorization code
    const authCode = await prisma.oAuthAuthorizationCode.findUnique({
      where: { code }
    })

    if (!authCode) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid authorization code' },
        { status: 400 }
      )
    }

    // Validate authorization code
    if (authCode.used) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Authorization code already used' },
        { status: 400 }
      )
    }

    if (authCode.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Authorization code expired' },
        { status: 400 }
      )
    }

    if (authCode.applicationId !== application.id) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Authorization code was not issued to this client' },
        { status: 400 }
      )
    }

    if (authCode.redirectUri !== redirect_uri) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Redirect URI mismatch' },
        { status: 400 }
      )
    }

    // Validate PKCE if used
    if (authCode.codeChallenge) {
      if (!code_verifier) {
        return NextResponse.json(
          { error: 'invalid_grant', error_description: 'code_verifier required for PKCE' },
          { status: 400 }
        )
      }

      const method = authCode.codeChallengeMethod || 'plain'
      let computedChallenge = code_verifier

      if (method === 'S256') {
        computedChallenge = crypto
          .createHash('sha256')
          .update(code_verifier)
          .digest('base64url')
      }

      if (computedChallenge !== authCode.codeChallenge) {
        return NextResponse.json(
          { error: 'invalid_grant', error_description: 'Invalid code_verifier' },
          { status: 400 }
        )
      }
    }

    // Mark code as used
    await prisma.oAuthAuthorizationCode.update({
      where: { id: authCode.id },
      data: { used: true }
    })

    // Generate access token
    const accessToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await prisma.oAuthAccessToken.create({
      data: {
        token: accessToken,
        applicationId: application.id,
        userId: authCode.userId,
        scopes: authCode.scopes,
        expiresAt,
      }
    })

    return NextResponse.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 30 * 24 * 60 * 60, // 30 days in seconds
      scope: (authCode.scopes as string[]).join(' '),
    })
  } catch (error) {
    console.error('OAuth token error:', error)
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    )
  }
}
