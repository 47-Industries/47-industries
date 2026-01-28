import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth-helper'

import { prisma } from '@/lib/prisma'

// GET /api/admin/categories - List all categories
export async function GET(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const productType = searchParams.get('productType') // 'PHYSICAL' | 'DIGITAL' | null (all)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: any = {}
    if (!includeInactive) {
      where.active = true
    }
    if (productType) {
      where.productType = productType
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        productType: true,
        parentId: true,
        active: true,
        _count: {
          select: { products: true }
        }
      },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/admin/categories - Create a new category
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
    const existingCategory = await prisma.category.findUnique({
      where: { slug },
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name: body.name,
        slug,
        description: body.description || null,
        image: body.image || null,
        productType: body.productType || 'PHYSICAL',
        parentId: body.parentId || null,
        active: body.active !== false,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
