import EasyPost from '@easypost/api'

// Initialize EasyPost client
const apiKey = process.env.EASYPOST_API_KEY

export const easypost = apiKey ? new EasyPost(apiKey) : null
export const isEasyPostConfigured = !!apiKey

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
  if (!easypost) {
    throw new Error('EasyPost not configured')
  }

  try {
    const verifiedAddress = await easypost.Address.createAndVerify({
      name: address.name,
      company: address.company,
      street1: address.street1,
      street2: address.street2,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      phone: address.phone,
      email: address.email,
    })

    return {
      valid: true,
      verified: {
        name: verifiedAddress.name || address.name,
        company: verifiedAddress.company || undefined,
        street1: verifiedAddress.street1 || address.street1,
        street2: verifiedAddress.street2 || undefined,
        city: verifiedAddress.city || address.city,
        state: verifiedAddress.state || address.state,
        zip: verifiedAddress.zip || address.zip,
        country: verifiedAddress.country || address.country,
        phone: verifiedAddress.phone || undefined,
        email: verifiedAddress.email || undefined,
      },
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
  if (!easypost) {
    throw new Error('EasyPost not configured')
  }

  try {
    const shipment = await easypost.Shipment.create({
      from_address: {
        name: fromAddress.name,
        company: fromAddress.company,
        street1: fromAddress.street1,
        street2: fromAddress.street2,
        city: fromAddress.city,
        state: fromAddress.state,
        zip: fromAddress.zip,
        country: fromAddress.country,
        phone: fromAddress.phone,
        email: fromAddress.email,
      },
      to_address: {
        name: toAddress.name,
        company: toAddress.company,
        street1: toAddress.street1,
        street2: toAddress.street2,
        city: toAddress.city,
        state: toAddress.state,
        zip: toAddress.zip,
        country: toAddress.country,
        phone: toAddress.phone,
        email: toAddress.email,
      },
      parcel: {
        length: parcel.length,
        width: parcel.width,
        height: parcel.height,
        weight: parcel.weight,
      },
    })

    // Transform rates to our format
    const rates: ShippingRateResult[] = (shipment.rates || []).map((rate: any) => ({
      id: rate.id,
      carrier: rate.carrier,
      service: rate.service,
      serviceName: getServiceName(rate.carrier, rate.service),
      rate: parseFloat(rate.rate),
      currency: rate.currency,
      deliveryDays: rate.delivery_days,
      deliveryDate: rate.delivery_date,
      deliveryDateGuaranteed: rate.delivery_date_guaranteed || false,
      estDeliveryDays: rate.est_delivery_days || rate.delivery_days,
    }))

    // Sort by price
    rates.sort((a, b) => a.rate - b.rate)

    return {
      id: shipment.id,
      rates,
      fromAddress: shipment.from_address,
      toAddress: shipment.to_address,
      parcel: shipment.parcel,
    }
  } catch (error: any) {
    console.error('EasyPost getShippingRates error:', error)
    throw new Error(error.message || 'Failed to get shipping rates')
  }
}

/**
 * Purchase a shipping label
 */
export async function purchaseLabel(
  shipmentId: string,
  rateId: string
): Promise<LabelResult> {
  if (!easypost) {
    throw new Error('EasyPost not configured')
  }

  try {
    // Retrieve the shipment
    const shipment = await easypost.Shipment.retrieve(shipmentId)

    // Buy the label with the selected rate
    const purchasedShipment = await easypost.Shipment.buy(shipmentId, rateId)

    return {
      id: purchasedShipment.id,
      trackingNumber: purchasedShipment.tracking_code,
      trackingUrl: purchasedShipment.tracker?.public_url || `https://track.easypost.com/${purchasedShipment.tracking_code}`,
      labelUrl: purchasedShipment.postage_label?.label_url,
      carrier: purchasedShipment.selected_rate?.carrier,
      service: purchasedShipment.selected_rate?.service,
      rate: parseFloat(purchasedShipment.selected_rate?.rate || '0'),
      shipmentId: purchasedShipment.id,
    }
  } catch (error: any) {
    console.error('EasyPost purchaseLabel error:', error)
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
  if (!easypost) {
    throw new Error('EasyPost not configured')
  }

  try {
    const shipment = await easypost.Shipment.create({
      from_address: {
        name: fromAddress.name,
        company: fromAddress.company,
        street1: fromAddress.street1,
        street2: fromAddress.street2,
        city: fromAddress.city,
        state: fromAddress.state,
        zip: fromAddress.zip,
        country: fromAddress.country,
        phone: fromAddress.phone,
        email: fromAddress.email,
      },
      to_address: {
        name: toAddress.name,
        company: toAddress.company,
        street1: toAddress.street1,
        street2: toAddress.street2,
        city: toAddress.city,
        state: toAddress.state,
        zip: toAddress.zip,
        country: toAddress.country,
        phone: toAddress.phone,
        email: toAddress.email,
      },
      parcel: {
        length: parcel.length,
        width: parcel.width,
        height: parcel.height,
        weight: parcel.weight,
      },
    })

    // Find the matching rate
    const rate = shipment.rates?.find(
      (r: any) => r.carrier === carrier && r.service === service
    )

    if (!rate) {
      // Find lowest rate for carrier
      const carrierRates = shipment.rates?.filter((r: any) => r.carrier === carrier)
      if (carrierRates && carrierRates.length > 0) {
        const lowestRate = carrierRates.reduce((min: any, r: any) =>
          parseFloat(r.rate) < parseFloat(min.rate) ? r : min
        )
        return purchaseLabel(shipment.id, lowestRate.id)
      }
      throw new Error(`No rate found for ${carrier} ${service}`)
    }

    return purchaseLabel(shipment.id, rate.id)
  } catch (error: any) {
    console.error('EasyPost createAndPurchaseLabel error:', error)
    throw new Error(error.message || 'Failed to create and purchase label')
  }
}

/**
 * Refund/void a shipping label
 */
export async function refundLabel(shipmentId: string): Promise<{ status: string; message: string }> {
  if (!easypost) {
    throw new Error('EasyPost not configured')
  }

  try {
    const refund = await easypost.Shipment.refund(shipmentId)

    return {
      status: refund.refund_status || 'submitted',
      message: 'Refund request submitted',
    }
  } catch (error: any) {
    console.error('EasyPost refundLabel error:', error)
    throw new Error(error.message || 'Failed to refund label')
  }
}

/**
 * Get tracking info for a shipment
 */
export async function getTracking(trackingCode: string, carrier: string): Promise<any> {
  if (!easypost) {
    throw new Error('EasyPost not configured')
  }

  try {
    const tracker = await easypost.Tracker.create({
      tracking_code: trackingCode,
      carrier: carrier,
    })

    return {
      status: tracker.status,
      statusDetail: tracker.status_detail,
      estDeliveryDate: tracker.est_delivery_date,
      trackingDetails: tracker.tracking_details,
      publicUrl: tracker.public_url,
    }
  } catch (error: any) {
    console.error('EasyPost getTracking error:', error)
    throw new Error(error.message || 'Failed to get tracking info')
  }
}

/**
 * Get friendly service name
 */
function getServiceName(carrier: string, service: string): string {
  const serviceNames: Record<string, Record<string, string>> = {
    USPS: {
      First: 'USPS First Class',
      Priority: 'USPS Priority Mail',
      Express: 'USPS Priority Mail Express',
      ParcelSelect: 'USPS Parcel Select Ground',
      MediaMail: 'USPS Media Mail',
      GroundAdvantage: 'USPS Ground Advantage',
    },
    UPS: {
      Ground: 'UPS Ground',
      '3DaySelect': 'UPS 3 Day Select',
      '2ndDayAir': 'UPS 2nd Day Air',
      NextDayAir: 'UPS Next Day Air',
      NextDayAirSaver: 'UPS Next Day Air Saver',
    },
    FedEx: {
      FEDEX_GROUND: 'FedEx Ground',
      FEDEX_HOME_DELIVERY: 'FedEx Home Delivery',
      FEDEX_2_DAY: 'FedEx 2Day',
      FEDEX_EXPRESS_SAVER: 'FedEx Express Saver',
      STANDARD_OVERNIGHT: 'FedEx Standard Overnight',
      PRIORITY_OVERNIGHT: 'FedEx Priority Overnight',
    },
  }

  return serviceNames[carrier]?.[service] || `${carrier} ${service}`
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
