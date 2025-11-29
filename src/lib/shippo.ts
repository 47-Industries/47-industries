import { Shippo } from 'shippo'

// Initialize Shippo client
const apiKey = process.env.SHIPPO_API_KEY

export const shippo = apiKey ? new Shippo({ apiKeyHeader: apiKey }) : null
export const isShippoConfigured = !!apiKey

// Address interface
export interface ShippingAddress {
  name: string
  company?: string
  street1: string
  street2?: string
  city: string
  state: string
  zip: string
  country: string
  phone?: string
  email?: string
}

// Package dimensions
export interface PackageDimensions {
  length: number // inches
  width: number  // inches
  height: number // inches
  weight: number // ounces
}

// Shipping rate from API
export interface ShippingRateResult {
  id: string
  carrier: string
  service: string
  serviceName: string
  rate: number
  currency: string
  deliveryDays: number | null
  deliveryDate: string | null
  deliveryDateGuaranteed: boolean
  estDeliveryDays?: number
}

// Shipment result
export interface ShipmentResult {
  id: string
  rates: ShippingRateResult[]
  fromAddress: any
  toAddress: any
  parcel: any
}

// Label result
export interface LabelResult {
  id: string
  trackingNumber: string
  trackingUrl: string
  labelUrl: string
  carrier: string
  service: string
  rate: number
  shipmentId: string
}

/**
 * Verify and format an address
 */
export async function verifyAddress(address: ShippingAddress): Promise<{
  valid: boolean
  verified?: ShippingAddress
  messages?: string[]
}> {
  if (!shippo) {
    throw new Error('Shippo not configured')
  }

  try {
    const result = await shippo.addresses.create({
      name: address.name,
      company: address.company || '',
      street1: address.street1,
      street2: address.street2 || '',
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      phone: address.phone || '',
      email: address.email || '',
      validate: true,
    })

    const isValid = result.validationResults?.isValid ?? false

    if (isValid) {
      return {
        valid: true,
        verified: {
          name: result.name || address.name,
          company: result.company || undefined,
          street1: result.street1 || address.street1,
          street2: result.street2 || undefined,
          city: result.city || address.city,
          state: result.state || address.state,
          zip: result.zip || address.zip,
          country: result.country || address.country,
          phone: result.phone || undefined,
          email: result.email || undefined,
        },
      }
    } else {
      const messages = result.validationResults?.messages?.map(
        (m: any) => m.text || m.message || 'Validation error'
      ) || ['Address validation failed']
      return {
        valid: false,
        messages,
      }
    }
  } catch (error: any) {
    return {
      valid: false,
      messages: error.message ? [error.message] : ['Address verification failed'],
    }
  }
}

/**
 * Get shipping rates for a package
 */
export async function getShippingRates(
  fromAddress: ShippingAddress,
  toAddress: ShippingAddress,
  parcel: PackageDimensions
): Promise<ShipmentResult> {
  if (!shippo) {
    throw new Error('Shippo not configured')
  }

  try {
    // Create shipment with inline addresses and parcel
    const shipment = await shippo.shipments.create({
      addressFrom: {
        name: fromAddress.name,
        company: fromAddress.company || '',
        street1: fromAddress.street1,
        street2: fromAddress.street2 || '',
        city: fromAddress.city,
        state: fromAddress.state,
        zip: fromAddress.zip,
        country: fromAddress.country,
        phone: fromAddress.phone || '',
        email: fromAddress.email || '',
      },
      addressTo: {
        name: toAddress.name,
        company: toAddress.company || '',
        street1: toAddress.street1,
        street2: toAddress.street2 || '',
        city: toAddress.city,
        state: toAddress.state,
        zip: toAddress.zip,
        country: toAddress.country,
        phone: toAddress.phone || '',
        email: toAddress.email || '',
      },
      parcels: [{
        length: parcel.length.toString(),
        width: parcel.width.toString(),
        height: parcel.height.toString(),
        distanceUnit: 'in',
        weight: (parcel.weight / 16).toFixed(2), // Convert oz to lbs
        massUnit: 'lb',
      }],
      async: false, // Wait for rates
    })

    // Transform rates to our format
    const rates: ShippingRateResult[] = (shipment.rates || []).map((rate: any) => ({
      id: rate.objectId,
      carrier: rate.provider,
      service: rate.servicelevel?.token || rate.servicelevel?.name || 'Standard',
      serviceName: getServiceName(rate.provider, rate.servicelevel?.name || rate.servicelevel?.token),
      rate: parseFloat(rate.amount),
      currency: rate.currency,
      deliveryDays: rate.estimatedDays || null,
      deliveryDate: rate.arrivesBy || null,
      deliveryDateGuaranteed: false,
      estDeliveryDays: rate.estimatedDays || null,
    }))

    // Sort by price
    rates.sort((a, b) => a.rate - b.rate)

    return {
      id: shipment.objectId || '',
      rates,
      fromAddress: shipment.addressFrom,
      toAddress: shipment.addressTo,
      parcel: shipment.parcels?.[0],
    }
  } catch (error: any) {
    console.error('Shippo getShippingRates error:', error)
    throw new Error(error.message || 'Failed to get shipping rates')
  }
}

