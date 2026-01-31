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

// Sync a single Printful product to our database
export async function syncSingleProduct(printfulData: PrintfulSyncProductResponse): Promise<void> {
  const { sync_product, sync_variants } = printfulData

  // Find existing product by Printful ID
  let product = await prisma.product.findFirst({
    where: { printfulProductId: String(sync_product.id) },
    include: { variants: true },
  })

  // Get or create an Apparel category for Printful products
  let category = await prisma.category.findFirst({
    where: { slug: 'apparel' },
  })

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Apparel',
        slug: 'apparel',
        description: 'Print-on-demand apparel and merchandise',
        productType: 'PHYSICAL',
        active: true,
      },
    })
  }

  // Calculate base price from variants (lowest price)
  const basePrice = Math.min(
    ...sync_variants.map(v => parseFloat(v.retail_price) || 0)
  )

  // Get first variant image for product thumbnail
  const thumbnailUrl = sync_variants[0]?.files.find(f => f.type === 'preview')?.preview_url
    || sync_variants[0]?.product.image
    || sync_product.thumbnail_url

  if (product) {
    // Update existing product - preserve the slug
    product = await prisma.product.update({
      where: { id: product.id },
      data: {
        name: sync_product.name,
        // Keep existing slug to preserve URLs
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
