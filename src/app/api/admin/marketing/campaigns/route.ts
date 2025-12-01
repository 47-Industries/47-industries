import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/marketing/campaigns - List all campaigns
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }

    const campaigns = await prisma.emailCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Get segments for the UI
    const segments = await prisma.customerSegment.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ campaigns, segments })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

// POST /api/admin/marketing/campaigns - Create a new campaign
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, subject, content, segmentId, action, scheduledAt } = body

    if (!name || !subject || !content) {
      return NextResponse.json(
        { error: 'Name, subject, and content are required' },
        { status: 400 }
      )
    }

    // Determine status based on action
    let status = 'draft'
    let sentAt = null
    let totalRecipients = 0

    // Count potential recipients
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

    if (action === 'schedule' && scheduledAt) {
      status = 'scheduled'
    } else if (action === 'send') {
      status = 'sending'
      // In a real implementation, you would queue the emails here
      // For now, we'll simulate sending
      status = 'sent'
      sentAt = new Date()
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        name,
        subject,
        content,
        segmentId: segmentId || null,
        recipientType: segmentId ? 'segment' : 'all',
        status,
        sentAt,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        totalRecipients,
        sentCount: status === 'sent' ? totalRecipients : 0,
      },
    })

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
