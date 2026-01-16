import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth, getAdminAuthInfo } from '@/lib/auth-helper'

// GET /api/admin/clients/[id] - Get single client with all details
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

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        contacts: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
        projects: {
          orderBy: { createdAt: 'desc' },
          include: {
            contracts: true,
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
          },
        },
        contracts: {
          orderBy: { createdAt: 'desc' },
        },
        notes: {
          orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        },
        activities: {
          orderBy: { performedAt: 'desc' },
          take: 50,
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        inquiry: true,
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Fetch attribution info for projects (partner who referred, team member who closed)
    const projectsWithAttribution = await Promise.all(
      client.projects.map(async (project) => {
        let referredBy = null
        let closedBy = null

        if (project.referredByPartnerId) {
          const partner = await prisma.partner.findUnique({
            where: { id: project.referredByPartnerId },
            select: { id: true, name: true, partnerNumber: true, firstSaleRate: true, recurringRate: true },
          })
          if (partner) {
            referredBy = {
              ...partner,
              firstSaleRate: Number(partner.firstSaleRate),
              recurringRate: Number(partner.recurringRate),
            }
          }
        }

        if (project.closedByUserId) {
          const teamMember = await prisma.teamMember.findFirst({
            where: { userId: project.closedByUserId },
            select: { id: true, name: true, employeeNumber: true },
          })
          closedBy = teamMember
        }

        return {
          ...project,
          referredBy,
          closedBy,
        }
      })
    )

    return NextResponse.json({
      client: {
        ...client,
        projects: projectsWithAttribution,
      },
    })
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
  }
}

// PUT /api/admin/clients/[id] - Update client
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

    // Get current client to check for status change
    const currentClient = await prisma.client.findUnique({
      where: { id },
      select: { type: true },
    })

    if (!currentClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        website: body.website,
        address: body.address,
        industry: body.industry,
        type: body.type,
        source: body.source,
        assignedTo: body.assignedTo,
        relationshipSummary: body.relationshipSummary,
        autopayEnabled: body.autopayEnabled,
        stripeCustomerId: body.stripeCustomerId,
        defaultPaymentMethod: body.defaultPaymentMethod,
        lastContactedAt: body.lastContactedAt ? new Date(body.lastContactedAt) : undefined,
        nextFollowUpAt: body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : undefined,
      },
      include: {
        contacts: true,
        projects: true,
      },
    })

    // Log status change if changed
    if (currentClient.type !== body.type && body.type) {
      await prisma.clientActivity.create({
        data: {
          clientId: id,
          type: 'STATUS_CHANGE',
          description: `Status changed from ${currentClient.type} to ${body.type}`,
          performedBy: auth.userId,
        },
      })
    }

    return NextResponse.json({ success: true, client })
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

// DELETE /api/admin/clients/[id] - Delete client
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            invoices: true,
            projects: true,
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Delete client (cascade will handle related records)
    await prisma.client.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
