import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/designs/[id] - Get design details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const design = await prisma.customerDesign.findUnique({
      where: { id },
    })

    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 })
    }

    // Get related data
    const [product, variant, order] = await Promise.all([
      prisma.product.findUnique({
        where: { id: design.productId },
        select: { id: true, name: true, slug: true, images: true },
      }),
      design.variantId
        ? prisma.productVariant.findUnique({
            where: { id: design.variantId },
            select: { id: true, name: true, sku: true, options: true },
          })
        : null,
      design.originalOrderId
        ? prisma.order.findUnique({
            where: { id: design.originalOrderId },
            select: { id: true, orderNumber: true, status: true, customerName: true },
          })
        : null,
    ])

    // Get order history for this customer/design
    const relatedOrders = await prisma.order.findMany({
      where: {
        customerEmail: design.customerEmail,
        items: {
          some: {
            productId: design.productId,
          },
        },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        items: {
          where: { productId: design.productId },
          select: {
            quantity: true,
            price: true,
            total: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      design: {
        ...design,
        product,
        variant,
        order,
      },
      relatedOrders,
    })
  } catch (error) {
    console.error('Error fetching design:', error)
    return NextResponse.json({ error: 'Failed to fetch design' }, { status: 500 })
  }
}

// PATCH /api/admin/designs/[id] - Update design
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const {
      status,
      designNotes,
      gcodePath,
      designFile,
      previewImage,
    } = body

    const updateData: any = {}

    if (status) {
      updateData.status = status
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date()
      }
    }

    if (designNotes !== undefined) {
      updateData.designNotes = designNotes
    }

    if (gcodePath !== undefined) {
      updateData.gcodePath = gcodePath
    }

    if (designFile !== undefined) {
      updateData.designFile = designFile
    }

    if (previewImage !== undefined) {
      updateData.previewImage = previewImage
    }

    const design = await prisma.customerDesign.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ design })
  } catch (error) {
    console.error('Error updating design:', error)
    return NextResponse.json({ error: 'Failed to update design' }, { status: 500 })
  }
}

// DELETE /api/admin/designs/[id] - Archive design
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Archive instead of delete
    const design = await prisma.customerDesign.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })

    return NextResponse.json({ design })
  } catch (error) {
    console.error('Error archiving design:', error)
    return NextResponse.json({ error: 'Failed to archive design' }, { status: 500 })
  }
}
