import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/returns - List all return requests
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    let returns: any[] = []

    try {
      const where: any = {}
      if (status && status !== 'all') {
        where.status = status
      }

      returns = await prisma.returnRequest.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              user: {
                select: { name: true, email: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch {
      // Model might not exist yet - return empty array
    }

    return NextResponse.json({ returns })
  } catch (error) {
    console.error('Error fetching returns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch returns' },
      { status: 500 }
    )
  }
}

// POST /api/admin/returns - Create a new return request (admin-initiated)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { orderId, items, reason, notes } = body

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    try {
      const returnRequest = await prisma.returnRequest.create({
        data: {
          orderId,
          items: items || [],
          reason: reason || 'OTHER',
          status: 'PENDING',
          notes: notes || null,
        },
        include: {
          order: {
            select: {
              id: true,
              user: {
                select: { name: true, email: true },
              },
            },
          },
        },
      })

      return NextResponse.json(returnRequest, { status: 201 })
    } catch {
      return NextResponse.json(
        { error: 'Return request model not available' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error creating return request:', error)
    return NextResponse.json(
      { error: 'Failed to create return request' },
      { status: 500 }
    )
  }
}
