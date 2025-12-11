import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthInfo } from '@/lib/auth-helper'

import { prisma } from '@/lib/prisma'
import { sendReplyEmail, EMAIL_ADDRESSES } from '@/lib/email'

// POST /api/admin/email/reply - Send a reply email to a customer
export async function POST(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)

    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Validate required fields
    if (!body.to || !body.subject || !body.message) {
      return NextResponse.json(
        { error: 'Recipient, subject, and message are required' },
        { status: 400 }
      )
    }

    // Validate from address if provided
    if (body.fromAddress && !Object.values(EMAIL_ADDRESSES).includes(body.fromAddress)) {
      return NextResponse.json(
        { error: 'Invalid from address' },
        { status: 400 }
      )
    }

    // Get user name for sender
    let senderName = body.senderName || '47 Industries'
    if (auth.userId && !body.senderName) {
      const user = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { name: true }
      })
      if (user?.name) {
        senderName = user.name
      }
    }

    // Send the email
    const result = await sendReplyEmail({
      to: body.to,
      subject: body.subject,
      message: body.message,
      referenceNumber: body.referenceNumber,
      fromAddress: body.fromAddress,
      senderName,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    // Log the email in the database if it's related to an inquiry or custom request
    const emailLog = `[Email sent ${new Date().toISOString()}]\nFrom: ${body.fromAddress || 'noreply@47industries.com'}\nTo: ${body.to}\nSubject: ${body.subject}\n\n${body.message}`

    if (body.inquiryId) {
      const inquiry = await prisma.serviceInquiry.findUnique({
        where: { id: body.inquiryId },
        select: { adminNotes: true },
      })
      await prisma.serviceInquiry.update({
        where: { id: body.inquiryId },
        data: {
          adminNotes: inquiry?.adminNotes
            ? `${inquiry.adminNotes}\n\n---\n\n${emailLog}`
            : emailLog,
        },
      })
    }

    if (body.customRequestId) {
      const request = await prisma.customRequest.findUnique({
        where: { id: body.customRequestId },
        select: { adminNotes: true },
      })
      await prisma.customRequest.update({
        where: { id: body.customRequestId },
        data: {
          adminNotes: request?.adminNotes
            ? `${request.adminNotes}\n\n---\n\n${emailLog}`
            : emailLog,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
    })
  } catch (error) {
    console.error('Error sending reply email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}

// GET /api/admin/email/reply - Get available email addresses
export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)

    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      addresses: Object.entries(EMAIL_ADDRESSES).map(([key, value]) => ({
        id: key,
        email: value,
        label: key.charAt(0).toUpperCase() + key.slice(1),
      })),
    })
  } catch (error) {
    console.error('Error fetching email addresses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email addresses' },
      { status: 500 }
    )
  }
}
