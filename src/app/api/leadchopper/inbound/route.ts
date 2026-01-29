import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendAdminNotification } from '@/lib/email'

/**
 * POST /api/leadchopper/inbound
 *
 * Dedicated endpoint for LeadChopper to push leads to 47 Industries.
 * Uses a simple shared secret for authentication.
 *
 * Set LEADCHOPPER_API_SECRET in 47 Industries env vars.
 * Use that same secret as the FORTY_SEVEN_API_TOKEN in LeadChopper.
 */
export async function POST(req: NextRequest) {
  try {
    // Verify API secret
    const authHeader = req.headers.get('authorization')
    const apiSecret = process.env.LEADCHOPPER_API_SECRET

    if (!apiSecret) {
      console.error('[LeadChopper Inbound] LEADCHOPPER_API_SECRET not configured')
      return NextResponse.json({ error: 'API not configured' }, { status: 500 })
    }

    const providedSecret = authHeader?.replace('Bearer ', '')
    if (providedSecret !== apiSecret) {
      return NextResponse.json({ error: 'Invalid API token' }, { status: 401 })
    }

    const body = await req.json()
    const { pushType, data } = body

    // Validate required fields
    if (!pushType || !data) {
      return NextResponse.json({ error: 'pushType and data are required' }, { status: 400 })
    }

    if (!data.name || !data.email) {
      return NextResponse.json({ error: 'name and email are required' }, { status: 400 })
    }

    // Route to appropriate handler based on pushType
    switch (pushType) {
      case 'service_inquiry':
        return await handleServiceInquiry(data)
      case 'client':
        return await handleClient(data)
      case 'partner_inquiry':
        return await handlePartnerInquiry(data)
      default:
        return NextResponse.json({ error: `Invalid pushType: ${pushType}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[LeadChopper Inbound] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleServiceInquiry(data: any) {
  // Check for duplicate by leadchopperId
  if (data.leadchopperId) {
    const existing = await prisma.serviceInquiry.findFirst({
      where: {
        description: { contains: `LeadChopper Lead: ${data.leadchopperId}` }
      }
    })
    if (existing) {
      return NextResponse.json({
        success: true,
        id: existing.id,
        inquiryNumber: existing.inquiryNumber,
        message: 'Lead already exists in 47 Industries',
        duplicate: true,
      })
    }
  }

  // Generate inquiry number
  const date = new Date()
  const prefix = data.serviceType === 'WEB_DEVELOPMENT' ? 'WEB' :
                 data.serviceType === 'APP_DEVELOPMENT' ? 'APP' :
                 data.serviceType === 'AI_SOLUTIONS' ? 'AI' :
                 data.serviceType === 'CONSULTATION' ? 'CON' : 'SVC'
  const timestamp = date.getFullYear().toString().slice(-2) +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  const inquiryNumber = `${prefix}-${timestamp}-${random}`

  // Build description with LeadChopper tracking
  let description = data.description || 'Lead from LeadChopper'
  if (data.leadchopperId) {
    description += `\n\n---\nLeadChopper Lead: ${data.leadchopperId}`
  }
  if (data.leadchopperOrgId) {
    description += `\nLeadChopper Org: ${data.leadchopperOrgId}`
  }

  // Create inquiry
  const inquiry = await prisma.serviceInquiry.create({
    data: {
      inquiryNumber,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      company: data.company || data.name,
      website: data.website || null,
      serviceType: data.serviceType || 'OTHER',
      budget: data.budget || null,
      timeline: data.timeline || null,
      description,
      status: 'NEW',
    },
  })

  // Send admin notification
  try {
    await sendAdminNotification({
      type: 'service_inquiry',
      title: `LeadChopper Lead: ${data.name}`,
      details: [
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        data.company ? `Company: ${data.company}` : null,
        data.phone ? `Phone: ${data.phone}` : null,
        data.website ? `Website: ${data.website}` : null,
        `Service Type: ${data.serviceType || 'OTHER'}`,
        `\n${data.description || 'No description provided'}`,
      ].filter(Boolean).join('\n'),
      link: `https://admin.47industries.com/admin/inquiries/${inquiry.id}`,
    })
  } catch (e) {
    console.error('[LeadChopper Inbound] Failed to send notification:', e)
  }

  return NextResponse.json({
    success: true,
    id: inquiry.id,
    inquiryNumber: inquiry.inquiryNumber,
    type: 'service_inquiry',
  })
}

async function handleClient(data: any) {
  // Check for duplicate by leadchopperId
  if (data.leadchopperId) {
    const existing = await prisma.client.findUnique({
      where: { leadchopperId: data.leadchopperId }
    })
    if (existing) {
      return NextResponse.json({
        success: true,
        id: existing.id,
        clientNumber: existing.clientNumber,
        message: 'Client already exists in 47 Industries',
        duplicate: true,
      })
    }
  }

  // Check for existing client by email
  const existingByEmail = await prisma.client.findFirst({
    where: { email: data.email.toLowerCase() }
  })
  if (existingByEmail) {
    // Update with LeadChopper ID if not set
    if (data.leadchopperId && !existingByEmail.leadchopperId) {
      await prisma.client.update({
        where: { id: existingByEmail.id },
        data: {
          leadchopperId: data.leadchopperId,
          leadchopperOrgId: data.leadchopperOrgId,
        }
      })
    }
    return NextResponse.json({
      success: true,
      id: existingByEmail.id,
      clientNumber: existingByEmail.clientNumber,
      message: 'Client already exists (matched by email)',
      duplicate: true,
    })
  }

  // Generate client number
  const date = new Date()
  const timestamp = date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0')
  const count = await prisma.client.count()
  const clientNumber = `CLI-${timestamp}-${(count + 1).toString().padStart(4, '0')}`

  // Create client
  const client = await prisma.client.create({
    data: {
      clientNumber,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      website: data.website || null,
      address: data.address || null,
      industry: data.industry || null,
      type: 'PROSPECT',
      source: 'LEADCHOPPER',
      leadchopperId: data.leadchopperId || null,
      leadchopperOrgId: data.leadchopperOrgId || null,
      // Create primary contact
      contacts: {
        create: {
          name: data.contactName || data.name,
          email: data.contactEmail || data.email.toLowerCase(),
          phone: data.contactPhone || data.phone,
          isPrimary: true,
        }
      }
    },
    include: { contacts: true }
  })

  return NextResponse.json({
    success: true,
    id: client.id,
    clientNumber: client.clientNumber,
    type: 'client',
  })
}

async function handlePartnerInquiry(data: any) {
  // Check for duplicate by leadchopperId
  if (data.leadchopperId) {
    const existing = await prisma.partnerInquiry.findFirst({
      where: { leadchopperId: data.leadchopperId }
    })
    if (existing) {
      return NextResponse.json({
        success: true,
        id: existing.id,
        inquiryNumber: existing.inquiryNumber,
        message: 'Partner inquiry already exists',
        duplicate: true,
      })
    }
  }

  // Generate inquiry number
  const date = new Date()
  const timestamp = date.getFullYear().toString().slice(-2) +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  const inquiryNumber = `PTI-${timestamp}-${random}`

  // Create inquiry
  const inquiry = await prisma.partnerInquiry.create({
    data: {
      inquiryNumber,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      company: data.company || null,
      website: data.website || null,
      socialMedia: data.socialMedia || null,
      audience: data.audience || 'Lead from LeadChopper',
      reason: data.reason || 'Interested in partnership',
      status: 'NEW',
      leadchopperId: data.leadchopperId || null,
      leadchopperOrgId: data.leadchopperOrgId || null,
    },
  })

  // Send admin notification
  try {
    await sendAdminNotification({
      type: 'partner_inquiry',
      title: `LeadChopper Partner Lead: ${data.name}`,
      details: [
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        data.company ? `Company: ${data.company}` : null,
        data.phone ? `Phone: ${data.phone}` : null,
        `\nAudience: ${data.audience || 'Not specified'}`,
        `\nReason: ${data.reason || 'Not specified'}`,
      ].filter(Boolean).join('\n'),
      link: `https://admin.47industries.com/admin/partner-inquiries/${inquiry.id}`,
    })
  } catch (e) {
    console.error('[LeadChopper Inbound] Failed to send notification:', e)
  }

  return NextResponse.json({
    success: true,
    id: inquiry.id,
    inquiryNumber: inquiry.inquiryNumber,
    type: 'partner_inquiry',
  })
}

/**
 * GET /api/leadchopper/inbound
 * Health check endpoint
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const apiSecret = process.env.LEADCHOPPER_API_SECRET

  if (!apiSecret) {
    return NextResponse.json({ status: 'not_configured' })
  }

  const providedSecret = authHeader?.replace('Bearer ', '')
  if (providedSecret !== apiSecret) {
    return NextResponse.json({ status: 'unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    status: 'ok',
    message: 'LeadChopper inbound API is ready',
    supportedTypes: ['service_inquiry', 'client', 'partner_inquiry']
  })
}
