import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/webhooks/zoho/sent - Handle sent emails from Zoho webhook
// This captures emails sent from Zoho Mail client (not admin console)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    console.log('Received Zoho webhook - sent email:', {
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
        message: 'Email sent but no reference number found',
      })
    }

    console.log('Found reference number:', referenceNumber)

    // Parse sender info from 'from' field
    let senderEmail = from
    let senderName = from

    const emailMatch = from.match(/<([^>]+)>/)
    if (emailMatch) {
      senderEmail = emailMatch[1]
      senderName = from.replace(/<[^>]+>/, '').trim()
    }

    // Check if it's a CustomRequest (3D printing, starts with REQ-)
    if (referenceNumber.startsWith('REQ-')) {
      const customRequest = await prisma.customRequest.findFirst({
        where: {
          requestNumber: referenceNumber,
        },
      })

      if (!customRequest) {
        console.log('No custom request found for reference:', referenceNumber)
        return NextResponse.json({
          success: true,
          message: 'Custom request not found',
        })
      }

      // Check if this message already exists (to avoid duplicates from admin console sends)
      const existingMessage = await prisma.customRequestMessage.findFirst({
        where: {
          requestId: customRequest.id,
          emailMessageId: messageId,
        },
      })

      if (existingMessage) {
        console.log('Message already exists, skipping duplicate:', messageId)
        return NextResponse.json({
          success: true,
          message: 'Message already recorded',
        })
      }

      // Create CustomRequestMessage for the sent email
      await prisma.customRequestMessage.create({
        data: {
          requestId: customRequest.id,
          message: plainTextContent || content || 'No content',
          isFromAdmin: true, // This is from the team
          senderName,
          senderEmail,
          emailMessageId: messageId,
          emailInReplyTo: inReplyTo,
          emailSubject: subject,
        },
      })

      // Update request's updatedAt timestamp
      await prisma.customRequest.update({
        where: { id: customRequest.id },
        data: { updatedAt: new Date() },
      })

      console.log('Successfully created CustomRequestMessage for sent email:', referenceNumber)

      return NextResponse.json({
        success: true,
        message: 'Sent email processed successfully',
        requestNumber: referenceNumber,
      })
    }

    // Otherwise, it's a ServiceInquiry (INQ- or CONTACT-)
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

    // Check if this message already exists (to avoid duplicates from admin console sends)
    const existingMessage = await prisma.inquiryMessage.findFirst({
      where: {
        inquiryId: inquiry.id,
        emailMessageId: messageId,
      },
    })

    if (existingMessage) {
      console.log('Message already exists, skipping duplicate:', messageId)
      return NextResponse.json({
        success: true,
        message: 'Message already recorded',
      })
    }

    // Create InquiryMessage for the sent email
    await prisma.inquiryMessage.create({
      data: {
        inquiryId: inquiry.id,
        message: plainTextContent || content || 'No content',
        isFromAdmin: true, // This is from the team
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

    console.log('Successfully created InquiryMessage for sent email:', referenceNumber)

    return NextResponse.json({
      success: true,
      message: 'Sent email processed successfully',
      inquiryNumber: referenceNumber,
    })
  } catch (error) {
    console.error('Error processing Zoho sent webhook:', error)

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
    endpoint: 'zoho-sent-webhook',
    message: 'This endpoint receives sent emails from Zoho Mail',
  })
}
