import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

// GET /api/admin/products/[id]/variants/[variantId] - Get a specific variant
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: productId, variantId } = await params

    const variant = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId,
      },
    })

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    return NextResponse.json({ variant })
  } catch (error) {
    console.error('Error fetching variant:', error)
    return NextResponse.json(
      { error: 'Failed to fetch variant' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/products/[id]/variants/[variantId] - Update a variant
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: productId, variantId } = await params
    const body = await req.json()
    const { options, price, stock, sku, isActive, comparePrice, image } = body

    // Check if variant exists
    const existingVariant = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId,
      },
    })

    if (!existingVariant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    // Check for duplicate variant (same options) if options are being updated
    if (options && Object.keys(options).length > 0) {
      const existingVariants = await prisma.productVariant.findMany({
        where: {
          productId,
          id: { not: variantId },
        },
      })

      const optionString = JSON.stringify(options)
      const duplicate = existingVariants.find(
        v => JSON.stringify(v.options) === optionString
      )

      if (duplicate) {
        return NextResponse.json(
          { error: 'A variant with these options already exists' },
          { status: 400 }
        )
      }
    }

    // Check SKU uniqueness if provided and changed
    if (sku && sku !== existingVariant.sku) {
      const existingSku = await prisma.productVariant.findUnique({
        where: { sku },
      })
      if (existingSku && existingSku.id !== variantId) {
        return NextResponse.json(
          { error: 'A variant with this SKU already exists' },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: any = {}

    if (options !== undefined) {
      updateData.options = options
      // Update name based on new options
      updateData.name = Object.values(options).join(' / ')
    }

    if (price !== undefined) {
      updateData.price = price
    }

    if (stock !== undefined) {
      updateData.stock = stock
    }

    if (sku !== undefined) {
      updateData.sku = sku || null
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    if (comparePrice !== undefined) {
      updateData.comparePrice = comparePrice || null
    }

    if (image !== undefined) {
      updateData.image = image || null
    }

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: updateData,
    })

    return NextResponse.json({ variant })
  } catch (error) {
    console.error('Error updating variant:', error)
    return NextResponse.json(
      { error: 'Failed to update variant' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/products/[id]/variants/[variantId] - Delete a variant
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: productId, variantId } = await params

    // Check if variant exists
    const existingVariant = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId,
      },
    })

    if (!existingVariant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    await prisma.productVariant.delete({
      where: { id: variantId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting variant:', error)
    return NextResponse.json(
      { error: 'Failed to delete variant' },
      { status: 500 }
    )
  }
}
