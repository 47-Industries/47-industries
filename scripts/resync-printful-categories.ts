// Script to resync all Printful products with updated category/gender detection
// Run with: npx tsx scripts/resync-printful-categories.ts

import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env from project root FIRST before any other imports
config({ path: resolve(__dirname, '..', '.env') })

async function main() {
  console.log('Checking Printful configuration...')

  // Dynamic import AFTER env is loaded
  const { syncPrintfulProducts, isPrintfulConfigured } = await import('../src/lib/printful')

  if (!isPrintfulConfigured()) {
    console.error('Error: PRINTFUL_API_KEY is not configured')
    console.error('Make sure your .env file contains PRINTFUL_API_KEY')
    process.exit(1)
  }

  console.log('Starting Printful product resync...')
  console.log('This will update all products with the new category/gender detection.\n')

  try {
    const result = await syncPrintfulProducts()

    console.log(`\n${'='.repeat(50)}`)
    console.log('RESYNC COMPLETE')
    console.log('='.repeat(50))
    console.log(`Successfully synced: ${result.synced} products`)

    if (result.errors.length > 0) {
      console.log(`\nErrors (${result.errors.length}):`)
      result.errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`)
      })
    }

    console.log('\nProducts now have updated:')
    console.log('  - Category (T-Shirts, Hoodies, Swimwear, etc.)')
    console.log('  - Gender (UNISEX, MENS, WOMENS)')
    console.log('  - Brand (BOOKFADE, MOTOREV, FORTY_SEVEN_INDUSTRIES)')
    console.log('  - Manufacturer (Champion, Bella+Canvas, etc.)')
  } catch (error) {
    console.error('Sync failed:', error)
    process.exit(1)
  }
}

main()