/**
 * Purchase a shipping label
 */
export async function purchaseLabel(
  rateId: string
): Promise<LabelResult> {
  if (!shippo) {
    throw new Error('Shippo not configured')
  }

  try {
    // Create transaction (purchase label) with the selected rate
    const transaction = await shippo.transactions.create({
      rate: rateId,
      labelFileType: 'PDF',
      async: false,
    })

    if (transaction.status !== 'SUCCESS') {
      const messages = (transaction as any).messages
      throw new Error(Array.isArray(messages) ? messages.join(', ') : 'Failed to purchase label')
    }

    return {
      id: transaction.objectId || '',
      trackingNumber: transaction.trackingNumber || '',
      trackingUrl: transaction.trackingUrlProvider || '',
      labelUrl: transaction.labelUrl || '',
      carrier: (transaction as any).rate?.provider || '',
      service: (transaction as any).rate?.servicelevel?.token || '',
      rate: parseFloat((transaction as any).rate?.amount || '0'),
      shipmentId: (transaction as any).rate?.shipment || '',
    }
  } catch (error: any) {
    console.error('Shippo purchaseLabel error:', error)
    throw new Error(error.message || 'Failed to purchase label')
  }
}

/**
 * Create a new shipment and purchase label in one step
 */
export async function createAndPurchaseLabel(
  fromAddress: ShippingAddress,
  toAddress: ShippingAddress,
  parcel: PackageDimensions,
  carrier: string,
  service: string
): Promise<LabelResult> {
  if (!shippo) {
    throw new Error('Shippo not configured')
  }

  try {
    // First get rates
    const shipmentResult = await getShippingRates(fromAddress, toAddress, parcel)

    // Find the matching rate
    let rate = shipmentResult.rates.find(
      (r) => r.carrier.toLowerCase() === carrier.toLowerCase() &&
             r.service.toLowerCase() === service.toLowerCase()
    )

    if (!rate) {
      // Find lowest rate for carrier
      const carrierRates = shipmentResult.rates.filter(
        (r) => r.carrier.toLowerCase() === carrier.toLowerCase()
      )
      if (carrierRates.length > 0) {
        rate = carrierRates.reduce((min, r) => r.rate < min.rate ? r : min)
      }
    }

    if (!rate) {
      throw new Error(`No rate found for ${carrier} ${service}`)
    }

    return purchaseLabel(rate.id)
  } catch (error: any) {
    console.error('Shippo createAndPurchaseLabel error:', error)
    throw new Error(error.message || 'Failed to create and purchase label')
  }
}

/**
 * Refund/void a shipping label
 */
export async function refundLabel(transactionId: string): Promise<{ status: string; message: string }> {
  if (!shippo) {
    throw new Error('Shippo not configured')
  }

  try {
    const refund = await shippo.refunds.create({
      transaction: transactionId,
      async: false,
    })

    return {
      status: refund.status || 'submitted',
      message: refund.status === 'SUCCESS' ? 'Refund processed' : 'Refund request submitted',
    }
  } catch (error: any) {
    console.error('Shippo refundLabel error:', error)
    throw new Error(error.message || 'Failed to refund label')
  }
}

/**
 * Get tracking info for a shipment
 */
