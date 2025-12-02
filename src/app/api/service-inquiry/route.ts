import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ServiceType, InquiryStatus } from '@prisma/client'
import { sendServiceInquiryConfirmation, sendAdminNotification } from '@/lib/email'

// POST /api/service-inquiry - Submit a detailed service inquiry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate required fields
    if (!body.name || !body.email || !body.serviceType || !body.description) {
      return NextResponse.json(
        { error: 'Name, email, service type, and project description are required' },
        { status: 400 }
      )
    }

    // Validate service type
    const validServiceTypes = ['WEB_DEVELOPMENT', 'APP_DEVELOPMENT', 'AI_SOLUTIONS', 'CONSULTATION', 'OTHER']
    if (!validServiceTypes.includes(body.serviceType)) {
      return NextResponse.json(
        { error: 'Invalid service type' },
        { status: 400 }
      )
    }

    // Generate inquiry number
    const date = new Date()
    const prefix = body.serviceType === 'WEB_DEVELOPMENT' ? 'WEB' :
                   body.serviceType === 'APP_DEVELOPMENT' ? 'APP' :
                   body.serviceType === 'AI_SOLUTIONS' ? 'AI' :
                   body.serviceType === 'CONSULTATION' ? 'CON' : 'SVC'
    const timestamp = date.getFullYear().toString().slice(-2) +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0')
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    const inquiryNumber = `${prefix}-${timestamp}-${random}`

    // Build detailed description from form fields
    let fullDescription = body.description

    // Add project details if provided
    const projectDetails: string[] = []

    if (body.projectType) {
      projectDetails.push(`Project Type: ${body.projectType}`)
    }
    if (body.pages) {
      projectDetails.push(`Estimated Pages/Screens: ${body.pages}`)
    }
    if (body.features && body.features.length > 0) {
      projectDetails.push(`Desired Features: ${body.features.join(', ')}`)
    }
    if (body.platforms && body.platforms.length > 0) {
      projectDetails.push(`Target Platforms: ${body.platforms.join(', ')}`)
    }
    if (body.hasDesign !== undefined) {
      projectDetails.push(`Has Existing Design: ${body.hasDesign ? 'Yes' : 'No'}`)
    }
    if (body.designDetails) {
      projectDetails.push(`Design Details: ${body.designDetails}`)
    }
    if (body.existingWebsite) {
      projectDetails.push(`Existing Website: ${body.existingWebsite}`)
    }
    if (body.competitors) {
      projectDetails.push(`Reference/Competitor Sites: ${body.competitors}`)
    }
    if (body.additionalInfo) {
      projectDetails.push(`Additional Information: ${body.additionalInfo}`)
    }

    if (projectDetails.length > 0) {
      fullDescription = `${body.description}\n\n--- Project Details ---\n${projectDetails.join('\n')}`
    }

    const inquiry = await prisma.serviceInquiry.create({
      data: {
        inquiryNumber,
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        company: body.company || null,
        website: body.website || null,
        serviceType: body.serviceType as ServiceType,
        budget: body.budget || null,
        timeline: body.timeline || null,
        description: fullDescription,
        status: InquiryStatus.NEW,
      },
    })

    // Get service type label for emails
    const serviceTypeLabels: Record<string, string> = {
      WEB_DEVELOPMENT: 'Web Development',
      APP_DEVELOPMENT: 'App Development',
      AI_SOLUTIONS: 'AI Solutions',
      CONSULTATION: 'Consultation',
      OTHER: 'Other Services',
    }
    const serviceLabel = serviceTypeLabels[body.serviceType] || body.serviceType

    // Send confirmation email to customer
    try {
      await sendServiceInquiryConfirmation({
        to: body.email,
        name: body.name,
        inquiryNumber: inquiry.inquiryNumber,
        serviceType: serviceLabel,
      })
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't fail the request if email fails
    }

    // Send notification to admin
    try {
      await sendAdminNotification({
        type: 'service_inquiry',
        title: `New ${serviceLabel} Inquiry from ${body.name}`,
        details: `Name: ${body.name}\nEmail: ${body.email}\nCompany: ${body.company || 'N/A'}\nPhone: ${body.phone || 'N/A'}\nBudget: ${body.budget || 'Not specified'}\nTimeline: ${body.timeline || 'Not specified'}\n\nProject Description:\n${body.description}`,
        link: `https://47industries.com/admin/inquiries?tab=service`,
      })
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError)
    }

    return NextResponse.json({
      success: true,
      inquiryNumber: inquiry.inquiryNumber,
      message: 'Your project inquiry has been received! We will review your requirements and get back to you within 1-2 business days.',
    })
  } catch (error) {
    console.error('Error submitting service inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to submit your inquiry. Please try again.' },
      { status: 500 }
    )
  }
}
