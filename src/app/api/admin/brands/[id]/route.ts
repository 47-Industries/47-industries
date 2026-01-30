import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/brands/[id] - Get a single brand
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const brand = await prisma.brandConfig.findUnique({
      where: { id },
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

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    return NextResponse.json(brand)
  } catch (error) {
    console.error('Error fetching brand:', error)
    return NextResponse.json({ error: 'Failed to fetch brand' }, { status: 500 })
  }
}

// PATCH /api/admin/brands/[id] - Update a brand
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    // Check if brand exists
    const existing = await prisma.brandConfig.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // If slug is being changed, check for conflicts
    if (body.slug && body.slug !== existing.slug) {
      const slugConflict = await prisma.brandConfig.findFirst({
        where: {
          slug: body.slug,
          id: { not: id },
        },
      })

      if (slugConflict) {
        return NextResponse.json(
          { error: 'A brand with this slug already exists' },
          { status: 400 }
        )
      }
    }

    const brand = await prisma.brandConfig.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        slug: body.slug !== undefined ? body.slug : undefined,
        tagline: body.tagline !== undefined ? body.tagline : undefined,
        description: body.description !== undefined ? body.description : undefined,
        accentColor: body.accentColor !== undefined ? body.accentColor : undefined,
        logo: body.logo !== undefined ? body.logo : undefined,
        projectId: body.projectId !== undefined ? body.projectId : undefined,
        active: body.active !== undefined ? body.active : undefined,
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

    return NextResponse.json(brand)
  } catch (error) {
    console.error('Error updating brand:', error)
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 })
  }
}

// DELETE /api/admin/brands/[id] - Delete a brand
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if brand exists
    const existing = await prisma.brandConfig.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Check if brand has products (using the enum key)
    const productCount = await prisma.product.count({
      where: { brand: existing.key as any },
    })

    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete brand with ${productCount} products. Remove products first.` },
        { status: 400 }
      )
    }

    await prisma.brandConfig.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting brand:', error)
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 })
  }
}
