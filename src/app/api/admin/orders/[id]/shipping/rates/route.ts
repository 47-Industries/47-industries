import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getShippingRates,
  isEasyPostConfigured,
  ShippingAddress,
  calculatePackageDimensions,
} from '@/lib/easypost'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/admin/orders/[id]/shipping/rates - Get shipping rates for an order
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get order with items and shipping address
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                weight: true,
                dimensions: true,
              },
            },
          },
        },
        shippingAddress: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!order.shippingAddress) {
      return NextResponse.json(
        { error: 'Order has no shipping address' },
        { status: 400 }
      )
    }

    if (!isEasyPostConfigured) {
      return NextResponse.json(
        { error: 'Shipping provider not configured. Please add EASYPOST_API_KEY to your environment.' },
        { status: 400 }
      )
    }

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
      return NextResponse.json(
        { error: 'Business address not configured. Please set up your ship-from address in Shipping Settings.' },
        { status: 400 }
      )
    }

    const toAddress: ShippingAddress = {
      name: order.shippingAddress.fullName,
      company: order.shippingAddress.company || undefined,
      street1: order.shippingAddress.address1,
      street2: order.shippingAddress.address2 || undefined,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      zip: order.shippingAddress.zipCode,
      country: order.shippingAddress.country || 'US',
      phone: order.shippingAddress.phone || undefined,
    }

    // Calculate package dimensions from order items
    const itemsWithWeight = order.items.map((item) => {
      const weightLbs = Number(item.product?.weight) || 0.5
      const weightOz = weightLbs * 16

      let length = 6, width = 4, height = 2
      if (item.product?.dimensions) {
        const dims = item.product.dimensions.toLowerCase().split('x').map((d: string) => parseFloat(d.trim()))
        if (dims.length === 3 && dims.every((d: number) => !isNaN(d))) {
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

    // Optionally get custom parcel from request body
    const body = await req.json().catch(() => ({}))
    const parcel = body.parcel || calculatePackageDimensions(itemsWithWeight)

    // Get rates from EasyPost
    const shipment = await getShippingRates(fromAddress, toAddress, parcel)

    return NextResponse.json({
      shipmentId: shipment.id,
      rates: shipment.rates,
      parcel,
      fromAddress,
      toAddress,
    })
  } catch (error) {
    console.error('Error getting shipping rates:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get shipping rates' },
      { status: 500 }
    )
  }
}
