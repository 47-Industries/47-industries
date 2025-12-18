import { NextResponse } from 'next/server'

// OpenID Connect Discovery endpoint
// https://openid.net/specs/openid-connect-discovery-1_0.html
export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://admin.47industries.com'

  const config = {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/oauth/token`,
    userinfo_endpoint: `${baseUrl}/api/oauth/userinfo`,
    jwks_uri: `${baseUrl}/api/oauth/jwks`,
    response_types_supported: ['code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    scopes_supported: ['openid', 'email', 'profile'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
    claims_supported: [
      'sub',
      'email',
      'email_verified',
      'name',
      'picture',
      'role',
      'isFounder',
    ],
    code_challenge_methods_supported: ['S256', 'plain'],
  }

  return NextResponse.json(config, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
