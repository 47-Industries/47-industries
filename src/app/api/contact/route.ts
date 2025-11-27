import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ServiceType, InquiryStatus } from '@prisma/client'

// POST /api/contact - Submit a contact/service inquiry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

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
