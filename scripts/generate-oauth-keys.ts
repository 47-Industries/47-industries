/**
 * Script to generate RSA keys for OAuth JWT signing
 */
import { generateKeyPair, exportJWK } from 'jose'

async function main() {
  console.log('\n🔐 Generating RSA key pair for OAuth...\n')

  const { publicKey, privateKey } = await generateKeyPair('RS256', {
    modulusLength: 2048,
  })

  const publicJwk = await exportJWK(publicKey)
  const privateJwk = await exportJWK(privateKey)

  console.log('✅ Keys generated successfully!\n')
  console.log('📋 Add these to 47 Industries Railway environment variables:\n')
  console.log(`OAUTH_PUBLIC_JWK='${JSON.stringify(publicJwk)}'`)
  console.log('')
  console.log(`OAUTH_PRIVATE_JWK='${JSON.stringify(privateJwk)}'`)
  console.log('')
}

main()
  .catch((e) => {
    console.error('\n❌ Error:', e)
    process.exit(1)
  })
