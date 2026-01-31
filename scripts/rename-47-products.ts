// Quick script to rename "47 |" to "47 Industries |" in product names
// Run with: npx tsx scripts/rename-47-products.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Finding products to rename...')

  // Find all products that start with "47 |" or "47|"
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { startsWith: '47 |' } },
        { name: { startsWith: '47|' } },
      ],
    },
    select: {
      id: true,
      name: true,
    },
  })

  console.log(`Found ${products.length} products to rename`)

  let updated = 0
  for (const product of products) {
    let newName = product.name

    // Replace "47 |" with "47 Industries |"
    if (newName.startsWith('47 |')) {
      newName = newName.replace('47 |', '47 Industries |')
    } else if (newName.startsWith('47|')) {
      newName = newName.replace('47|', '47 Industries |')
    }

    if (newName !== product.name) {
      console.log(`  "${product.name}" -> "${newName}"`)
      await prisma.product.update({
        where: { id: product.id },
        data: { name: newName },
      })
      updated++
    }
  }

  console.log(`\nDone! Updated ${updated} products.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
