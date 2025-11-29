import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendShippingNotification } from '@/lib/email'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/admin/orders/[id] - Get single order
export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await context.params

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        shippingAddress: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/orders/[id] - Update order
export async function PUT(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await context.params

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Get previous order state to check if shipping status changed
    const previousOrder = await prisma.order.findUnique({
      where: { id },
      select: { status: true, trackingNumber: true },
    })

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: body.status,
        paymentStatus: body.paymentStatus,
        trackingNumber: body.trackingNumber,
        carrier: body.carrier,
        adminNotes: body.adminNotes,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        shippingAddress: true,
      },
    })

    // Send shipping notification if status changed to SHIPPED and tracking was added
    const isNewlyShipped = body.status === 'SHIPPED' && previousOrder?.status !== 'SHIPPED'
    const hasTracking = body.trackingNumber && body.carrier

    if (isNewlyShipped && hasTracking && order.customerEmail) {
      try {
        await sendShippingNotification({
          to: order.customerEmail,
          name: order.customerName,
          orderNumber: order.orderNumber,
          trackingNumber: body.trackingNumber,
          carrier: body.carrier,
        })
        console.log('Shipping notification sent to:', order.customerEmail)
      } catch (emailError) {
        console.error('Failed to send shipping notification:', emailError)
      }
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}
