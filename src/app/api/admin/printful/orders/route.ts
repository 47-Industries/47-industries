import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) {
      where.status = status
    }

    const [orders, total] = await Promise.all([
      prisma.printfulOrder.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              customerName: true,
              customerEmail: true,
              total: true,
              status: true,
              createdAt: true,
              items: {
                where: {
                  product: {
                    fulfillmentType: 'PRINTFUL',
                  },
                },
                select: {
                  id: true,
                  name: true,
                  quantity: true,
                  price: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.printfulOrder.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching Printful orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Printful orders' },
      { status: 500 }
    )
  }
}
