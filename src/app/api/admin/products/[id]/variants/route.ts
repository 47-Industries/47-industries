import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/products/[id]/variants - Get variants for a product
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

    const variants = await prisma.productVariant.findMany({
      where: { productId: id },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ variants })
  } catch (error) {
    console.error('Error fetching variants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch variants' },
      { status: 500 }
    )
  }
}

// POST /api/admin/products/[id]/variants - Create a new variant
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: productId } = await params
    const body = await req.json()
    const { options, price, stock, sku, comparePrice, image } = body

    if (!options || Object.keys(options).length === 0) {
      return NextResponse.json(
        { error: 'At least one option is required' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check for duplicate variant (same options)
    const existingVariants = await prisma.productVariant.findMany({
      where: { productId },
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

    // Generate variant name from options
    const name = Object.values(options).join(' / ')

    // Get max sort order
    const maxOrder = await prisma.productVariant.aggregate({
      where: { productId },
      _max: { sortOrder: true },
    })

    // Check SKU uniqueness if provided
    if (sku) {
      const existingSku = await prisma.productVariant.findUnique({
        where: { sku },
      })
      if (existingSku) {
        return NextResponse.json(
          { error: 'A variant with this SKU already exists' },
          { status: 400 }
        )
      }
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        name,
        options,
        price: price || product.price,
        comparePrice: comparePrice || null,
        stock: stock || 0,
        sku: sku || null,
        image: image || null,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      },
    })

    return NextResponse.json(variant, { status: 201 })
  } catch (error) {
    console.error('Error creating variant:', error)
    return NextResponse.json(
      { error: 'Failed to create variant' },
      { status: 500 }
    )
  }
}
