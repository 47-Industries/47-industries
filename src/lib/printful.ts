// Printful API Integration
// Documentation: https://developers.printful.com/docs/

import { prisma } from './prisma'
import crypto from 'crypto'

const PRINTFUL_API_URL = 'https://api.printful.com'

// Cached store ID
let cachedStoreId: string | null = null

// Check if Printful is configured
export function isPrintfulConfigured(): boolean {
  return !!process.env.PRINTFUL_API_KEY
}

// Get the store ID (fetches from API if not cached)
async function getStoreId(): Promise<string> {
  if (cachedStoreId) {
    return cachedStoreId
  }

  // If store ID is configured in env, use it
  if (process.env.PRINTFUL_STORE_ID) {
    cachedStoreId = process.env.PRINTFUL_STORE_ID
    return cachedStoreId
  }

  // Otherwise, fetch stores from the API
  const response = await fetch(`${PRINTFUL_API_URL}/stores`, {
    headers: {
      'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
      'Content-Type': 'application/json',
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || data.message || 'Failed to fetch stores')
  }

  const stores = data.result
  if (!stores || stores.length === 0) {
    throw new Error('No Printful stores found for this account')
  }

  // Look for a Manual Order / API store (type is usually null or "manual" for API stores)
  // Platform stores have types like "shopify", "etsy", "woocommerce", etc.
  const platformTypes = ['shopify', 'etsy', 'woocommerce', 'bigcommerce', 'squarespace', 'wix', 'amazon', 'ebay']
  const apiStore = stores.find((s: any) => !s.type || s.type === 'manual' || !platformTypes.includes(s.type?.toLowerCase()))

  if (apiStore) {
    cachedStoreId = String(apiStore.id)
    return cachedStoreId
  }

  // If no API store found, throw helpful error
  const storeTypes = stores.map((s: any) => s.type || 'unknown').join(', ')
  throw new Error(`No Manual Order/API store found. Your stores are: ${storeTypes}. Create a "Manual order platform / API" store in Printful to use this integration.`)
}

// Make authenticated request to Printful API
async function printfulRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!isPrintfulConfigured()) {
    throw new Error('Printful API key not configured')
  }

  const storeId = await getStoreId()

  const response = await fetch(`${PRINTFUL_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
      'X-PF-Store-Id': storeId,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || data.message || 'Printful API error')
  }

  return data.result
}

// ============================================
// PRODUCT SYNC
// ============================================

interface PrintfulProduct {
  id: number
  external_id: string
  name: string
  variants: number
  synced: number
  thumbnail_url: string
  is_ignored: boolean
}

interface PrintfulSyncProduct {
  id: number
  external_id: string
  name: string
  variants: number
  synced: number
  thumbnail_url: string
  is_ignored: boolean
}

interface PrintfulSyncVariant {
  id: number
  external_id: string
  sync_product_id: number
  name: string
  synced: boolean
  variant_id: number
  main_category_id: number
  warehouse_product_variant_id: number | null
  retail_price: string
  sku: string
  currency: string
  product: {
    variant_id: number
    product_id: number
    image: string
    name: string
  }
  files: Array<{
    type: string
    id: number
    url: string
    options: any[]
    hash: string
    filename: string
    mime_type: string
    size: number
    width: number
    height: number
    dpi: number
    status: string
    created: number
    thumbnail_url: string
    preview_url: string
    visible: boolean
  }>
  options: any[]
  is_ignored: boolean
}

interface PrintfulSyncProductResponse {
  sync_product: PrintfulSyncProduct
  sync_variants: PrintfulSyncVariant[]
}

// Get all sync products from Printful store (handles pagination)
export async function getPrintfulProducts(): Promise<PrintfulProduct[]> {
  const allProducts: PrintfulProduct[] = []
  const limit = 100 // Max per page
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const response = await printfulRequest<PrintfulProduct[]>(
      `/store/products?limit=${limit}&offset=${offset}`
    )

    if (response && response.length > 0) {
      allProducts.push(...response)
      offset += response.length
      // If we got fewer than the limit, we've reached the end
      hasMore = response.length === limit
    } else {
      hasMore = false
    }
  }

  return allProducts
}

// Get single sync product with variants
export async function getPrintfulProduct(productId: string | number): Promise<PrintfulSyncProductResponse> {
  return printfulRequest<PrintfulSyncProductResponse>(`/store/products/${productId}`)
}

// Sync all products from Printful to our database
export async function syncPrintfulProducts(): Promise<{
  synced: number
  errors: string[]
}> {
  const errors: string[] = []
  let synced = 0

  try {
    const products = await getPrintfulProducts()

    for (const product of products) {
      if (product.is_ignored) continue

      try {
        const fullProduct = await getPrintfulProduct(product.id)
        await syncSingleProduct(fullProduct)
        synced++
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Failed to sync product ${product.name}: ${message}`)
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    errors.push(`Failed to fetch products: ${message}`)
  }

  return { synced, errors }
}

