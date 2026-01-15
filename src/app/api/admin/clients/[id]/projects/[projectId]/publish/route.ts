import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Map ClientProject type to ServiceProject category
function mapTypeToCategory(type: string): string {
  const mapping: Record<string, string> = {
    'WEB_DEVELOPMENT': 'WEB_DEVELOPMENT',
    'APP_DEVELOPMENT': 'APP_DEVELOPMENT',
    'AI_SOLUTIONS': 'AI_SOLUTIONS',
    'CUSTOM_3D_PRINTING': 'CUSTOM_PRINTING',
    'BRANDING': 'WEB_DEVELOPMENT', // fallback
  }
  return mapping[type] || 'WEB_DEVELOPMENT'
}

// Generate a URL-friendly slug from a name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// POST /api/admin/clients/[id]/projects/[projectId]/publish
// Publish a client project to the public portfolio
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, projectId } = await params

    // Find the client project
    const clientProject = await prisma.clientProject.findUnique({
      where: { id: projectId },
      include: {
        client: true,
      },
    })

    if (!clientProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (clientProject.clientId !== id) {
      return NextResponse.json({ error: 'Project does not belong to this client' }, { status: 400 })
    }

    if (clientProject.serviceProjectId) {
      return NextResponse.json({ error: 'Project is already published to portfolio' }, { status: 400 })
    }

    // Generate unique slug
    let baseSlug = generateSlug(clientProject.name)
    let slug = baseSlug
    let counter = 1

    while (await prisma.serviceProject.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create the ServiceProject (portfolio entry)
    const serviceProject = await prisma.serviceProject.create({
      data: {
        title: clientProject.name,
        slug,
        category: mapTypeToCategory(clientProject.type) as any,
        clientId: id,
        clientProjectId: projectId,
        clientName: clientProject.client.name,
        description: clientProject.description || `${clientProject.name} - a project by 47 Industries for ${clientProject.client.name}.`,
        liveUrl: clientProject.productionUrl,
        isFeatured: false,
        isActive: true,
        sortOrder: 0,
      },
    })

    // Update the ClientProject with the link
    await prisma.clientProject.update({
      where: { id: projectId },
      data: {
        serviceProjectId: serviceProject.id,
        publishedAt: new Date(),
      },
    })

    // Log activity
    await prisma.clientActivity.create({
      data: {
        clientId: id,
        type: 'PROJECT_PUBLISHED',
        description: `Project "${clientProject.name}" published to public portfolio`,
        metadata: {
          projectId,
          serviceProjectId: serviceProject.id,
          slug,
          publishedBy: session.user.email,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Project published to portfolio',
      serviceProject: {
        id: serviceProject.id,
        slug: serviceProject.slug,
        url: `/projects/${serviceProject.slug}`,
      },
    })
  } catch (error) {
    console.error('Error publishing project:', error)
    return NextResponse.json(
      { error: 'Failed to publish project' },
      { status: 500 }
    )
  }
}
