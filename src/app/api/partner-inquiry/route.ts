import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendAdminNotification } from '@/lib/email'

/**
 * POST /api/partner-inquiry
 * Public endpoint for partner/affiliate inquiries
 * Can be submitted from:
 * - 47 Industries website partner application form
 * - LeadChopper integration (when funnel type = partner)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check for duplicate by email (within last 7 days)
    const recentDuplicate = await prisma.partnerInquiry.findFirst({
      where: {
        email: body.email.toLowerCase(),
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    })

    if (recentDuplicate) {
      return NextResponse.json({
        success: true,
        inquiryNumber: recentDuplicate.inquiryNumber,
        message: 'We already received your inquiry. Our team will be in touch soon.',
        duplicate: true,
      })
    }

    // Generate inquiry number: PTI-YYMMDD-XXXX
    const date = new Date()
    const timestamp = date.getFullYear().toString().slice(-2) +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0')
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    const inquiryNumber = `PTI-${timestamp}-${random}`

    // Create the partner inquiry
    const inquiry = await prisma.partnerInquiry.create({
      data: {
        inquiryNumber,
        name: body.name,
        email: body.email.toLowerCase(),
        phone: body.phone || null,
        company: body.company || null,
        website: body.website || null,
        socialMedia: body.socialMedia || null,
        audience: body.audience || 'Not specified',
        reason: body.reason || 'Not specified',
        status: 'NEW',
        // LeadChopper tracking
        leadchopperId: body.leadchopperId || null,
        leadchopperOrgId: body.leadchopperOrgId || null,
      },
    })

    // Send admin notification
    try {
      await sendAdminNotification({
        type: 'partner_inquiry',
        title: `New Partner Inquiry from ${body.name}`,
        details: [
          `Name: ${body.name}`,
          `Email: ${body.email}`,
          body.company ? `Company: ${body.company}` : null,
          body.phone ? `Phone: ${body.phone}` : null,
          body.website ? `Website: ${body.website}` : null,
          body.socialMedia ? `Social: ${body.socialMedia}` : null,
          `\nAudience/Platform:\n${body.audience || 'Not specified'}`,
          `\nReason for Partnership:\n${body.reason || 'Not specified'}`,
          body.leadchopperId ? `\n[LeadChopper Lead: ${body.leadchopperId}]` : null,
        ].filter(Boolean).join('\n'),
        link: `https://admin.47industries.com/admin/partner-inquiries/${inquiry.id}`,
      })
    } catch (emailError) {
      console.error('Failed to send admin notification for partner inquiry:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      inquiryNumber: inquiry.inquiryNumber,
      id: inquiry.id,
      message: 'Thank you for your interest in partnering with 47 Industries! Our team will review your inquiry and get back to you within 1-2 business days.',
    })
  } catch (error) {
    console.error('Error creating partner inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to submit partner inquiry. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/partner-inquiry
 * Get partner inquiry by inquiry number (for status check)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const inquiryNumber = searchParams.get('inquiryNumber')
    const email = searchParams.get('email')

    if (!inquiryNumber || !email) {
      return NextResponse.json(
        { error: 'Inquiry number and email are required' },
        { status: 400 }
      )
    }

    const inquiry = await prisma.partnerInquiry.findFirst({
      where: {
        inquiryNumber,
        email: email.toLowerCase(),
      },
      select: {
        inquiryNumber: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
      },
    })

    if (!inquiry) {
      return NextResponse.json(
        { error: 'Inquiry not found' },
        { status: 404 }
      )
    }

    // Map status to user-friendly message
    const statusMessages: Record<string, string> = {
      NEW: 'Your inquiry is pending review',
      CONTACTED: 'Our team has reached out - please check your email',
      APPROVED: 'Congratulations! Your partnership application has been approved',
      REJECTED: 'We appreciate your interest, but we are unable to proceed at this time',
    }

    return NextResponse.json({
      inquiry: {
        ...inquiry,
        statusMessage: statusMessages[inquiry.status] || 'Status unknown',
      },
    })
  } catch (error) {
    console.error('Error fetching partner inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inquiry status' },
      { status: 500 }
    )
  }
}
