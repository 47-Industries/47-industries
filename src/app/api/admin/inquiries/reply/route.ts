import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthInfo } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { InquiryStatus } from '@prisma/client'
import { ZohoMailClient, refreshAccessToken } from '@/lib/zoho'
import { formatReplyEmail } from '@/lib/email'

// Helper to get a valid Zoho access token
async function getValidAccessToken(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      zohoAccessToken: true,
      zohoRefreshToken: true,
      zohoTokenExpiry: true,
    },
  })

  if (!user?.zohoAccessToken || !user?.zohoRefreshToken) {
    return null
  }

  const isExpired = user.zohoTokenExpiry
    ? new Date(user.zohoTokenExpiry).getTime() < Date.now() + 5 * 60 * 1000
    : true

  if (isExpired) {
    try {
      const tokens = await refreshAccessToken(user.zohoRefreshToken)

      await prisma.user.update({
        where: { id: userId },
        data: {
          zohoAccessToken: tokens.access_token,
          zohoTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        },
      })

      return tokens.access_token
    } catch (error) {
      console.error('Failed to refresh Zoho token:', error)
      return null
    }
  }

  return user.zohoAccessToken
}

// POST /api/admin/inquiries/reply - Send email reply to inquiry via Zoho
export async function POST(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)

    if (!auth.isAuthorized || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    if (!body.to || !body.subject || !body.message) {
      return NextResponse.json(
        { error: 'To, subject, and message are required' },
        { status: 400 }
      )
    }

    // Get Zoho access token
    const accessToken = await getValidAccessToken(auth.userId)

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Zoho Mail not connected. Please connect your email account first.', needsAuth: true },
        { status: 401 }
      )
    }

    // Get user info and signature
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { name: true, email: true },
    })

    // Get user's default signature or create a basic one
    let signature = await prisma.emailSignature.findFirst({
      where: {
        userId: auth.userId,
        isDefault: true,
      },
    })

    // If no signature exists, create a basic one from user info
    if (!signature && user) {
      signature = await prisma.emailSignature.create({
        data: {
          userId: auth.userId,
          name: user.name || user.email || '47 Industries',
          content: '', // Legacy field, not used for new format
          email: user.email || 'contact@47industries.com',
          isDefault: true,
        },
      })
    }

    // Format the email with professional template and signature
    const formattedEmail = formatReplyEmail({
      message: body.message,
      signature: signature ? {
        name: signature.name,
        title: signature.title,
        email: signature.email,
        phone: signature.phone,
      } : undefined,
      referenceNumber: body.referenceNumber,
    })

    // Get the latest message from this inquiry for email threading
    let inReplyTo: string | undefined
    let references: string | undefined
    if (body.inquiryId) {
      const latestMessage = await prisma.inquiryMessage.findFirst({
        where: {
          inquiryId: body.inquiryId,
          emailMessageId: { not: null },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (latestMessage?.emailMessageId) {
        inReplyTo = latestMessage.emailMessageId
        references = latestMessage.emailMessageId
      }
    }

    // Send via Zoho Mail API
    const client = new ZohoMailClient(accessToken)
    const fromAddress = 'contact@47industries.com'

    // Generate Message-ID for threading
    const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@47industries.com>`

    let result
    let sendError: string | null = null

    try {
      result = await client.sendEmail({
        fromAddress,
        toAddress: body.to,
        subject: body.subject,
        content: formattedEmail,
        isHtml: true,
        // Add email threading headers
        headers: {
          'Message-ID': messageId,
          ...(inReplyTo && { 'In-Reply-To': inReplyTo }),
          ...(references && { 'References': references }),
        },
      })
    } catch (err) {
      sendError = err instanceof Error ? err.message : 'Unknown error'
      console.error('Failed to send email via Zoho:', err)
    }

    if (sendError) {
      return NextResponse.json(
        { error: 'Failed to send email', details: sendError },
        { status: 500 }
      )
    }

    // Log the email
    await prisma.emailLog.create({
      data: {
        userId: auth.userId,
        userName: user?.name || user?.email || 'Unknown',
        fromAddress,
        toAddress: body.to,
        subject: body.subject,
        zohoMessageId: result?.messageId || null,
        status: 'sent',
      },
    })

    // Save the message to the database if inquiryId is provided
    if (body.inquiryId) {
      await prisma.inquiryMessage.create({
        data: {
          inquiryId: body.inquiryId,
          message: body.message,
          isFromAdmin: true,
          senderName: signature?.name || user?.name || '47 Industries',
          senderEmail: signature?.email || user?.email || 'contact@47industries.com',
          emailMessageId: messageId,
          emailInReplyTo: inReplyTo,
          emailSubject: body.subject,
        },
      })

      // Update inquiry status to IN_PROGRESS if it's NEW
      await prisma.serviceInquiry.updateMany({
        where: {
          id: body.inquiryId,
          status: InquiryStatus.NEW,
        },
        data: {
          status: InquiryStatus.IN_PROGRESS,
        },
      })
    }

    return NextResponse.json({
      success: true,
      messageId: result?.messageId,
    })
  } catch (error) {
    console.error('Error sending reply email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
