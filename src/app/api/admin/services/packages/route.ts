import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/services/packages - List all service packages
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') || ''

    const where: any = {}
    if (category) {
      where.category = category
    }

    const packages = await prisma.servicePackage.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        _count: {
          select: { inquiries: true },
        },
      },
    })

    return NextResponse.json({ packages })
  } catch (error) {
    console.error('Error fetching service packages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service packages' },
      { status: 500 }
    )
  }
}

// POST /api/admin/services/packages - Create a new service package
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Generate slug from name
    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if slug already exists
    const existingPackage = await prisma.servicePackage.findUnique({
      where: { slug },
    })

    if (existingPackage) {
      return NextResponse.json(
        { error: 'A package with this name already exists' },
        { status: 400 }
      )
    }

    const servicePackage = await prisma.servicePackage.create({
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

    return NextResponse.json(servicePackage, { status: 201 })
  } catch (error) {
    console.error('Error creating service package:', error)
    return NextResponse.json(
      { error: 'Failed to create service package' },
      { status: 500 }
    )
  }
}
