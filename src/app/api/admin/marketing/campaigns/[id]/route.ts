import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/marketing/campaigns/[id] - Get a specific campaign
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

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/marketing/campaigns/[id] - Update a campaign
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

    // Get current campaign
    const currentCampaign = await prisma.emailCampaign.findUnique({
      where: { id },
    })

    if (!currentCampaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Don't allow editing sent campaigns
    if (currentCampaign.status === 'sent' || currentCampaign.status === 'sending') {
      return NextResponse.json(
        { error: 'Cannot edit a sent campaign' },
        { status: 400 }
      )
    }

    const { name, subject, content, segmentId, action, scheduledAt } = body

    // Determine new status based on action
    let status = currentCampaign.status
    let sentAt = currentCampaign.sentAt
    let totalRecipients = currentCampaign.totalRecipients

    // Recalculate recipients if segment changed
    if (segmentId !== undefined) {
      if (segmentId) {
        const segment = await prisma.customerSegment.findUnique({
          where: { id: segmentId },
        })
        if (segment?.memberIds) {
          const memberIds = segment.memberIds as string[]
          totalRecipients = memberIds.length
        }
      } else {
        // All customers
        totalRecipients = await prisma.user.count({
          where: { role: 'CUSTOMER' },
        })
      }
    }

    if (action === 'schedule' && scheduledAt) {
      status = 'scheduled'
    } else if (action === 'send') {
      status = 'sending'
      // In a real implementation, you would queue the emails here
      // For now, we'll simulate sending
      status = 'sent'
      sentAt = new Date()
    } else if (action === 'draft') {
      status = 'draft'
    }

    const campaign = await prisma.emailCampaign.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(subject && { subject }),
        ...(content && { content }),
        ...(segmentId !== undefined && {
          segmentId: segmentId || null,
          recipientType: segmentId ? 'segment' : 'all',
        }),
        ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
        status,
        sentAt,
        totalRecipients,
        sentCount: status === 'sent' ? totalRecipients : currentCampaign.sentCount,
      },
    })

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/marketing/campaigns/[id] - Delete a campaign
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

    // Get current campaign
    const currentCampaign = await prisma.emailCampaign.findUnique({
      where: { id },
    })

    if (!currentCampaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Don't allow deleting sent campaigns
    if (currentCampaign.status === 'sent' || currentCampaign.status === 'sending') {
      return NextResponse.json(
        { error: 'Cannot delete a sent campaign' },
        { status: 400 }
      )
    }

    await prisma.emailCampaign.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}
