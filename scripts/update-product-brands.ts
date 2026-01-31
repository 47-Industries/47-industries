// Script to update product brands based on product names
// Run with: npx tsx scripts/update-product-brands.ts

import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env from project root FIRST
config({ path: resolve(__dirname, '..', '.env') })

async function main() {
  // Dynamic import AFTER env is loaded
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()

  console.log('Updating product brands based on names...\n')

  try {
    // Get all Printful products
    const products = await prisma.product.findMany({
      where: {
        fulfillmentType: 'PRINTFUL',
      },
      select: {
        id: true,
        name: true,
        brand: true,
      },
    })

    console.log(`Found ${products.length} Printful products\n`)

    let updated = 0
    const updates: { name: string; oldBrand: string | null; newBrand: string }[] = []

    for (const product of products) {
      const nameLower = product.name.toLowerCase()
      let newBrand: 'FORTY_SEVEN_INDUSTRIES' | 'BOOKFADE' | 'MOTOREV' | null = null

      // Detect brand from name
      if (nameLower.includes('bookfade') || nameLower.includes('book fade')) {
        newBrand = 'BOOKFADE'
      } else if (nameLower.includes('motorev') || nameLower.includes('moto rev')) {
        newBrand = 'MOTOREV'
      } else if (
        nameLower.includes('47 industries') ||
        nameLower.includes('47industries') ||
        nameLower.startsWith('47 |') ||
        nameLower.startsWith('47|') ||
        nameLower.includes('| 47') ||
        nameLower.includes('forty seven') ||
        nameLower.includes('fortyseven') ||
        nameLower.includes('mindset') ||
        nameLower.includes('hraw')
      ) {
        newBrand = 'FORTY_SEVEN_INDUSTRIES'
      }

      // Default to 47 Industries if no brand detected
      if (!newBrand) {
        newBrand = 'FORTY_SEVEN_INDUSTRIES'
      }

      // Update if brand changed
      if (product.brand !== newBrand) {
        await prisma.product.update({
          where: { id: product.id },
          data: { brand: newBrand },
        })
        updates.push({
          name: product.name,
          oldBrand: product.brand,
          newBrand,
        })
        updated++
      }
    }

    console.log('Updates made:')
    for (const update of updates) {
      console.log(`  "${update.name}"`)
      console.log(`    ${update.oldBrand || 'null'} -> ${update.newBrand}`)
    }

    console.log(`\nDone! Updated ${updated} products.`)

    // Show brand counts
    const brandCounts = await prisma.product.groupBy({
      by: ['brand'],
      where: {
        fulfillmentType: 'PRINTFUL',
        active: true,
      },
      _count: true,
    })

    console.log('\nBrand distribution:')
    for (const bc of brandCounts) {
      const brandName = bc.brand === 'FORTY_SEVEN_INDUSTRIES' ? '47 Industries'
        : bc.brand === 'BOOKFADE' ? 'BookFade'
        : bc.brand === 'MOTOREV' ? 'MotoRev'
        : bc.brand || 'Unknown'
      console.log(`  ${brandName}: ${bc._count} products`)
    }

    await prisma.$disconnect()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
