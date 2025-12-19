import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth-helper'

import { prisma } from '@/lib/prisma'

// GET /api/admin/services/projects - List all portfolio projects
export async function GET(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') || ''

    const where: any = {}
    if (category) {
      where.category = category
    }

    const projects = await prisma.serviceProject.findMany({
      where,
      orderBy: [
        { isFeatured: 'desc' },
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching service projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service projects' },
      { status: 500 }
    )
  }
}

// POST /api/admin/services/projects - Create a new portfolio project
export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Generate slug from title
    const slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if slug already exists
    const existingProject = await prisma.serviceProject.findUnique({
      where: { slug },
    })

    if (existingProject) {
      return NextResponse.json(
        { error: 'A project with this title already exists' },
        { status: 400 }
      )
    }

    const serviceProject = await prisma.serviceProject.create({
      data: {
        title: body.title,
        slug,
        category: body.category,
        categories: body.categories || null,
        clientName: body.clientName,
        clientLogo: body.clientLogo || null,
        description: body.description,
        challenge: body.challenge || null,
        solution: body.solution || null,
        results: body.results || null,
        thumbnailUrl: body.thumbnailUrl || null,
        images: body.images || null,
        videoUrl: body.videoUrl || null,
        liveUrl: body.liveUrl || null,
        accentColor: body.accentColor || null,
        technologies: body.technologies || null,
        testimonial: body.testimonial || null,
        testimonialAuthor: body.testimonialAuthor || null,
        testimonialRole: body.testimonialRole || null,
        isFeatured: body.isFeatured || false,
        showInNavbar: body.showInNavbar || false,
        isActive: body.isActive !== false,
        sortOrder: body.sortOrder || 0,
      },
    })

    return NextResponse.json(serviceProject, { status: 201 })
  } catch (error) {
    console.error('Error creating service project:', error)
    return NextResponse.json(
      { error: 'Failed to create service project' },
      { status: 500 }
    )
  }
}
