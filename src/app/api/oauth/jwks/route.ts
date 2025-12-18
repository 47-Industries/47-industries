import { NextResponse } from 'next/server'
import { getOAuthKeys } from '@/lib/oauth-keys'

// GET /api/oauth/jwks
// JSON Web Key Set endpoint for JWT verification
export async function GET() {
  const { publicJwk } = await getOAuthKeys()
  
  // Add required JWK fields
  const jwk = {
    ...publicJwk,
    use: 'sig',
    kid: 'oauth-key-1',
    alg: 'RS256',
  }
  
  return NextResponse.json(
    {
      keys: [jwk],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    }
  )
}
