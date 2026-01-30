import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// API Key validation for external partners
function validateApiKey(request: NextRequest): { valid: boolean; source: string | null } {
  const apiKey = request.headers.get('x-api-key')

  if (apiKey === process.env.BOOKFADE_API_KEY) {
    return { valid: true, source: 'bookfade' }
  }

  return { valid: false, source: null }
}

// GET /api/external/orders/[orderNumber] - Get order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const auth = validateApiKey(request)
  if (!auth.valid) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  const { orderNumber } = await params

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
    },
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Only allow access to orders from the same source
  if (order.source !== auth.source) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      shipping: Number(order.shipping),
      total: Number(order.total),
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      items: order.items.map(item => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        total: Number(item.total),
        image: item.image,
        sku: item.sku,
      })),
      sourceOrderId: order.sourceOrderId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    },
  })
}
