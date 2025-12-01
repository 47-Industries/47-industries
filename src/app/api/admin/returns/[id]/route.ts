import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/returns/[id] - Get a specific return request
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    try {
      const returnRequest = await prisma.returnRequest.findUnique({
        where: { id },
        include: {
          order: {
            include: {
              user: {
                select: { name: true, email: true },
              },
              items: {
                include: {
                  product: {
                    select: { name: true, images: true },
                  },
                },
              },
            },
          },
        },
      })

      if (!returnRequest) {
        return NextResponse.json({ error: 'Return request not found' }, { status: 404 })
      }

      return NextResponse.json(returnRequest)
    } catch {
      return NextResponse.json({ error: 'Return request model not available' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error fetching return request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch return request' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/returns/[id] - Update a return request
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { status, refundAmount, notes } = body

    try {
      const returnRequest = await prisma.returnRequest.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(refundAmount !== undefined && { refundAmount }),
          ...(notes !== undefined && { notes }),
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

      // If status changed to REFUNDED, we could trigger a refund via Stripe
      // This would be implemented based on actual payment processing needs

      return NextResponse.json(returnRequest)
    } catch {
      return NextResponse.json({ error: 'Return request model not available' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error updating return request:', error)
    return NextResponse.json(
      { error: 'Failed to update return request' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/returns/[id] - Delete a return request
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    try {
      await prisma.returnRequest.delete({
        where: { id },
      })

      return NextResponse.json({ success: true })
    } catch {
      return NextResponse.json({ error: 'Return request model not available' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error deleting return request:', error)
    return NextResponse.json(
      { error: 'Failed to delete return request' },
      { status: 500 }
    )
  }
}
