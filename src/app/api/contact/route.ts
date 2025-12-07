import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ServiceType, InquiryStatus } from '@prisma/client'
import { sendContactConfirmation, sendAdminNotification } from '@/lib/email'
import { isSpam, validateHoneypot } from '@/lib/spam-protection'

// POST /api/contact - Submit a contact/service inquiry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Honeypot check - if filled, it's a bot
    if (!validateHoneypot(body.website_url)) {
      // Silently reject but return success to not tip off bots
      return NextResponse.json({
        success: true,
        inquiryNumber: 'INQ-000000-0000',
        message: 'Your message has been received!',
      })
    }

    // Spam detection
    if (isSpam({ name: body.name, email: body.email, message: body.message, subject: body.subject })) {
      return NextResponse.json(
        { error: 'Your submission was flagged as spam. Please try again with a valid message.' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json(
        { error: 'Name, email, subject, and message are required' },
        { status: 400 }
      )
    }

    // Generate inquiry number
    const date = new Date()
    const prefix = 'INQ'
    const timestamp = date.getFullYear().toString().slice(-2) +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0')
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    const inquiryNumber = `${prefix}-${timestamp}-${random}`

    // Determine service type from subject
    let serviceType: ServiceType = ServiceType.OTHER
    const subjectLower = body.subject.toLowerCase()
    if (subjectLower.includes('web') || subjectLower.includes('website')) {
      serviceType = ServiceType.WEB_DEVELOPMENT
    } else if (subjectLower.includes('app') || subjectLower.includes('mobile')) {
      serviceType = ServiceType.APP_DEVELOPMENT
    } else if (subjectLower.includes('ai') || subjectLower.includes('machine learning')) {
      serviceType = ServiceType.AI_SOLUTIONS
    } else if (subjectLower.includes('consult')) {
      serviceType = ServiceType.CONSULTATION
    }

    const inquiry = await prisma.serviceInquiry.create({
      data: {
        inquiryNumber,
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        company: body.company || null,
        website: body.website || null,
        serviceType,
        budget: body.budget || null,
        timeline: body.timeline || null,
        description: `Subject: ${body.subject}\n\n${body.message}`,
        status: InquiryStatus.NEW,
      },
    })

    // Send confirmation email to customer
    await sendContactConfirmation({
      to: body.email,
      name: body.name,
      inquiryNumber: inquiry.inquiryNumber,
      subject: body.subject,
    })

    // Send notification to admin
    await sendAdminNotification({
      type: 'contact',
      title: `${body.name} - ${body.subject}`,
      details: `Name: ${body.name}\nEmail: ${body.email}\nCompany: ${body.company || 'N/A'}\nPhone: ${body.phone || 'N/A'}\n\nMessage:\n${body.message}`,
      link: `https://admin.47industries.com/admin/inquiries/${inquiry.id}`,
    })

    return NextResponse.json({
      success: true,
      inquiryNumber: inquiry.inquiryNumber,
      message: 'Your message has been received. We will get back to you soon!',
    })
  } catch (error) {
    console.error('Error submitting contact form:', error)
    return NextResponse.json(
      { error: 'Failed to submit your message. Please try again.' },
      { status: 500 }
    )
  }
}
