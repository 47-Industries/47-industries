import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding BookFade products...')

  // Create or get the Partner Products category
  let partnerCategory = await prisma.category.findUnique({
    where: { slug: 'partner-products' },
  })

  if (!partnerCategory) {
    partnerCategory = await prisma.category.create({
      data: {
        name: 'Partner Products',
        slug: 'partner-products',
        description: 'Products available through 47 Industries partner platforms',
        productType: 'PHYSICAL',
      },
    })
    console.log('Created category: Partner Products')
  }

  // Create Business Cards product
  const businessCardsSlug = 'bookfade-business-cards'
  let businessCards = await prisma.product.findUnique({
    where: { slug: businessCardsSlug },
  })

  if (!businessCards) {
    businessCards = await prisma.product.create({
      data: {
        name: 'BookFade Business Cards',
        slug: businessCardsSlug,
        description: `Professional business cards for barbers featuring your BookFade booking link and QR code.

Cards include:
- Your name and business name
- BookFade booking URL
- Scannable QR code to your booking page
- Phone number (optional)
- Social media handles (optional)
- "Powered by BookFade" branding

Premium 16pt card stock with matte finish. Full color printing on both sides.`,
        shortDesc: 'Custom business cards with your BookFade booking link and QR code',
        price: 29.99, // Base price for 250 cards
        comparePrice: 49.99,
        costPrice: 12.00,
        images: [],
        categoryId: partnerCategory.id,
        stock: 999,
        sku: 'BF-CARDS-250',
        tags: ['bookfade', 'business-cards', 'barber', 'marketing'],
        featured: true,
        active: true,
        productType: 'PHYSICAL',
        requiresShipping: true,
        weight: 0.5, // lbs
      },
    })
    console.log('Created product: BookFade Business Cards')

    // Create variants for different quantities
    const cardVariants = [
      { name: '250 Cards', sku: 'BF-CARDS-250', price: 29.99, stock: 999, options: { Quantity: '250' } },
      { name: '500 Cards', sku: 'BF-CARDS-500', price: 44.99, stock: 999, options: { Quantity: '500' } },
      { name: '1000 Cards', sku: 'BF-CARDS-1000', price: 64.99, stock: 999, options: { Quantity: '1000' } },
    ]

    for (const variant of cardVariants) {
      await prisma.productVariant.create({
        data: {
          productId: businessCards.id,
          name: variant.name,
          sku: variant.sku,
          price: variant.price,
          stock: variant.stock,
          options: variant.options,
          isActive: true,
        },
      })
      console.log(`  Created variant: ${variant.name}`)
    }
  } else {
    console.log('Product already exists: BookFade Business Cards')
  }

  // Create Business Card Holder product (3D printed)
  const cardHolderSlug = 'bookfade-card-holder'
  let cardHolder = await prisma.product.findUnique({
    where: { slug: cardHolderSlug },
  })

  if (!cardHolder) {
    cardHolder = await prisma.product.create({
      data: {
        name: 'BookFade Business Card Holder',
        slug: cardHolderSlug,
        description: `Custom 3D printed business card holder with BookFade branding. Perfect for your barber station or reception desk.

Features:
- Holds standard business cards (3.5" x 2")
- Sleek modern design
- BookFade logo embossed
- Available in multiple colors
- Durable PLA+ material

Made in-house by 47 Industries with premium 3D printing technology.`,
        shortDesc: '3D printed card holder with BookFade branding for your station',
        price: 24.99,
        comparePrice: 34.99,
        costPrice: 5.00,
        images: [],
        categoryId: partnerCategory.id,
        stock: 50,
        sku: 'BF-HOLDER-BLK',
        tags: ['bookfade', 'card-holder', '3d-printed', 'barber', 'desk-accessory'],
        featured: true,
        active: true,
        productType: 'PHYSICAL',
        requiresShipping: true,
        weight: 0.25, // lbs
        // 3D printing specs
        material: 'PLA+',
        printTime: 120, // 2 hours
        layerHeight: 0.2,
        infill: 20,
      },
    })
    console.log('Created product: BookFade Business Card Holder')

    // Create color variants
    const holderVariants = [
      { name: 'Black', sku: 'BF-HOLDER-BLK', price: 24.99, stock: 50, options: { Color: 'Black' } },
      { name: 'White', sku: 'BF-HOLDER-WHT', price: 24.99, stock: 50, options: { Color: 'White' } },
      { name: 'Gold', sku: 'BF-HOLDER-GLD', price: 29.99, stock: 30, options: { Color: 'Gold' } },
    ]

    for (const variant of holderVariants) {
      await prisma.productVariant.create({
        data: {
          productId: cardHolder.id,
          name: variant.name,
          sku: variant.sku,
          price: variant.price,
          stock: variant.stock,
          options: variant.options,
          isActive: true,
        },
      })
      console.log(`  Created variant: ${variant.name}`)
    }
  } else {
    console.log('Product already exists: BookFade Business Card Holder')
  }

  // Create Bundle product
  const bundleSlug = 'bookfade-starter-bundle'
  let bundle = await prisma.product.findUnique({
    where: { slug: bundleSlug },
  })

  if (!bundle) {
    bundle = await prisma.product.create({
      data: {
        name: 'BookFade Starter Bundle',
        slug: bundleSlug,
        description: `Everything you need to promote your BookFade booking page! This bundle includes:

- 500 Custom Business Cards with your booking link & QR code
- 1 Business Card Holder (your choice of color)

Save $10 when you bundle!

Perfect for new barbers just getting started with BookFade or established pros looking to refresh their marketing materials.`,
        shortDesc: '500 business cards + card holder bundle - Save $10!',
        price: 59.99,
        comparePrice: 69.98, // Individual prices combined
        costPrice: 23.00,
        images: [],
        categoryId: partnerCategory.id,
        stock: 30,
        sku: 'BF-BUNDLE-500',
        tags: ['bookfade', 'bundle', 'business-cards', 'card-holder', 'barber', 'value'],
        featured: true,
        active: true,
        productType: 'PHYSICAL',
        requiresShipping: true,
        weight: 0.75, // lbs
      },
    })
    console.log('Created product: BookFade Starter Bundle')

    // Create bundle variants with holder color choice
    const bundleVariants = [
      { name: 'Bundle with Black Holder', sku: 'BF-BUNDLE-BLK', price: 59.99, stock: 30, options: { 'Holder Color': 'Black' } },
      { name: 'Bundle with White Holder', sku: 'BF-BUNDLE-WHT', price: 59.99, stock: 30, options: { 'Holder Color': 'White' } },
      { name: 'Bundle with Gold Holder', sku: 'BF-BUNDLE-GLD', price: 64.99, stock: 20, options: { 'Holder Color': 'Gold' } },
    ]

    for (const variant of bundleVariants) {
      await prisma.productVariant.create({
        data: {
          productId: bundle.id,
          name: variant.name,
          sku: variant.sku,
          price: variant.price,
          stock: variant.stock,
          options: variant.options,
          isActive: true,
        },
      })
      console.log(`  Created variant: ${variant.name}`)
    }
  } else {
    console.log('Product already exists: BookFade Starter Bundle')
  }

  console.log('BookFade products seeding completed!')
}

main()
  .catch((e) => {
    console.error('Error seeding BookFade products:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
