import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isFeatureEnabled } from '@/lib/features'

// GET /api/products - List active products (public)
export async function GET(req: NextRequest) {
  try {
    // Check if shop is enabled
    const shopEnabled = await isFeatureEnabled('shopEnabled')
    if (!shopEnabled) {
      return NextResponse.json(
        { error: 'Shop is currently unavailable' },
        { status: 404 }
      )
    }
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category') || ''
    const featured = searchParams.get('featured') === 'true'

    const skip = (page - 1) * limit

    const where: any = {
      active: true,
    }

    if (category) {
      where.category = { slug: category }
    }

    if (featured) {
      where.featured = true
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
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' },
        ],
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
