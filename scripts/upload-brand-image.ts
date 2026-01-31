// Script to upload brand images to R2
// Run with: npx tsx scripts/upload-brand-image.ts

import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Load .env from project root
config({ path: resolve(__dirname, '..', '.env') })

async function main() {
  const { uploadToR2, generateFileKey, isR2Configured } = await import('../src/lib/r2')

  if (!isR2Configured) {
    console.error('R2 is not configured. Please set up environment variables.')
    process.exit(1)
  }

  // Path to the 47 Industries brand photo
  const imagePath = '/Users/kylerivers/Documents/photos.png'

  console.log(`Reading image from: ${imagePath}`)

  try {
    const imageBuffer = readFileSync(imagePath)
    const key = generateFileKey('47-industries-brand-photo.png', 'brand-images')

    console.log(`Uploading to R2 with key: ${key}`)

    const url = await uploadToR2(key, imageBuffer, 'image/png')

    console.log('\nUpload successful!')
    console.log('Public URL:', url)
    console.log('\nUpdate the BRAND_DETAILS in ApparelLanding.tsx with this URL for FORTY_SEVEN_INDUSTRIES')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
