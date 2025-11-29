import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getShippingRates,
  calculatePackageDimensions,
  isShippoConfigured,
  ShippingAddress,
} from '@/lib/shippo'

interface CartItem {
  productId: string
  quantity: number
}

interface ShippingInfo {
  address1: string
  address2?: string
  city: string
  state: string
  zipCode: string
  country: string
}

// POST /api/shipping/rates - Get shipping rates for checkout
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items, shipping } = body as {
      items: CartItem[]
      shipping: ShippingInfo
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      )
    }

    if (!shipping?.address1 || !shipping?.city || !shipping?.state || !shipping?.zipCode) {
      return NextResponse.json(
        { error: 'Incomplete shipping address' },
        { status: 400 }
      )
    }

    // Get products with weight/dimensions
    const productIds = items.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        price: true,
        weight: true,
        dimensions: true,
      },
    })

    // Calculate cart total and total weight
    let cartTotal = 0
    let totalWeightOz = 0
    const itemsWithWeight = items.map(item => {
      const product = products.find(p => p.id === item.productId)
      const price = Number(product?.price) || 0
      const weightLbs = Number(product?.weight) || 0.5 // Default 0.5 lbs
      const weightOz = weightLbs * 16

      cartTotal += price * item.quantity
      totalWeightOz += weightOz * item.quantity

      // Parse dimensions if available (format: "LxWxH")
      let length = 6, width = 4, height = 2
      if (product?.dimensions) {
        const dims = product.dimensions.toLowerCase().split('x').map(d => parseFloat(d.trim()))
        if (dims.length === 3 && dims.every(d => !isNaN(d))) {
          [length, width, height] = dims
        }
      }

      return {
        weight: weightOz,
        length,
        width,
        height,
        quantity: item.quantity,
      }
    })

    // Calculate package dimensions
    const parcel = calculatePackageDimensions(itemsWithWeight)

    // Get business address from settings
    const businessAddressSetting = await prisma.setting.findUnique({
      where: { key: 'business_address' },
    })

    let fromAddress: ShippingAddress
    if (businessAddressSetting?.value) {
      const addr = JSON.parse(businessAddressSetting.value)
      fromAddress = {
        name: addr.name || '47 Industries',
        company: addr.company || '47 Industries',
        street1: addr.address1,
        street2: addr.address2,
        city: addr.city,
        state: addr.state,
        zip: addr.zipCode,
        country: addr.country || 'US',
        phone: addr.phone,
        email: addr.email,
      }
    } else {
      // Default address - you should configure this in settings
      fromAddress = {
        name: '47 Industries',
        company: '47 Industries',
        street1: '123 Main St',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
        country: 'US',
      }
    }

    const toAddress: ShippingAddress = {
      name: 'Customer',
      street1: shipping.address1,
      street2: shipping.address2,
      city: shipping.city,
      state: shipping.state,
      zip: shipping.zipCode,
      country: shipping.country || 'US',
    }

    // Check if Shippo is configured for real rates
    if (isShippoConfigured) {
      try {
        const shipment = await getShippingRates(fromAddress, toAddress, parcel)

        // Transform rates
        const rates = shipment.rates.map(rate => ({
          id: rate.id,
          carrier: rate.carrier,
          service: rate.service,
          serviceName: rate.serviceName,
          price: rate.rate,
          deliveryDays: rate.estDeliveryDays || rate.deliveryDays,
          deliveryDate: rate.deliveryDate,
          isRealTime: true,
        }))

        // Get configured zones/rates as fallback options
        const configuredRates = await getConfiguredRates(shipping, cartTotal, totalWeightOz / 16)

        return NextResponse.json({
          rates,
          configuredRates, // Also return configured rates as options
          shipmentId: shipment.id,
          parcel,
          cartTotal,
          totalWeight: totalWeightOz / 16, // in lbs
        })
      } catch (error) {
        console.error('Shippo error, falling back to configured rates:', error)
        // Fall through to configured rates
      }
    }

    // Use configured shipping rates from database
    const rates = await getConfiguredRates(shipping, cartTotal, totalWeightOz / 16)

    return NextResponse.json({
      rates,
      configuredRates: rates,
      shipmentId: null,
      parcel,
      cartTotal,
      totalWeight: totalWeightOz / 16,
    })
  } catch (error) {
    console.error('Error getting shipping rates:', error)
    return NextResponse.json(
      { error: 'Failed to get shipping rates' },
      { status: 500 }
    )
  }
}

// Get shipping rates from configured zones
async function getConfiguredRates(
  shipping: ShippingInfo,
  cartTotal: number,
  totalWeightLbs: number
) {
  // Find matching zone
  const zones = await prisma.shippingZone.findMany({
    where: { active: true },
    include: {
      rates: {
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { priority: 'desc' },
  })

  // Find best matching zone
  let matchingZone = null
  for (const zone of zones) {
    const countries = zone.countries as string[]
    const states = zone.states as string[] | null

    // Check country match
    const country = shipping.country || 'US'
    if (!countries.includes(country)) continue

    // Check state match if specified
    if (states && states.length > 0) {
      if (!states.includes(shipping.state)) continue
    }

    // Check zip code match if specified
    if (zone.zipCodes) {
      const zipRanges = zone.zipCodes.split(',').map(z => z.trim())
      const customerZip = parseInt(shipping.zipCode)
      let zipMatch = false

      for (const range of zipRanges) {
        if (range.includes('-')) {
          const [start, end] = range.split('-').map(z => parseInt(z))
          if (customerZip >= start && customerZip <= end) {
            zipMatch = true
            break
          }
        } else if (parseInt(range) === customerZip) {
          zipMatch = true
          break
        }
      }

      if (!zipMatch) continue
    }

    matchingZone = zone
    break
  }

  if (!matchingZone || matchingZone.rates.length === 0) {
    // Return a default rate
    return [{
      id: 'default',
      carrier: 'Standard',
      service: 'shipping',
      serviceName: 'Standard Shipping',
      price: cartTotal >= 50 ? 0 : 7.99,
      deliveryDays: 7,
      deliveryDate: null,
      isRealTime: false,
      isFreeShipping: cartTotal >= 50,
    }]
  }

  // Calculate rates
  return matchingZone.rates.map(rate => {
    let price = Number(rate.baseRate)

    // Add per-item cost (estimate based on cart)
    // Note: We'd need item count passed in for accurate per-item calc
    price += Number(rate.perItemRate) || 0

    // Add per-pound cost
    price += (Number(rate.perPoundRate) || 0) * totalWeightLbs

    // Check for free shipping
    const freeShippingMin = Number(rate.freeShippingMin)
    const isFreeShipping = freeShippingMin > 0 && cartTotal >= freeShippingMin

    return {
      id: rate.id,
      carrier: rate.carrier || 'Standard',
      service: rate.serviceCode || 'shipping',
      serviceName: rate.name,
      description: rate.description,
      price: isFreeShipping ? 0 : price,
      originalPrice: price,
      deliveryDays: rate.maxDays,
      minDays: rate.minDays,
      maxDays: rate.maxDays,
      deliveryDate: null,
      isRealTime: false,
      isFreeShipping,
      freeShippingMin: freeShippingMin || null,
    }
  })
}
