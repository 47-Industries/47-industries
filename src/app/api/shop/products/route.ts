import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PRODUCTS_PER_PAGE = 20

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = PRODUCTS_PER_PAGE
    const skip = (page - 1) * limit
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const where: any = {
      active: true,
    }

    // Filter by type
    if (type === 'digital') {
      where.productType = 'DIGITAL'
    } else if (type === 'apparel') {
      where.productType = 'PHYSICAL'
      where.fulfillmentType = 'PRINTFUL'
    } else {
      // Default: physical products (excluding Printful/apparel)
      where.productType = 'PHYSICAL'
      where.OR = [
        { fulfillmentType: 'SELF_FULFILLED' },
        { fulfillmentType: null },
      ]
    }

    if (category) {
      where.category = { slug: category }
    }

    if (search) {
      // Use AND to combine with existing OR clause for fulfillment type
      where.AND = [
        {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ]
        }
      ]
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
              productType: true,
            },
          },
        },
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    // Serialize products
    const serializedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
      images: p.images as string[],
      stock: p.stock,
      featured: p.featured,
      shortDesc: p.shortDesc,
      digitalFileName: (p as any).digitalFileName || null,
      category: p.category,
    }))

    return NextResponse.json({
      products: serializedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
