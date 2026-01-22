import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateInterests } from '@/lib/lead-utils'

// API key for AI receptionist (Jesse) authentication
// Should be set in environment variables
const AI_RECEPTIONIST_API_KEY = process.env.AI_RECEPTIONIST_API_KEY

// POST /api/leads/capture - Called by Jesse (AI receptionist) to submit leads
export async function POST(req: NextRequest) {
  try {
    // Verify API key
    const apiKey = req.headers.get('X-API-Key')
    if (!apiKey || apiKey !== AI_RECEPTIONIST_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Validate required fields
    if (!body.businessName || !body.contactName || !body.email) {
      return NextResponse.json(
        { error: 'Business name, contact name, and email are required' },
        { status: 400 }
      )
    }

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

    // Find the partner if partnerId is provided, otherwise use a default "AI Receptionist" partner
    let partnerId = body.partnerId
    if (!partnerId) {
      // Look for or create a system partner for AI receptionist leads
      let aiPartner = await prisma.partner.findFirst({
        where: { name: '47 Industries AI Receptionist' },
      })

      if (!aiPartner) {
        // Create the AI receptionist partner (system partner)
        const date = new Date()
        const timestamp = date.getFullYear().toString() +
          (date.getMonth() + 1).toString().padStart(2, '0') +
          date.getDate().toString().padStart(2, '0')
        const partnerNumber = `PTR-${timestamp}-AI`

        aiPartner = await prisma.partner.create({
          data: {
            partnerNumber,
            name: '47 Industries AI Receptionist',
            email: 'jesse@47industries.com',
            type: 'AFFILIATE',
            status: 'ACTIVE',
            firstSaleRate: 0, // AI receptionist doesn't get commission
            recurringRate: 0,
          },
        })
      }

      partnerId = aiPartner.id
    }

    // Generate lead number
    const date = new Date()
    const timestamp = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0')
    const count = await prisma.partnerLead.count()
    const leadNumber = `LEAD-${timestamp}-${(count + 1).toString().padStart(4, '0')}`

    // Create the lead
    const lead = await prisma.partnerLead.create({
      data: {
        leadNumber,
        partnerId,
        businessName: body.businessName,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone || null,
        website: body.website || null,
        description: body.description || null,
        interests,
        source: 'AI_RECEPTIONIST',
        estimatedBudget: body.estimatedBudget || null,
        timeline: body.timeline || null,
        companySize: body.companySize || null,
        currentSolution: body.currentSolution || null,
        painPoints: body.painPoints || null,
        conversationId: body.conversationId || null,
        status: 'NEW',
        notes: body.notes || null,
      },
    })

    return NextResponse.json({
      success: true,
      lead: {
        id: lead.id,
        leadNumber: lead.leadNumber,
      },
    })
  } catch (error) {
    console.error('Error capturing lead:', error)
    return NextResponse.json({ error: 'Failed to capture lead' }, { status: 500 })
  }
}