export async function getTracking(trackingNumber: string, carrier: string): Promise<any> {
  if (!shippo) {
    throw new Error('Shippo not configured')
  }

  try {
    const tracking = await shippo.trackingStatus.get(carrier, trackingNumber)

    return {
      status: tracking.trackingStatus?.status,
      statusDetail: tracking.trackingStatus?.statusDetails,
      estDeliveryDate: tracking.eta,
      trackingDetails: tracking.trackingHistory,
      publicUrl: (tracking as any).trackingUrlProvider || null,
    }
  } catch (error: any) {
    console.error('Shippo getTracking error:', error)
    throw new Error(error.message || 'Failed to get tracking info')
  }
}

/**
 * Get friendly service name
 */
function getServiceName(carrier: string, service: string): string {
  const carrierLower = (carrier || '').toLowerCase()
  const serviceLower = (service || '').toLowerCase()

  const serviceNames: Record<string, Record<string, string>> = {
    usps: {
      usps_first: 'USPS First Class',
      usps_priority: 'USPS Priority Mail',
      usps_priority_express: 'USPS Priority Mail Express',
      usps_parcel_select: 'USPS Parcel Select Ground',
      usps_media_mail: 'USPS Media Mail',
      usps_ground_advantage: 'USPS Ground Advantage',
      'priority mail': 'USPS Priority Mail',
      'first class': 'USPS First Class',
      'ground advantage': 'USPS Ground Advantage',
      priority: 'USPS Priority Mail',
      first: 'USPS First Class',
    },
    ups: {
      ups_ground: 'UPS Ground',
      ups_3_day_select: 'UPS 3 Day Select',
      ups_second_day_air: 'UPS 2nd Day Air',
      ups_next_day_air: 'UPS Next Day Air',
      ups_next_day_air_saver: 'UPS Next Day Air Saver',
      ground: 'UPS Ground',
      '3 day select': 'UPS 3 Day Select',
      '2nd day air': 'UPS 2nd Day Air',
    },
    fedex: {
      fedex_ground: 'FedEx Ground',
      fedex_home_delivery: 'FedEx Home Delivery',
      fedex_2_day: 'FedEx 2Day',
      fedex_express_saver: 'FedEx Express Saver',
      fedex_standard_overnight: 'FedEx Standard Overnight',
      fedex_priority_overnight: 'FedEx Priority Overnight',
      ground: 'FedEx Ground',
      'home delivery': 'FedEx Home Delivery',
      '2day': 'FedEx 2Day',
    },
  }

  return serviceNames[carrierLower]?.[serviceLower] ||
         serviceNames[carrierLower]?.[service] ||
         `${carrier} ${service}`
}

/**
 * Calculate total weight from items
 */
export function calculateTotalWeight(items: { weight: number; quantity: number }[]): number {
  return items.reduce((total, item) => total + (item.weight * item.quantity), 0)
}

/**
 * Calculate package dimensions from items (simple box packing)
 */
export function calculatePackageDimensions(
  items: { length?: number; width?: number; height?: number; weight: number; quantity: number }[]
): PackageDimensions {
  // Default package dimensions if not specified
  const DEFAULT_LENGTH = 10
  const DEFAULT_WIDTH = 8
  const DEFAULT_HEIGHT = 4

  let totalWeight = 0
  let maxLength = 0
  let maxWidth = 0
  let totalHeight = 0

  items.forEach((item) => {
    const qty = item.quantity
    totalWeight += (item.weight || 8) * qty // Default 8oz per item

    const itemLength = item.length || DEFAULT_LENGTH
    const itemWidth = item.width || DEFAULT_WIDTH
    const itemHeight = item.height || DEFAULT_HEIGHT

    maxLength = Math.max(maxLength, itemLength)
    maxWidth = Math.max(maxWidth, itemWidth)
    totalHeight += itemHeight * qty
  })

  // Cap height at reasonable max and use larger box if needed
  if (totalHeight > 20) {
    // Need bigger box, estimate
    maxLength = Math.max(maxLength, 12)
    maxWidth = Math.max(maxWidth, 12)
    totalHeight = Math.min(totalHeight, 20)
  }

  return {
    length: Math.max(maxLength, 6), // Minimum 6 inches
    width: Math.max(maxWidth, 4),   // Minimum 4 inches
    height: Math.max(totalHeight, 2), // Minimum 2 inches
    weight: Math.max(totalWeight, 4), // Minimum 4 oz
  }
}
