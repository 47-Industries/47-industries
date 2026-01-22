import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateInterests } from '@/lib/lead-utils'

// GET /api/account/partner/leads - Get partner's leads
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Not a partner' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: any = { partnerId: partner.id }

    if (status && status !== 'all') {
      where.status = status
    }

    const leads = await prisma.partnerLead.findMany({
      where,
      include: {
        commissions: {
          select: { id: true, amount: true, status: true, type: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ leads })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

// POST /api/account/partner/leads - Submit a new lead
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Not a partner' }, { status: 404 })
    }

    const body = await req.json()

    if (!body.businessName || !body.contactName || !body.email) {
      return NextResponse.json(
        { error: 'Business name, contact name, and email are required' },
        { status: 400 }
      )
    }

    // Generate lead number
    const date = new Date()
    const timestamp = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0')
    const count = await prisma.partnerLead.count()
    const leadNumber = `LEAD-${timestamp}-${(count + 1).toString().padStart(4, '0')}`

    // Validate interests if provided
    let interests = null
    if (body.interests && Array.isArray(body.interests) && body.interests.length > 0) {
      if (!validateInterests(body.interests)) {
        return NextResponse.json(
          { error: 'Invalid interest values provided' },
          { status: 400 }
        )
      }
      interests = body.interests
    }

    const lead = await prisma.partnerLead.create({
      data: {
        leadNumber,
        partnerId: partner.id,
        businessName: body.businessName,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone || null,
        website: body.website || null,
        description: body.description || null,
        interests,
        source: 'PARTNER',
        estimatedBudget: body.estimatedBudget || null,
        timeline: body.timeline || null,
        status: 'NEW',
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ success: true, lead })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}
