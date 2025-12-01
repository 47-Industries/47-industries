import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/services/packages/[id] - Get a single package
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const servicePackage = await prisma.servicePackage.findUnique({
      where: { id },
      include: {
        _count: {
          select: { inquiries: true },
        },
      },
    })

    if (!servicePackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    return NextResponse.json(servicePackage)
  } catch (error) {
    console.error('Error fetching service package:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service package' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/services/packages/[id] - Update a package
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    // Check if package exists
    const existingPackage = await prisma.servicePackage.findUnique({
      where: { id },
    })

    if (!existingPackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    // If name changed, update slug
    let slug = existingPackage.slug
    if (body.name && body.name !== existingPackage.name) {
      slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // Check if new slug is taken
      const slugTaken = await prisma.servicePackage.findFirst({
        where: { slug, id: { not: id } },
      })

      if (slugTaken) {
        return NextResponse.json(
          { error: 'A package with this name already exists' },
          { status: 400 }
        )
      }
    }

    const servicePackage = await prisma.servicePackage.update({
      where: { id },
      data: {
        name: body.name,
        slug,
        category: body.category,
        // Pricing
        price: body.price || null,
        priceDisplay: body.priceDisplay || null,
        billingType: body.billingType || 'one_time',
        priceNote: body.priceNote || null,
        // Description
        shortDesc: body.shortDesc,
        description: body.description,
        features: body.features || [],
        includes: body.includes || null,
        // Technical Details
        platforms: body.platforms || null,
        techStack: body.techStack || null,
        integrations: body.integrations || null,
        deliverables: body.deliverables || null,
        // Support
        supportIncluded: body.supportIncluded || null,
        revisionRounds: body.revisionRounds || null,
        // Display
        isPopular: body.isPopular || false,
        isActive: body.isActive !== false,
        sortOrder: body.sortOrder || 0,
        badge: body.badge || null,
        // Timing
        estimatedDays: body.estimatedDays || null,
        estimatedWeeks: body.estimatedWeeks || null,
      },
    })

    return NextResponse.json(servicePackage)
  } catch (error) {
    console.error('Error updating service package:', error)
    return NextResponse.json(
      { error: 'Failed to update service package' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/services/packages/[id] - Delete a package
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if package exists
    const existingPackage = await prisma.servicePackage.findUnique({
      where: { id },
      include: {
        _count: {
          select: { inquiries: true },
        },
      },
    })

    if (!existingPackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    // Warn if there are inquiries
    if (existingPackage._count.inquiries > 0) {
      return NextResponse.json(
        { error: `Cannot delete package with ${existingPackage._count.inquiries} inquiry(ies). Please reassign or delete them first.` },
        { status: 400 }
      )
    }

    await prisma.servicePackage.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting service package:', error)
    return NextResponse.json(
      { error: 'Failed to delete service package' },
      { status: 500 }
    )
  }
}