// Sync ONLY new products from Printful (doesn't update existing, marks deleted)
export async function syncNewPrintfulProducts(): Promise<{
  added: number
  deleted: number
  errors: string[]
}> {
  const errors: string[] = []
  let added = 0
  let deleted = 0

  try {
    const printfulProducts = await getPrintfulProducts()

    // Get all existing Printful product IDs from our database
    const existingProducts = await prisma.product.findMany({
      where: { fulfillmentType: 'PRINTFUL' },
      select: { id: true, printfulProductId: true, active: true },
    })

    const existingPrintfulIds = new Set(
      existingProducts.map(p => p.printfulProductId).filter(Boolean)
    )

    // Get all current Printful product IDs
    const currentPrintfulIds = new Set(
      printfulProducts.filter(p => !p.is_ignored).map(p => String(p.id))
    )

    // Find products that exist in our DB but not in Printful anymore (deleted)
    for (const existing of existingProducts) {
      if (existing.printfulProductId && !currentPrintfulIds.has(existing.printfulProductId)) {
        // Mark as deleted (inactive) rather than actually deleting
        if (existing.active) {
          await prisma.product.update({
            where: { id: existing.id },
            data: { active: false },
          })
          deleted++
        }
      }
    }

    // Only sync products that don't exist in our database
    for (const product of printfulProducts) {
      if (product.is_ignored) continue

      // Skip if we already have this product
      if (existingPrintfulIds.has(String(product.id))) {
        continue
      }

      try {
        const fullProduct = await getPrintfulProduct(product.id)
        await syncSingleProduct(fullProduct)
        added++
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Failed to sync product ${product.name}: ${message}`)
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    errors.push(`Failed to fetch products: ${message}`)
  }

  return { added, deleted, errors }
}

// Sync a single Printful product to our database
export async function syncSingleProduct(printfulData: PrintfulSyncProductResponse): Promise<void> {
  const { sync_product, sync_variants } = printfulData

  // Find existing product by Printful ID
  let product = await prisma.product.findFirst({
    where: { printfulProductId: String(sync_product.id) },
    include: { variants: true },
  })

  // Detect category from product name (T-Shirts, Hoodies, Hats, etc.)
  const detectedCategory = detectApparelCategory(sync_product.name)
  const category = await getOrCreateApparelCategory(detectedCategory)

  // Calculate base price from variants (lowest price)
  const basePrice = Math.min(
    ...sync_variants.map(v => parseFloat(v.retail_price) || 0)
  )

  // Get first variant image for product thumbnail
  const thumbnailUrl = sync_variants[0]?.files.find(f => f.type === 'preview')?.preview_url
    || sync_variants[0]?.product.image
    || sync_product.thumbnail_url

  // Extract brand, gender, and manufacturer from product name
  const brand = extractBrand(sync_product.name)
  const gender = extractGender(sync_product.name, detectedCategory.slug)
  const manufacturer = extractManufacturer(sync_product.name)

  if (product) {
    // Update existing product - preserve the slug AND custom descriptions
    // Only update description if it's still the default generic one
    const isGenericDescription = product.description?.includes('Premium print-on-demand apparel') ||
                                  !product.description ||
                                  product.description.trim() === ''

    product = await prisma.product.update({
      where: { id: product.id },
      data: {
        name: sync_product.name,
        // Keep existing slug to preserve URLs
        // Keep existing custom description if it's been customized
        ...(isGenericDescription && {
          description: `${sync_product.name} - Premium print-on-demand apparel`,
        }),
        price: basePrice,
        images: thumbnailUrl ? [thumbnailUrl] : [],
        categoryId: category.id,
        stock: 999,
        productType: 'PHYSICAL' as const,
        fulfillmentType: 'PRINTFUL' as const,
        printfulProductId: String(sync_product.id),
        printfulSyncedAt: new Date(),
        active: !sync_product.is_ignored,
        requiresShipping: true,
        brand: brand,
        gender: gender,
        manufacturer: manufacturer,
      },
      include: { variants: true },
    })
  } else {
    // Create new product with unique slug
    product = await prisma.product.create({
      data: {
        name: sync_product.name,
        slug: generateSlug(sync_product.name),
        description: `${sync_product.name} - Premium print-on-demand apparel`,
        price: basePrice,
        images: thumbnailUrl ? [thumbnailUrl] : [],
        categoryId: category.id,
        stock: 999,
        productType: 'PHYSICAL' as const,
        fulfillmentType: 'PRINTFUL' as const,
        printfulProductId: String(sync_product.id),
        printfulSyncedAt: new Date(),
        active: !sync_product.is_ignored,
        requiresShipping: true,
        brand: brand,
        gender: gender,
        manufacturer: manufacturer,
      },
      include: { variants: true },
    })
  }

  // Sync variants
  for (const syncVariant of sync_variants) {
    if (syncVariant.is_ignored) continue

    const variantImage = syncVariant.files.find(f => f.type === 'preview')?.preview_url
      || syncVariant.product.image

    const existingVariant = product.variants.find(
      v => v.printfulVariantId === String(syncVariant.id)
    )

    const variantData = {
      productId: product.id,
      name: syncVariant.name,
      sku: syncVariant.sku || null,
      price: parseFloat(syncVariant.retail_price) || basePrice,
      stock: 999,
      options: { variant: syncVariant.name },
      image: variantImage || null,
      printfulVariantId: String(syncVariant.id),
      isActive: !syncVariant.is_ignored,
    }

    if (existingVariant) {
      await prisma.productVariant.update({
        where: { id: existingVariant.id },
        data: variantData,
      })
    } else {
      await prisma.productVariant.create({
        data: variantData,
      })
    }
  }
}

// Generate URL-safe slug from product name
function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return `printful-${baseSlug}-${Date.now().toString(36)}`
}

// Extract brand from product name
function extractBrand(name: string): 'FORTY_SEVEN_INDUSTRIES' | 'BOOKFADE' | 'MOTOREV' | null {
  const nameLower = name.toLowerCase()

  if (nameLower.includes('bookfade') || nameLower.includes('book fade')) {
    return 'BOOKFADE'
  }
  if (nameLower.includes('motorev') || nameLower.includes('moto rev')) {
    return 'MOTOREV'
  }
  // Check for 47 Industries variants - be more inclusive
  if (nameLower.includes('47 industries') || nameLower.includes('47industries') ||
      nameLower.startsWith('47 |') || nameLower.startsWith('47|') ||
      nameLower.startsWith('47 ') || nameLower.includes('| 47') ||
      nameLower.includes('forty seven') || nameLower.includes('fortyseven') ||
      nameLower.includes('mindset')) {  // MINDSET is a 47 Industries line
    return 'FORTY_SEVEN_INDUSTRIES'
  }

  // Default to 47 Industries for now since that's the main brand
  return 'FORTY_SEVEN_INDUSTRIES'
}

// Extract gender from product name and product type
function extractGender(name: string, categorySlug?: string): 'UNISEX' | 'MENS' | 'WOMENS' {
  const nameLower = name.toLowerCase()

  // Explicitly women's products
  const womensKeywords = [
    "women's", 'womens', 'ladies', 'female', 'girlfriend', 'girl',
    'bikini', 'bra', 'bralette', 'legging', 'yoga pant', 'sports bra',
    'crop top', 'halter', 'sundress', 'dress', 'skirt', 'romper',
    'one-piece', 'one piece', 'tankini', 'sarong'
  ]
  for (const keyword of womensKeywords) {
    if (nameLower.includes(keyword)) {
      return 'WOMENS'
    }
  }

  // Explicitly men's products
  const mensKeywords = [
    "men's", 'mens', 'male', ' men ', 'boyfriend',
    'swim trunk', 'trunks', 'boxer', 'briefs',
    'athletic short', 'board short', 'cargo short',
    'muscle shirt', 'muscle tee', 'tank top'
  ]
  for (const keyword of mensKeywords) {
    if (nameLower.includes(keyword)) {
      return 'MENS'
    }
  }

  // Product types that are truly unisex
  // Phone cases, stickers, hats, bags, drinkware
  if (categorySlug === 'phone-cases' || categorySlug === 'accessories' ||
      categorySlug === 'hats-caps' || categorySlug === 'bags' ||
      categorySlug === 'drinkware') {
    return 'UNISEX'
  }

  // T-shirts, hoodies, joggers default to unisex
  return 'UNISEX'
}

// Extract manufacturer/blank brand from product name
function extractManufacturer(name: string): string | null {
  const nameLower = name.toLowerCase()

  const manufacturers = [
    { pattern: 'champion', name: 'Champion' },
    { pattern: 'hanes', name: 'Hanes' },
    { pattern: 'gildan', name: 'Gildan' },
    { pattern: 'bella canvas', name: 'Bella+Canvas' },
    { pattern: 'bella+canvas', name: 'Bella+Canvas' },
    { pattern: 'next level', name: 'Next Level' },
    { pattern: 'comfort colors', name: 'Comfort Colors' },
    { pattern: 'american apparel', name: 'American Apparel' },
    { pattern: 'district', name: 'District' },
    { pattern: 'port authority', name: 'Port Authority' },
    { pattern: 'sport-tek', name: 'Sport-Tek' },
    { pattern: 'new era', name: 'New Era' },
    { pattern: 'yupoong', name: 'Yupoong' },
    { pattern: 'flexfit', name: 'Flexfit' },
    { pattern: 'richardson', name: 'Richardson' },
    { pattern: 'carhartt', name: 'Carhartt' },
    { pattern: 'nike', name: 'Nike' },
    { pattern: 'adidas', name: 'Adidas' },
    { pattern: 'under armour', name: 'Under Armour' },
    { pattern: 'stanley', name: 'Stanley' },
    { pattern: 'otterbox', name: 'OtterBox' },
  ]

  for (const mfr of manufacturers) {
    if (nameLower.includes(mfr.pattern)) {
      return mfr.name
    }
  }

  return null
}

// Detect apparel category from product name
interface ApparelCategory {
  slug: string
  name: string
  keywords: string[]
}

const APPAREL_CATEGORIES: ApparelCategory[] = [
  { slug: 't-shirts', name: 'T-Shirts & Tees', keywords: ['tee', 't-shirt', 'tshirt', 'shirt', 'polo'] },
  { slug: 'hoodies-sweatshirts', name: 'Hoodies & Sweatshirts', keywords: ['hoodie', 'sweatshirt', 'pullover', 'crewneck', 'crew neck'] },
  { slug: 'jackets', name: 'Jackets & Outerwear', keywords: ['jacket', 'coat', 'windbreaker', 'bomber', 'varsity'] },
  { slug: 'joggers-pants', name: 'Joggers & Pants', keywords: ['jogger', 'pant', 'sweatpant', 'legging'] },
  { slug: 'shorts', name: 'Shorts', keywords: ['shorts', 'short', 'trunk', 'athletic short', 'board short'] },
  { slug: 'swimwear', name: 'Swimwear', keywords: ['bikini', 'swimsuit', 'swim trunk', 'one-piece', 'tankini', 'bathing'] },
  { slug: 'hats-caps', name: 'Hats & Caps', keywords: ['hat', 'cap', 'beanie', 'trucker', 'snapback', 'fitted', 'visor'] },
  { slug: 'phone-cases', name: 'Phone Cases', keywords: ['case', 'iphone', 'phone', 'samsung', 'galaxy', 'pixel'] },
  { slug: 'bags', name: 'Bags & Totes', keywords: ['bag', 'tote', 'backpack', 'duffel', 'pouch', 'fanny'] },
  { slug: 'accessories', name: 'Accessories', keywords: ['sticker', 'patch', 'pin', 'keychain', 'lanyard', 'wristband', 'socks', 'mask'] },
  { slug: 'drinkware', name: 'Drinkware', keywords: ['mug', 'tumbler', 'bottle', 'cup', 'glass', 'can cooler', 'koozie'] },
]

function detectApparelCategory(name: string): ApparelCategory {
  const nameLower = name.toLowerCase()

  for (const category of APPAREL_CATEGORIES) {
    for (const keyword of category.keywords) {
      if (nameLower.includes(keyword)) {
        return category
      }
    }
  }

  // Default to accessories if we can't detect
  return { slug: 'accessories', name: 'Accessories', keywords: [] }
}

// Get or create apparel category
async function getOrCreateApparelCategory(categoryInfo: ApparelCategory): Promise<{ id: string }> {
  let category = await prisma.category.findFirst({
    where: { slug: categoryInfo.slug },
  })

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: categoryInfo.name,
        slug: categoryInfo.slug,
        description: `${categoryInfo.name} - Print-on-demand apparel`,
        productType: 'PHYSICAL',
        active: true,
      },
    })
  }

  return { id: category.id }
}

// ============================================
// ORDER SUBMISSION
// ============================================

interface PrintfulRecipient {
  name: string
  address1: string
  address2?: string
  city: string
  state_code: string
  country_code: string
  zip: string
  phone?: string
  email?: string
}

interface PrintfulOrderItem {
  sync_variant_id: number
  quantity: number
  retail_price?: string
}

interface PrintfulOrderResponse {
  id: number
  external_id: string
  store: number
  status: string
  shipping: string
  shipping_service_name: string
  created: number
  updated: number
  recipient: PrintfulRecipient
  items: any[]
  costs: {
    currency: string
    subtotal: string
    discount: string
    shipping: string
    digitization: string
    additional_fee: string
    fulfillment_fee: string
    retail_delivery_fee: string
    tax: string
    vat: string
    total: string
  }
  retail_costs: {
    currency: string
    subtotal: string
    discount: string
    shipping: string
    tax: string
    vat: string
    total: string
  }
  shipments: any[]
  gift: any
  packing_slip: any
}

// Submit an order to Printful
export async function submitOrderToPrintful(orderId: string): Promise<PrintfulOrderResponse> {
  // Get the order with items
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: { variants: true }
          }
        }
      },
      shippingAddress: true,
    },
  })

  if (!order) {
    throw new Error('Order not found')
  }

  // Filter to only Printful items
  const printfulItems = order.items.filter(
    item => item.product.fulfillmentType === 'PRINTFUL'
  )

  if (printfulItems.length === 0) {
    throw new Error('No Printful items in order')
  }

  // Build recipient from order shipping address
  const address = order.shippingAddress
  if (!address) {
    throw new Error('No shipping address for order')
  }

  const recipient: PrintfulRecipient = {
    name: address.fullName,
    address1: address.address1,
    address2: address.address2 || undefined,
    city: address.city,
    state_code: address.state,
    country_code: address.country,
    zip: address.zipCode,
    phone: address.phone || undefined,
    email: order.customerEmail,
  }

  // Build order items
  const items: PrintfulOrderItem[] = []

  for (const item of printfulItems) {
    // Find the variant's Printful variant ID
    let printfulVariantId: number | null = null

    if (item.variantId) {
      const variant = item.product.variants.find(v => v.id === item.variantId)
      if (variant?.printfulVariantId) {
        printfulVariantId = parseInt(variant.printfulVariantId)
      }
    }

    // If no variant, try to use the product's first variant
    if (!printfulVariantId && item.product.variants.length > 0) {
      const firstVariant = item.product.variants[0]
      if (firstVariant.printfulVariantId) {
        printfulVariantId = parseInt(firstVariant.printfulVariantId)
      }
    }

    if (!printfulVariantId) {
      throw new Error(`No Printful variant ID for product ${item.name}`)
    }

    items.push({
      sync_variant_id: printfulVariantId,
      quantity: item.quantity,
      retail_price: Number(item.price).toFixed(2),
    })
  }

  // Create Printful order
  const printfulOrder = await printfulRequest<PrintfulOrderResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      external_id: order.orderNumber,
      recipient,
      items,
      confirm: true, // Auto-confirm for immediate fulfillment
    }),
  })

  // Create PrintfulOrder record
  await prisma.printfulOrder.create({
    data: {
      orderId: order.id,
      printfulOrderId: String(printfulOrder.id),
      status: 'SUBMITTED',
      printfulCost: parseFloat(printfulOrder.costs.total) || null,
    },
  })

  return printfulOrder
}

// Retry a failed Printful order
export async function retryPrintfulOrder(printfulOrderId: string): Promise<PrintfulOrderResponse> {
  const printfulOrder = await prisma.printfulOrder.findUnique({
    where: { id: printfulOrderId },
    include: { order: true },
  })

  if (!printfulOrder) {
    throw new Error('Printful order not found')
  }

  if (printfulOrder.status !== 'FAILED') {
    throw new Error('Can only retry failed orders')
  }

  // Increment retry count
  await prisma.printfulOrder.update({
    where: { id: printfulOrderId },
    data: {
      retryCount: { increment: 1 },
      status: 'PENDING',
      errorMessage: null,
    },
  })

  try {
    const result = await submitOrderToPrintful(printfulOrder.orderId)
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    await prisma.printfulOrder.update({
      where: { id: printfulOrderId },
      data: {
        status: 'FAILED',
        errorMessage: message,
      },
    })
    throw error
  }
}

// ============================================
// SHIPPING RATES
// ============================================

interface PrintfulShippingRate {
  id: string
  name: string
  rate: string
  currency: string
  minDeliveryDays: number
  maxDeliveryDays: number
  minDeliveryDate: string
  maxDeliveryDate: string
}

interface ShippingRateItem {
  variant_id?: string
  external_variant_id?: string
  quantity: number
}

// Get shipping rates from Printful
export async function getPrintfulShippingRates(
  items: ShippingRateItem[],
  address: {
    address1: string
    city: string
    state_code: string
    country_code: string
    zip: string
  }
): Promise<PrintfulShippingRate[]> {
  const result = await printfulRequest<PrintfulShippingRate[]>('/shipping/rates', {
    method: 'POST',
    body: JSON.stringify({
      recipient: address,
      items,
    }),
  })

  return result
}

// ============================================
// WEBHOOKS
// ============================================

// Verify Printful webhook signature
export function verifyPrintfulWebhook(body: string, signature: string): boolean {
  const webhookSecret = process.env.PRINTFUL_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.warn('PRINTFUL_WEBHOOK_SECRET not configured')
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

// Process Printful webhook event
export async function processPrintfulWebhook(event: {
  type: string
  data: any
}): Promise<void> {
  const { type, data } = event

  switch (type) {
    case 'package_shipped':
      await handlePackageShipped(data)
      break

    case 'order_updated':
      await handleOrderUpdated(data)
      break

    case 'order_failed':
      await handleOrderFailed(data)
      break

    default:
      console.log(`Unhandled Printful webhook type: ${type}`)
  }
}

// Handle package shipped event
async function handlePackageShipped(data: {
  order: { id: number; external_id: string }
  shipment: {
    id: number
    carrier: string
    service: string
    tracking_number: string
    tracking_url: string
    ship_date: string
    shipped_at: number
  }
}): Promise<void> {
  const { order, shipment } = data

  // Find PrintfulOrder by Printful order ID
  const printfulOrder = await prisma.printfulOrder.findUnique({
    where: { printfulOrderId: String(order.id) },
  })

  if (!printfulOrder) {
    console.error(`PrintfulOrder not found for Printful ID ${order.id}`)
    return
  }

  // Update PrintfulOrder with tracking info
  await prisma.printfulOrder.update({
    where: { id: printfulOrder.id },
    data: {
      status: 'SHIPPED',
      trackingNumber: shipment.tracking_number,
      trackingUrl: shipment.tracking_url,
      carrier: shipment.carrier,
      shipDate: new Date(shipment.shipped_at * 1000),
    },
  })

  // Update parent Order status and tracking
  await prisma.order.update({
    where: { id: printfulOrder.orderId },
    data: {
      status: 'SHIPPED',
      trackingNumber: shipment.tracking_number,
      carrier: shipment.carrier,
    },
  })
}

// Handle order updated event
async function handleOrderUpdated(data: {
  order: {
    id: number
    external_id: string
    status: string
  }
}): Promise<void> {
  const { order } = data

  const printfulOrder = await prisma.printfulOrder.findUnique({
    where: { printfulOrderId: String(order.id) },
  })

  if (!printfulOrder) {
    console.error(`PrintfulOrder not found for Printful ID ${order.id}`)
    return
  }

  // Map Printful status to our status
  const statusMap: Record<string, string> = {
    draft: 'PENDING',
    pending: 'SUBMITTED',
    failed: 'FAILED',
    canceled: 'FAILED',
    onhold: 'SUBMITTED',
    inprocess: 'PROCESSING',
    partial: 'PROCESSING',
    fulfilled: 'SHIPPED',
  }

  const newStatus = statusMap[order.status.toLowerCase()] || 'PROCESSING'

  await prisma.printfulOrder.update({
    where: { id: printfulOrder.id },
    data: { status: newStatus },
  })
}

// Handle order failed event
async function handleOrderFailed(data: {
  order: {
    id: number
    external_id: string
  }
  reason: string
}): Promise<void> {
  const { order, reason } = data

  const printfulOrder = await prisma.printfulOrder.findUnique({
    where: { printfulOrderId: String(order.id) },
  })

  if (!printfulOrder) {
    console.error(`PrintfulOrder not found for Printful ID ${order.id}`)
    return
  }

  await prisma.printfulOrder.update({
    where: { id: printfulOrder.id },
    data: {
      status: 'FAILED',
      errorMessage: reason,
    },
  })
}

// ============================================
// STATUS CHECK
// ============================================

export async function getPrintfulStatus(): Promise<{
  connected: boolean
  storeName?: string
  storeType?: string
  error?: string
  stores?: Array<{ id: number; name: string; type: string | null }>
}> {
  if (!isPrintfulConfigured()) {
    return { connected: false, error: 'API key not configured' }
  }

  try {
    // Fetch stores directly without the store ID header
    const response = await fetch(`${PRINTFUL_API_URL}/stores`, {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to connect')
    }

    const stores = data.result
    if (!stores || stores.length === 0) {
      return { connected: false, error: 'No stores found' }
    }

    // Look for a Manual Order / API store
    const platformTypes = ['shopify', 'etsy', 'woocommerce', 'bigcommerce', 'squarespace', 'wix', 'amazon', 'ebay']
    const apiStore = stores.find((s: any) => !s.type || s.type === 'manual' || !platformTypes.includes(s.type?.toLowerCase()))

    if (apiStore) {
      // Cache the store ID for future requests
      cachedStoreId = String(apiStore.id)
      return {
        connected: true,
        storeName: apiStore.name,
        storeType: apiStore.type || 'API',
        stores: stores.map((s: any) => ({ id: s.id, name: s.name, type: s.type })),
      }
    }

    // No API store found
    return {
      connected: false,
      error: 'No Manual Order/API store found. Create one in Printful to use this integration.',
      stores: stores.map((s: any) => ({ id: s.id, name: s.name, type: s.type })),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { connected: false, error: message }
  }
}
