import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminAuthInfo } from '@/lib/auth-helper'
import { validateInterests, LEAD_INTEREST_LABELS, LeadInterest } from '@/lib/lead-utils'

// GET /api/admin/partners/leads - List all partner leads
export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)
    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const partnerId = searchParams.get('partnerId')
    const search = searchParams.get('search')
    const interest = searchParams.get('interest')
    const source = searchParams.get('source')
    const includeStats = searchParams.get('includeStats') === 'true'

    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (partnerId) {
      where.partnerId = partnerId
    }

    if (source && source !== 'all') {
      where.source = source
    }

    if (search) {
      where.OR = [
        { businessName: { contains: search } },
        { contactName: { contains: search } },
        { email: { contains: search } },
        { leadNumber: { contains: search } },
      ]
    }

    // Note: Interest filtering is done after fetch since it's a JSON array
    // For larger datasets, consider a separate LeadInterest join table

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

    // Filter by interest if specified (post-fetch filtering for JSON array)
    let filteredLeads = leads
    if (interest && interest !== 'all') {
      filteredLeads = leads.filter((lead) => {
        const interests = lead.interests as LeadInterest[] | null
        return interests && interests.includes(interest as LeadInterest)
      })
    }

    // Calculate interest stats if requested
    let stats = null
    if (includeStats) {
      const interestCounts: Record<string, number> = {}
      const sourceCounts: Record<string, number> = {}

      for (const lead of leads) {
        // Count by source
        const leadSource = (lead.source || 'PARTNER') as string
        sourceCounts[leadSource] = (sourceCounts[leadSource] || 0) + 1

        // Count by interest
        const interests = lead.interests as LeadInterest[] | null
        if (interests && Array.isArray(interests)) {
          for (const i of interests) {
            interestCounts[i] = (interestCounts[i] || 0) + 1
          }
        }
      }

      stats = {
        totalLeads: leads.length,
        byInterest: Object.entries(interestCounts).map(([interest, count]) => ({
          interest,
          label: LEAD_INTEREST_LABELS[interest as LeadInterest] || interest,
          count,
        })),
        bySource: Object.entries(sourceCounts).map(([source, count]) => ({
          source,
          count,
        })),
      }
    }

    return NextResponse.json({ leads: filteredLeads, stats })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

// POST /api/admin/partners/leads - Create a lead (admin can create on behalf of partner)
export async function POST(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)
    if (!auth.isAuthorized) {
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
        partnerId: body.partnerId,
        businessName: body.businessName,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone || null,
        website: body.website || null,
        description: body.description || null,
        interests,
        source: body.source || 'MANUAL',
        estimatedBudget: body.estimatedBudget || null,
        timeline: body.timeline || null,
        companySize: body.companySize || null,
        currentSolution: body.currentSolution || null,
        painPoints: body.painPoints || null,
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
