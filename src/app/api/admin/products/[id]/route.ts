import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth-helper'

import { prisma } from '@/lib/prisma'

// GET /api/admin/products/[id] - Get a single product
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            productType: true,
          },
        },
        variants: true,
        project: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // If product has a linked product, fetch its basic info
    let linkedProduct = null
    if (product.linkedProductId) {
      linkedProduct = await prisma.product.findUnique({
        where: { id: product.linkedProductId },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          productType: true,
        },
      })
    }

    return NextResponse.json({
      product: {
        ...product,
        linkedProduct,
      },
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/products/[id] - Update a product
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Generate slug from name if name changed
    let slug = existingProduct.slug
    if (body.name && body.name !== existingProduct.name) {
      slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // Check if new slug already exists
      const slugExists = await prisma.product.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      })

      if (slugExists) {
        return NextResponse.json(
          { error: 'A product with this name already exists' },
          { status: 400 }
        )
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        slug,
        description: body.description,
        shortDesc: body.shortDesc || null,
        price: body.price,
        comparePrice: body.comparePrice || null,
        costPrice: body.costPrice || null,
        images: body.images,
        categoryId: body.categoryId,
        stock: body.stock,
        sku: body.sku || null,
        weight: body.weight || null,
        dimensions: body.dimensions || null,
        tags: body.tags || null,
        featured: body.featured || false,
        active: body.active,
        material: body.material || null,
        printTime: body.printTime || null,
        layerHeight: body.layerHeight || null,
        infill: body.infill || null,
        // Print on Demand fields
        brand: body.brand || null,
        fulfillmentType: body.fulfillmentType || 'SELF_FULFILLED',
        projectId: body.projectId || null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/products/[id] - Delete a product
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if product is in any orders
    const orderItemsCount = await prisma.orderItem.count({
      where: { productId: id },
    })

    if (orderItemsCount > 0) {
      // Don't delete, just deactivate
      await prisma.product.update({
        where: { id },
        data: { active: false },
      })

      return NextResponse.json({
        message: 'Product deactivated (cannot delete products with orders)',
      })
    }

    // Safe to delete
    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
