import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBrandBySlug, BRAND_SLUG_MAP } from '@/config/brands'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brand: string }> }
) {
  try {
    const { brand: brandSlug } = await params
    const brand = getBrandBySlug(brandSlug)

    if (!brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      )
    }

    // Map slug to Prisma enum value
    const brandKey = BRAND_SLUG_MAP[brandSlug.toLowerCase()]

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where = {
      brand: brandKey as any,
      active: true,
      productType: 'PHYSICAL' as const,
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
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
              image: true,
              options: true,
            },
            orderBy: { sortOrder: 'asc' },
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

    // Transform products for response
    const transformedProducts = products.map(p => ({
      ...p,
      price: Number(p.price),
      comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
      images: p.images as string[],
      variants: p.variants.map(v => ({
        ...v,
        price: Number(v.price),
      })),
    }))

    return NextResponse.json({
      brand,
      products: transformedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching brand products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
