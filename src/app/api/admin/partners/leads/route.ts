import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/partners/leads - List all partner leads
export async function GET(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const partnerId = searchParams.get('partnerId')
    const search = searchParams.get('search')

    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (partnerId) {
      where.partnerId = partnerId
    }

    if (search) {
      where.OR = [
        { businessName: { contains: search } },
        { contactName: { contains: search } },
        { email: { contains: search } },
        { leadNumber: { contains: search } },
      ]
    }

    const leads = await prisma.partnerLead.findMany({
      where,
      include: {
        partner: {
          select: { id: true, name: true, partnerNumber: true },
        },
        commissions: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ leads })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

// POST /api/admin/partners/leads - Create a lead (admin can create on behalf of partner)
export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    if (!body.partnerId || !body.businessName || !body.contactName || !body.email) {
      return NextResponse.json(
        { error: 'Partner ID, business name, contact name, and email are required' },
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

    const lead = await prisma.partnerLead.create({
      data: {
        leadNumber,
        partnerId: body.partnerId,
        businessName: body.businessName,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone || null,
        website: body.website || null,
        description: body.description || null,
        status: body.status || 'NEW',
        notes: body.notes || null,
      },
      include: {
        partner: {
          select: { id: true, name: true, partnerNumber: true },
        },
      },
    })

    return NextResponse.json({ success: true, lead })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}
