import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth, getAdminAuthInfo } from '@/lib/auth-helper'

// GET /api/admin/clients/[id]/projects
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const projects = await prisma.clientProject.findMany({
      where: { clientId: id },
      include: {
        contracts: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

// POST /api/admin/clients/[id]/projects - Add project
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const auth = await getAdminAuthInfo(req)

    if (!body.name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    const project = await prisma.clientProject.create({
      data: {
        clientId: id,
        name: body.name,
        description: body.description || null,
        type: body.type || 'WEB_DEVELOPMENT',
        status: body.status || 'PROPOSAL',
        contractValue: body.contractValue || null,
        monthlyRecurring: body.monthlyRecurring || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        estimatedEndDate: body.estimatedEndDate ? new Date(body.estimatedEndDate) : null,
        inquiryId: body.inquiryId || null,
        repositoryUrl: body.repositoryUrl || null,
        productionUrl: body.productionUrl || null,
        stagingUrl: body.stagingUrl || null,
      },
    })

    // Log activity
    await prisma.clientActivity.create({
      data: {
        clientId: id,
        type: 'NOTE',
        description: `Project "${body.name}" created`,
        performedBy: auth.userId,
      },
    })

    return NextResponse.json({ success: true, project })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}

// PUT /api/admin/clients/[id]/projects - Update project
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const auth = await getAdminAuthInfo(req)

    if (!body.projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Get current project for status change logging
    const currentProject = await prisma.clientProject.findUnique({
      where: { id: body.projectId },
      select: { status: true, name: true },
    })

    const project = await prisma.clientProject.update({
      where: { id: body.projectId },
      data: {
        name: body.name,
        description: body.description,
        type: body.type,
        status: body.status,
        contractValue: body.contractValue,
        monthlyRecurring: body.monthlyRecurring,
        startDate: body.startDate ? new Date(body.startDate) : null,
        estimatedEndDate: body.estimatedEndDate ? new Date(body.estimatedEndDate) : null,
        completedAt: body.status === 'COMPLETED' && currentProject?.status !== 'COMPLETED'
          ? new Date()
          : undefined,
        repositoryUrl: body.repositoryUrl,
        productionUrl: body.productionUrl,
        stagingUrl: body.stagingUrl,
      },
    })

    // Log status change if changed
    if (currentProject && currentProject.status !== body.status && body.status) {
      await prisma.clientActivity.create({
        data: {
          clientId: id,
          type: 'STATUS_CHANGE',
          description: `Project "${currentProject.name}" status changed from ${currentProject.status} to ${body.status}`,
          performedBy: auth.userId,
        },
      })
    }

    return NextResponse.json({ success: true, project })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

// DELETE /api/admin/clients/[id]/projects - Delete project
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    await prisma.clientProject.delete({
      where: { id: projectId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
