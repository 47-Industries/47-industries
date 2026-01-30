import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ id: string; itemId: string }>
}

// PUT /api/admin/orders/[id]/items/[itemId] - Update order item (including customization)
export async function PUT(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    const { id, itemId } = await context.params

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the order item belongs to this order
    const existingItem = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
        orderId: id,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Order item not found' }, { status: 404 })
    }

    const body = await req.json()
    const { customization } = body

    // Update the order item
    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        customization: customization || null,
      },
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
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error updating order item:', error)
    return NextResponse.json(
      { error: 'Failed to update order item' },
      { status: 500 }
    )
  }
}

// GET /api/admin/orders/[id]/items/[itemId] - Get single order item
export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    const { id, itemId } = await context.params

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const item = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
        orderId: id,
      },
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
    })

    if (!item) {
      return NextResponse.json({ error: 'Order item not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error fetching order item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order item' },
      { status: 500 }
    )
  }
}
