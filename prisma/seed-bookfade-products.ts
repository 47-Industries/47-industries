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
  // PRICING MODEL: First unit includes setup/development fee, additional units are cheaper
  // - BookFade Logo: Ready to print, no slicing needed
  // - Custom Logo (1-2 colors): Requires logo slicing
  // - Custom Logo (Multi-color): Complex slicing, filament changes
  const cardHolderSlug = 'bookfade-card-holder'
  let cardHolder = await prisma.product.findUnique({
    where: { slug: cardHolderSlug },
  })

  if (!cardHolder) {
    cardHolder = await prisma.product.create({
      data: {
        name: 'BookFade Business Card Holder',
        slug: cardHolderSlug,
        description: `Custom 3D printed business card holder for your barber station or reception desk.

CUSTOMIZATION OPTIONS:

BookFade Logo (Fastest)
- Pre-designed with BookFade branding
- Ships in 3-5 business days
- Best value for individual barbers

Custom Logo (1-2 Colors)
- Your shop logo or design
- Requires design setup (included in first unit)
- Additional units ship faster
- Perfect for small teams

Custom Logo (Multi-Color)
- Complex multi-color logo designs
- Premium filament and finish
- Requires extended setup time
- Best for shops wanting premium branding

SPECIFICATIONS:
- Holds standard business cards (3.5" x 2")
- Sleek modern design
- Durable PLA+ material
- Made in-house by 47 Industries

BULK PRICING: First unit includes design setup. Additional units at reduced price!`,
        shortDesc: '3D printed card holder - custom logos available',
        price: 29.99, // Base price shown (BookFade logo first unit)
        comparePrice: 39.99,
        costPrice: 5.00,
        images: [],
        categoryId: partnerCategory.id,
        stock: 999, // Made to order
        sku: 'BF-HOLDER-STD',
        tags: ['bookfade', 'card-holder', '3d-printed', 'barber', 'desk-accessory', 'custom'],
        featured: true,
        active: true,
        productType: 'PHYSICAL',
        requiresShipping: true,
        weight: 0.25, // lbs
        // 3D printing specs
        material: 'PLA+',
        printTime: 120, // 2 hours base
        layerHeight: 0.2,
        infill: 20,
      },
    })
    console.log('Created product: BookFade Business Card Holder')

    // Variants with setup fee pricing model
    // price = first unit (includes setup), additionalPrice = each additional unit
    const holderVariants = [
      // BookFade Logo variants (cheapest - no slicing needed)
      {
        name: 'BookFade Logo - Black',
        sku: 'BF-HOLDER-BF-BLK',
        price: 29.99,
        additionalPrice: 14.99,
        stock: 999,
        options: { 'Logo Type': 'BookFade', Color: 'Black' },
        sortOrder: 1,
      },
      {
        name: 'BookFade Logo - White',
        sku: 'BF-HOLDER-BF-WHT',
        price: 29.99,
        additionalPrice: 14.99,
        stock: 999,
        options: { 'Logo Type': 'BookFade', Color: 'White' },
        sortOrder: 2,
      },
      {
        name: 'BookFade Logo - Gold',
        sku: 'BF-HOLDER-BF-GLD',
        price: 34.99,
        additionalPrice: 17.99,
        stock: 999,
        options: { 'Logo Type': 'BookFade', Color: 'Gold' },
        sortOrder: 3,
      },
      // Custom Logo variants (1-2 colors - requires slicing)
      {
        name: 'Custom Logo (1-2 Colors) - Black',
        sku: 'BF-HOLDER-CUST-BLK',
        price: 49.99,
        additionalPrice: 19.99,
        stock: 999,
        options: { 'Logo Type': 'Custom (1-2 Colors)', Color: 'Black' },
        sortOrder: 4,
      },
      {
        name: 'Custom Logo (1-2 Colors) - White',
        sku: 'BF-HOLDER-CUST-WHT',
        price: 49.99,
        additionalPrice: 19.99,
        stock: 999,
        options: { 'Logo Type': 'Custom (1-2 Colors)', Color: 'White' },
        sortOrder: 5,
      },
      // Multi-color custom (expensive - complex slicing, filament changes)
      {
        name: 'Custom Logo (Multi-Color)',
        sku: 'BF-HOLDER-MULTI',
        price: 79.99,
        additionalPrice: 34.99,
        stock: 999,
        options: { 'Logo Type': 'Custom (Multi-Color)', Color: 'Multi' },
        sortOrder: 6,
      },
    ]

    for (const variant of holderVariants) {
      await prisma.productVariant.create({
        data: {
          productId: cardHolder.id,
          name: variant.name,
          sku: variant.sku,
          price: variant.price,
          additionalPrice: variant.additionalPrice,
          stock: variant.stock,
          options: variant.options,
          sortOrder: variant.sortOrder,
          isActive: true,
        },
      })
      console.log(`  Created variant: ${variant.name} ($${variant.price} first, $${variant.additionalPrice} additional)`)
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
