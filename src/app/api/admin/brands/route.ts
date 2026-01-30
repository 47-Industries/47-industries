import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/brands - List all brands
export async function GET(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: any = {}
    if (!includeInactive) {
      where.active = true
    }

    const brands = await prisma.brandConfig.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Get product counts for each brand
    const brandKeys = brands.map(b => b.key)
    const productCounts = await prisma.product.groupBy({
      by: ['brand'],
      where: {
        brand: { in: brandKeys as any },
        active: true,
      },
      _count: true,
    })

    const countsMap = productCounts.reduce((acc, item) => {
      if (item.brand) {
        acc[item.brand] = item._count
      }
      return acc
    }, {} as Record<string, number>)

    const brandsWithCounts = brands.map(brand => ({
      ...brand,
      productCount: countsMap[brand.key] || 0,
    }))

    return NextResponse.json({ brands: brandsWithCounts })
  } catch (error) {
    console.error('Error fetching brands:', error)
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 })
  }
}

// POST /api/admin/brands - Create a new brand
export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Generate key from name (uppercase, underscores)
    const key = body.key || body.name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/(^_|_$)/g, '')

    // Generate slug from name
    const slug = body.slug || body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if key or slug already exists
    const existing = await prisma.brandConfig.findFirst({
      where: {
        OR: [
          { key },
          { slug },
        ],
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A brand with this name or slug already exists' },
        { status: 400 }
      )
    }

    const brand = await prisma.brandConfig.create({
      data: {
        key,
        name: body.name,
        slug,
        tagline: body.tagline || null,
        description: body.description || null,
        accentColor: body.accentColor || '#3b82f6',
        logo: body.logo || null,
        projectId: body.projectId || null,
        active: body.active !== false,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json(brand, { status: 201 })
  } catch (error) {
    console.error('Error creating brand:', error)
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 })
  }
}
