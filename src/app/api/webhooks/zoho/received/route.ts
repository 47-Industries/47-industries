import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/webhooks/zoho/received - Handle incoming emails from Zoho webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    console.log('Received Zoho webhook - incoming email:', {
      from: body.from,
      to: body.to,
      subject: body.subject,
      timestamp: new Date().toISOString(),
    })

    // Extract email details from Zoho webhook payload
    const { from, to, subject, content, plainTextContent, messageId, inReplyTo } = body

    // Extract reference number from subject
    const referenceMatch = subject?.match(/\[(INQ-\d{6}-[A-Z0-9]{4}|REQ-\d{6}-[A-Z0-9]{4}|CONTACT-\d{6}-[A-Z0-9]{4})\]/)
    const referenceNumber = referenceMatch?.[1]

    if (!referenceNumber) {
      console.log('No reference number found in subject, skipping:', subject)
      return NextResponse.json({
        success: true,
        message: 'Email received but no reference number found',
      })
    }

    console.log('Found reference number:', referenceNumber)

    // Find the inquiry by reference number
    const inquiry = await prisma.serviceInquiry.findFirst({
      where: {
        inquiryNumber: referenceNumber,
      },
    })

    if (!inquiry) {
      console.log('No inquiry found for reference:', referenceNumber)
      return NextResponse.json({
        success: true,
        message: 'Inquiry not found',
      })
    }

    // Parse sender info from 'from' field
    // Format is usually: "Name <email@example.com>" or just "email@example.com"
    let senderEmail = from
    let senderName = from

    const emailMatch = from.match(/<([^>]+)>/)
    if (emailMatch) {
      senderEmail = emailMatch[1]
      senderName = from.replace(/<[^>]+>/, '').trim()
    }

    // Create InquiryMessage for the customer's reply
    await prisma.inquiryMessage.create({
      data: {
        inquiryId: inquiry.id,
        message: plainTextContent || content || 'No content',
        isFromAdmin: false, // This is from the customer
        senderName,
        senderEmail,
        emailMessageId: messageId,
        emailInReplyTo: inReplyTo,
        emailSubject: subject,
      },
    })

    // Update inquiry's updatedAt timestamp
    await prisma.serviceInquiry.update({
      where: { id: inquiry.id },
      data: { updatedAt: new Date() },
    })

    console.log('Successfully created InquiryMessage for:', referenceNumber)

    return NextResponse.json({
      success: true,
      message: 'Email processed successfully',
      inquiryNumber: referenceNumber,
    })
  } catch (error) {
    console.error('Error processing Zoho webhook:', error)

    // Return 200 anyway to prevent Zoho from retrying
    return NextResponse.json({
      success: false,
      error: 'Internal error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

// GET endpoint for verification
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: 'zoho-received-webhook',
    message: 'This endpoint receives incoming emails from Zoho Mail',
  })
}
