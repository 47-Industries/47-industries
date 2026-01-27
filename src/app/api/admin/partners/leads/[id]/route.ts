import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminAuthInfo } from '@/lib/auth-helper'
import {
  validateInterests,
  getRecommendedServiceType,
  getPortfolioCategoriesForInterests,
  LeadInterest,
} from '@/lib/lead-utils'

// GET /api/admin/partners/leads/[id] - Get lead details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAdminAuthInfo(req)
    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const lead = await prisma.partnerLead.findUnique({
      where: { id },
      include: {
        partner: {
          select: { id: true, name: true, partnerNumber: true, firstSaleRate: true, recurringRate: true },
        },
        commissions: {
          include: {
            payout: {
              select: { id: true, payoutNumber: true, status: true },
            },
          },
        },
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Get related portfolio items based on interests
    let relatedPortfolio: any[] = []
    const interests = lead.interests as LeadInterest[] | null
    if (interests && Array.isArray(interests) && interests.length > 0) {
      try {
        const categories = getPortfolioCategoriesForInterests(interests)
        if (categories.length > 0) {
          relatedPortfolio = await prisma.serviceProject.findMany({
            where: {
              category: { in: categories },
              isFeatured: true,
            },
            select: {
              id: true,
              title: true,
              category: true,
              thumbnailUrl: true,
              slug: true,
            },
            take: 6,
            orderBy: { createdAt: 'desc' },
          })
        }
      } catch (portfolioError) {
        console.error('Error fetching related portfolio:', portfolioError)
        // Continue without portfolio items
      }
    }

    // Get recommended service type for conversion
    let recommendedServiceType = 'OTHER'
    if (interests && Array.isArray(interests) && interests.length > 0) {
      try {
        recommendedServiceType = getRecommendedServiceType(interests)
      } catch (e) {
        console.error('Error getting recommended service type:', e)
      }
    }

    return NextResponse.json({ lead, relatedPortfolio, recommendedServiceType })
  } catch (error) {
    console.error('Error fetching lead:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to fetch lead', details: errorMessage }, { status: 500 })
  }
}

// PUT /api/admin/partners/leads/[id] - Update lead
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAdminAuthInfo(req)
    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    // Validate interests if provided
    let interests = undefined // undefined means don't update
    if (body.interests !== undefined) {
      if (body.interests === null || (Array.isArray(body.interests) && body.interests.length === 0)) {
        interests = null
      } else if (Array.isArray(body.interests)) {
        if (!validateInterests(body.interests)) {
          return NextResponse.json(
            { error: 'Invalid interest values provided' },
            { status: 400 }
          )
        }
        interests = body.interests
      }
    }

    const lead = await prisma.partnerLead.update({
      where: { id },
      data: {
        businessName: body.businessName,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone || null,
        website: body.website || null,
        description: body.description || null,
        ...(interests !== undefined && { interests }),
        ...(body.estimatedBudget !== undefined && { estimatedBudget: body.estimatedBudget || null }),
        ...(body.timeline !== undefined && { timeline: body.timeline || null }),
        ...(body.companySize !== undefined && { companySize: body.companySize || null }),
        ...(body.currentSolution !== undefined && { currentSolution: body.currentSolution || null }),
        ...(body.painPoints !== undefined && { painPoints: body.painPoints || null }),
        status: body.status,
        notes: body.notes || null,
        closedBy: body.closedBy || null,
        closedAt: body.status === 'CONVERTED' && !body.closedAt ? new Date() : body.closedAt,
      },
      include: {
        partner: {
          select: { id: true, name: true, partnerNumber: true },
        },
      },
    })

    return NextResponse.json({ success: true, lead })
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}

// PATCH /api/admin/partners/leads/[id] - Update lead (alias for PUT)
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(req, context)
}

// POST /api/admin/partners/leads/[id]/convert - Convert lead to client
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAdminAuthInfo(req)
    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    // Get the lead
    const lead = await prisma.partnerLead.findUnique({
      where: { id },
      include: {
        partner: true,
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (lead.status === 'CONVERTED') {
      return NextResponse.json({ error: 'Lead is already converted' }, { status: 400 })
    }

    // Create the client
    const date = new Date()
    const timestamp = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0')
    const count = await prisma.client.count()
    const clientNumber = `CLI-${timestamp}-${(count + 1).toString().padStart(4, '0')}`

    const client = await prisma.client.create({
      data: {
        clientNumber,
        name: lead.businessName,
        email: lead.email,
        phone: lead.phone,
        website: lead.website,
        type: 'ACTIVE',
        source: 'REFERRAL',
      },
    })

    // Create a project if provided
    let project = null
    const leadInterests = lead.interests as LeadInterest[] | null
    if (body.projectName && body.projectType) {
      project = await prisma.clientProject.create({
        data: {
          clientId: client.id,
          name: body.projectName,
          description: body.projectDescription || null,
          type: body.projectType,
          status: 'PROPOSAL',
          contractValue: body.contractValue ? parseFloat(body.contractValue) : null,
          monthlyRecurring: body.monthlyRecurring ? parseFloat(body.monthlyRecurring) : null,
          referredByPartnerId: lead.partnerId,
          closedByUserId: auth.userId,
          // Track lead origin for attribution chain
          sourceLeadId: lead.id,
          sourceInterests: leadInterests,
        },
      })
    }

    // Update the lead
    const updatedLead = await prisma.partnerLead.update({
      where: { id },
      data: {
        status: 'CONVERTED',
        clientId: client.id,
        projectId: project?.id || null,
        closedBy: auth.userId,
        closedAt: new Date(),
      },
    })

    // Create commission if there's a contract value
    if (body.contractValue && parseFloat(body.contractValue) > 0) {
      const commissionRate = lead.partner.firstSaleRate
      const commissionAmount = parseFloat(body.contractValue) * (Number(commissionRate) / 100)

      await prisma.partnerCommission.create({
        data: {
          partnerId: lead.partnerId,
          leadId: lead.id,
          type: 'FIRST_SALE',
          baseAmount: parseFloat(body.contractValue),
          rate: commissionRate,
          amount: commissionAmount,
          status: 'PENDING',
        },
      })
    }

    // Log activity
    await prisma.clientActivity.create({
      data: {
        clientId: client.id,
        type: 'STATUS_CHANGE',
        description: `Client created from partner lead ${lead.leadNumber} (referred by ${lead.partner.name})`,
        performedBy: auth.userId,
      },
    })

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      client,
      project,
    })
  } catch (error) {
    console.error('Error converting lead:', error)
    return NextResponse.json({ error: 'Failed to convert lead' }, { status: 500 })
  }
}
