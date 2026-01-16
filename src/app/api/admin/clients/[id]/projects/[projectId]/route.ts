import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth, getAdminAuthInfo } from '@/lib/auth-helper'

// PATCH /api/admin/clients/[id]/projects/[projectId] - Update specific fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, projectId } = await params
    const body = await req.json()
    const auth = await getAdminAuthInfo(req)

    // Get current project
    const currentProject = await prisma.clientProject.findUnique({
      where: { id: projectId },
      include: {
        referredByPartner: {
          select: { id: true, name: true, partnerNumber: true },
        },
      },
    })

    if (!currentProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (currentProject.clientId !== id) {
      return NextResponse.json({ error: 'Project does not belong to this client' }, { status: 400 })
    }

    // Build update data from provided fields
    const updateData: any = {}

    if ('referredByPartnerId' in body) {
      updateData.referredByPartnerId = body.referredByPartnerId || null
    }
    if ('closedByUserId' in body) {
      updateData.closedByUserId = body.closedByUserId || null
    }
    if ('status' in body) {
      updateData.status = body.status
      if (body.status === 'COMPLETED' && currentProject.status !== 'COMPLETED') {
        updateData.completedAt = new Date()
      }
    }
    if ('name' in body) updateData.name = body.name
    if ('description' in body) updateData.description = body.description
    if ('type' in body) updateData.type = body.type
    if ('contractValue' in body) updateData.contractValue = body.contractValue
    if ('monthlyRecurring' in body) updateData.monthlyRecurring = body.monthlyRecurring
    if ('startDate' in body) updateData.startDate = body.startDate ? new Date(body.startDate) : null
    if ('estimatedEndDate' in body) updateData.estimatedEndDate = body.estimatedEndDate ? new Date(body.estimatedEndDate) : null
    if ('repositoryUrl' in body) updateData.repositoryUrl = body.repositoryUrl
    if ('productionUrl' in body) updateData.productionUrl = body.productionUrl
    if ('stagingUrl' in body) updateData.stagingUrl = body.stagingUrl

    const project = await prisma.clientProject.update({
      where: { id: projectId },
      data: updateData,
      include: {
        referredByPartner: {
          select: { id: true, name: true, partnerNumber: true },
        },
      },
    })

    // Log partner assignment if changed
    if ('referredByPartnerId' in body) {
      const oldPartnerName = currentProject.referredByPartner?.name
      const newPartner = body.referredByPartnerId
        ? await prisma.partner.findUnique({
            where: { id: body.referredByPartnerId },
            select: { name: true },
          })
        : null

      if (oldPartnerName !== newPartner?.name) {
        const description = newPartner
          ? `Project "${currentProject.name}" assigned to partner ${newPartner.name}`
          : `Partner removed from project "${currentProject.name}"`

        await prisma.clientActivity.create({
          data: {
            clientId: id,
            type: 'NOTE',
            description,
            performedBy: auth.userId,
          },
        })
      }
    }

    return NextResponse.json({ success: true, project })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

// GET /api/admin/clients/[id]/projects/[projectId] - Get specific project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, projectId } = await params

    const project = await prisma.clientProject.findUnique({
      where: { id: projectId },
      include: {
        contracts: true,
        referredByPartner: {
          select: { id: true, name: true, partnerNumber: true },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.clientId !== id) {
      return NextResponse.json({ error: 'Project does not belong to this client' }, { status: 400 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}
