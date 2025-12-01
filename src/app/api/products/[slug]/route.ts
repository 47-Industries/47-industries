import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isFeatureEnabled } from '@/lib/features'

// GET /api/products/[slug] - Get single product by slug (public)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Check if shop is enabled
    const shopEnabled = await isFeatureEnabled('shopEnabled')
    if (!shopEnabled) {
      return NextResponse.json(
        { error: 'Shop is currently unavailable' },
        { status: 404 }
      )
    }

    const { slug } = await params

    const product = await prisma.product.findUnique({
      where: {
        slug,
        active: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}
