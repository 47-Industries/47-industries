import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/services/projects/[id] - Get a single project
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

    const project = await prisma.serviceProject.findUnique({
      where: { id },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/services/projects/[id] - Update a project
export async function PATCH(
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

    // Get current project
    const currentProject = await prisma.serviceProject.findUnique({
      where: { id },
    })

    if (!currentProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // If title is changing, generate new slug and check for duplicates
    let slug = currentProject.slug
    if (body.title && body.title !== currentProject.title) {
      slug = body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const existingProject = await prisma.serviceProject.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      })

      if (existingProject) {
        return NextResponse.json(
          { error: 'A project with this title already exists' },
          { status: 400 }
        )
      }
    }

    const project = await prisma.serviceProject.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title, slug }),
        ...(body.category && { category: body.category }),
        ...(body.categories !== undefined && { categories: body.categories }),
        ...(body.clientName && { clientName: body.clientName }),
        ...(body.clientLogo !== undefined && { clientLogo: body.clientLogo || null }),
        ...(body.description && { description: body.description }),
        ...(body.challenge !== undefined && { challenge: body.challenge || null }),
        ...(body.solution !== undefined && { solution: body.solution || null }),
        ...(body.results !== undefined && { results: body.results || null }),
        ...(body.thumbnailUrl !== undefined && { thumbnailUrl: body.thumbnailUrl || null }),
        ...(body.images !== undefined && { images: body.images }),
        ...(body.videoUrl !== undefined && { videoUrl: body.videoUrl || null }),
        ...(body.liveUrl !== undefined && { liveUrl: body.liveUrl || null }),
        ...(body.technologies !== undefined && { technologies: body.technologies }),
        ...(body.testimonial !== undefined && { testimonial: body.testimonial || null }),
        ...(body.testimonialAuthor !== undefined && { testimonialAuthor: body.testimonialAuthor || null }),
        ...(body.testimonialRole !== undefined && { testimonialRole: body.testimonialRole || null }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
        ...(body.showInNavbar !== undefined && { showInNavbar: body.showInNavbar }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/services/projects/[id] - Delete a project
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

    await prisma.serviceProject.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
