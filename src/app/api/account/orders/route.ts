import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/account/orders - Get customer's orders
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { customerEmail: session.user.email || '' },
        ],
      },
      include: {
        items: {
          select: {
            name: true,
            quantity: true,
            price: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        total: Number(order.total),
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        trackingNumber: order.trackingNumber,
        carrier: order.carrier,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price),
          image: item.image,
        })),
      })),
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
