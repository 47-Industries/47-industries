import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// API Key validation for external partners
function validateApiKey(request: NextRequest): { valid: boolean; source: string | null } {
  const apiKey = request.headers.get('x-api-key')

  if (apiKey === process.env.BOOKFADE_API_KEY) {
    return { valid: true, source: 'bookfade' }
  }

  return { valid: false, source: null }
}

// GET /api/external/products - Get products available for external partners
export async function GET(request: NextRequest) {
  const auth = validateApiKey(request)
  if (!auth.valid) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') // 'partner-products' for BookFade
  const tag = searchParams.get('tag') // 'bookfade' to filter BookFade products
  const slug = searchParams.get('slug') // Get specific product by slug

  const where: any = {
    active: true,
  }

  // Filter by category slug
  if (category) {
    where.category = {
      slug: category,
    }
  }

  // Filter by tag
  if (tag) {
    where.tags = {
      array_contains: tag,
    }
  }

  // Get specific product
  if (slug) {
    const product = await prisma.product.findUnique({
      where: { slug },
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
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!product || !product.active) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDesc: product.shortDesc,
        price: Number(product.price),
        comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
        images: product.images,
        category: product.category,
        stock: product.stock,
        sku: product.sku,
        tags: product.tags,
        variants: product.variants.map(v => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          price: Number(v.price),
          comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
          stock: v.stock,
          options: v.options,
          image: v.image,
        })),
      },
    })
  }

  // Get list of products
  const products = await prisma.product.findMany({
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
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: [
      { featured: 'desc' },
      { createdAt: 'desc' },
    ],
  })

  return NextResponse.json({
    products: products.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDesc: product.shortDesc,
      price: Number(product.price),
      comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
      images: product.images,
      category: product.category,
      stock: product.stock,
      sku: product.sku,
      tags: product.tags,
      featured: product.featured,
      variants: product.variants.map(v => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: Number(v.price),
        comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
        stock: v.stock,
        options: v.options,
        image: v.image,
      })),
    })),
  })
}
