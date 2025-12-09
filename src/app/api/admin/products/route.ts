import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/products - List all products
export async function GET(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const productType = searchParams.get('productType') || '' // 'PHYSICAL' | 'DIGITAL' | ''

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { sku: { contains: search } },
      ]
    }

    if (category) {
      where.categoryId = category
    }

    if (status === 'active') {
      where.active = true
    } else if (status === 'inactive') {
      where.active = false
    }

    if (productType) {
      where.productType = productType
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/admin/products - Create a new product
export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Generate slug from name
    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: 'A product with this name already exists' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug,
        description: body.description,
        shortDesc: body.shortDesc || null,
        price: body.price,
        comparePrice: body.comparePrice || null,
        costPrice: body.costPrice || null,
        images: body.images || [],
        categoryId: body.categoryId,
        stock: body.stock || 0,
        sku: body.sku || null,
        weight: body.weight || null,
        dimensions: body.dimensions || null,
        tags: body.tags || null,
        featured: body.featured || false,
        active: body.active !== false,
        // Product type
        productType: body.productType || 'PHYSICAL',
        requiresShipping: body.requiresShipping !== false,
        // 3D printing specs
        material: body.material || null,
        printTime: body.printTime || null,
        layerHeight: body.layerHeight || null,
        infill: body.infill || null,
        // Digital product fields
        digitalFileUrl: body.digitalFileUrl || null,
        digitalFileName: body.digitalFileName || null,
        digitalFileSize: body.digitalFileSize || null,
        downloadLimit: body.downloadLimit || null,
        downloadExpiry: body.downloadExpiry || null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            productType: true,
          },
        },
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
