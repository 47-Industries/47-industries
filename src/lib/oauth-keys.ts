import { generateKeyPair, exportJWK, SignJWT } from 'jose'
import crypto from 'crypto'

// Generate RSA key pair for JWT signing
export async function generateOAuthKeys() {
  const { publicKey, privateKey } = await generateKeyPair('RS256', {
    modulusLength: 2048,
  })
  
  const publicJwk = await exportJWK(publicKey)
  const privateJwk = await exportJWK(privateKey)
  
  return { publicJwk, privateJwk }
}

// Get or generate RSA keys from environment
let cachedKeys: { publicJwk: any; privateJwk: any } | null = null

export async function getOAuthKeys() {
  if (cachedKeys) return cachedKeys

  // Check if keys exist in environment
  const publicJwkEnv = process.env.OAUTH_PUBLIC_JWK
  const privateJwkEnv = process.env.OAUTH_PRIVATE_JWK

  if (publicJwkEnv && privateJwkEnv) {
    cachedKeys = {
      publicJwk: JSON.parse(publicJwkEnv),
      privateJwk: JSON.parse(privateJwkEnv),
    }
    return cachedKeys
  }

  // Generate new keys (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.error('[OAUTH] Keys not found in environment, generating temporary keys')
  }
  cachedKeys = await generateOAuthKeys()
  return cachedKeys
}

// Sign a JWT with RS256
export async function signJWT(payload: any) {
  const { privateJwk } = await getOAuthKeys()
  
  // Import the private key
  const { importJWK } = await import('jose')
  const privateKey = await importJWK(privateJwk, 'RS256')
  
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(payload.exp)
    .sign(privateKey)
  
  return jwt
}
