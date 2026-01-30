import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/designs - List customer designs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (source && source !== 'all') {
      where.source = source === '47industries' ? null : source
    }

    if (search) {
      where.OR = [
        { customerEmail: { contains: search } },
        { designName: { contains: search } },
        { sourceCustomerId: { contains: search } },
      ]
    }

    const [designs, total] = await Promise.all([
      prisma.customerDesign.findMany({
        where,
        include: {
          // Note: We'd need to add relations to the schema, for now we'll query separately
        },
        orderBy: [
          { status: 'asc' }, // PENDING first
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.customerDesign.count({ where }),
    ])

    // Fetch related product info
    const productIds = [...new Set(designs.map(d => d.productId))]
    const variantIds = [...new Set(designs.filter(d => d.variantId).map(d => d.variantId!))]
    const orderIds = [...new Set(designs.filter(d => d.originalOrderId).map(d => d.originalOrderId!))]

    const [products, variants, orders] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, slug: true },
      }),
      variantIds.length > 0
        ? prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            select: { id: true, name: true, sku: true },
          })
        : [],
      orderIds.length > 0
        ? prisma.order.findMany({
            where: { id: { in: orderIds } },
            select: { id: true, orderNumber: true },
          })
        : [],
    ])

    // Map related data to designs
    const enrichedDesigns = designs.map(design => ({
      ...design,
      product: products.find(p => p.id === design.productId),
      variant: variants.find(v => v.id === design.variantId),
      order: orders.find(o => o.id === design.originalOrderId),
    }))

    return NextResponse.json({
      designs: enrichedDesigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching designs:', error)
    return NextResponse.json({ error: 'Failed to fetch designs' }, { status: 500 })
  }
}
