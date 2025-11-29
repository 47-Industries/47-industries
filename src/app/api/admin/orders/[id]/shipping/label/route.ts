import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { purchaseLabel, isEasyPostConfigured } from '@/lib/easypost'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/admin/orders/[id]/shipping/label - Purchase a shipping label
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: orderId } = await params
    const body = await req.json()
    const { shipmentId, rateId, fromAddress, toAddress, parcel } = body

    if (!shipmentId || !rateId) {
      return NextResponse.json(
        { error: 'Shipment ID and Rate ID are required' },
        { status: 400 }
      )
    }

    if (!isEasyPostConfigured) {
      return NextResponse.json(
        { error: 'Shipping provider not configured' },
        { status: 400 }
      )
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check for existing label
    const existingLabel = await prisma.shippingLabel.findFirst({
      where: {
        orderId,
        status: { not: 'VOIDED' },
      },
    })

    if (existingLabel) {
      return NextResponse.json(
        { error: 'A shipping label already exists for this order. Void it first to create a new one.' },
        { status: 400 }
      )
    }

    // Purchase label via EasyPost
    const labelResult = await purchaseLabel(shipmentId, rateId)

    // Save label to database
    const shippingLabel = await prisma.shippingLabel.create({
      data: {
        orderId,
        trackingNumber: labelResult.trackingNumber,
        carrier: labelResult.carrier,
        service: labelResult.service,
        labelCost: labelResult.rate,
        insuranceCost: 0,
        totalCost: labelResult.rate,
        weight: parcel?.weight || 0,
        labelUrl: labelResult.labelUrl,
        providerLabelId: labelResult.id,
        providerData: {
          shipmentId: labelResult.shipmentId,
          trackingUrl: labelResult.trackingUrl,
        },
        status: 'PURCHASED',
        fromAddress: fromAddress || {},
        toAddress: toAddress || {},
      },
    })

    // Update order with tracking info
    await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber: labelResult.trackingNumber,
        carrier: labelResult.carrier,
        status: order.status === 'PROCESSING' || order.status === 'PAID' ? 'SHIPPED' : order.status,
      },
    })

    return NextResponse.json({
      success: true,
      label: shippingLabel,
      trackingNumber: labelResult.trackingNumber,
      trackingUrl: labelResult.trackingUrl,
      labelUrl: labelResult.labelUrl,
    })
  } catch (error) {
    console.error('Error purchasing shipping label:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to purchase shipping label' },
      { status: 500 }
    )
  }
}

// GET /api/admin/orders/[id]/shipping/label - Get existing label for order
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: orderId } = await params

    const label = await prisma.shippingLabel.findFirst({
      where: {
        orderId,
        status: { not: 'VOIDED' },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ label })
  } catch (error) {
    console.error('Error fetching shipping label:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shipping label' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/orders/[id]/shipping/label - Void a shipping label
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: orderId } = await params

    const label = await prisma.shippingLabel.findFirst({
      where: {
        orderId,
        status: { not: 'VOIDED' },
      },
    })

    if (!label) {
      return NextResponse.json({ error: 'No active label found' }, { status: 404 })
    }

    // TODO: Call EasyPost to void/refund the label
    // This requires the refundLabel function which depends on the carrier's refund policy

    // Mark label as voided
    await prisma.shippingLabel.update({
      where: { id: label.id },
      data: { status: 'VOIDED' },
    })

    // Clear tracking info from order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber: null,
        carrier: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error voiding shipping label:', error)
    return NextResponse.json(
      { error: 'Failed to void shipping label' },
      { status: 500 }
    )
  }
}
