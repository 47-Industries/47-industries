import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth, getAdminAuthInfo } from '@/lib/auth-helper'
import { Resend } from 'resend'

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    return null
  }
  return new Resend(process.env.RESEND_API_KEY)
}

// POST /api/admin/clients/[id]/send-quote - Send quote email
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const auth = await getAdminAuthInfo(req)

    // Get client info
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        contacts: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Determine recipient email
    const recipientEmail = body.email || client.contacts[0]?.email || client.email
    const recipientName = body.recipientName || client.contacts[0]?.name || client.name

    if (!recipientEmail) {
      return NextResponse.json({ error: 'No email address available' }, { status: 400 })
    }

    // Send email via Resend
    const resend = getResendClient()
    if (!resend) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    const emailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@47industries.com',
      to: recipientEmail,
      subject: body.subject || `Quote from 47 Industries - ${client.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Quote from 47 Industries</h2>
          <p>Hello ${recipientName},</p>
          ${body.content || '<p>Please find your quote details below.</p>'}
          ${body.quoteAmount ? `
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Quote Total</h3>
              <p style="font-size: 24px; font-weight: bold; color: #3b82f6; margin: 0;">
                $${parseFloat(body.quoteAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          ` : ''}
          <p>If you have any questions, please don't hesitate to reach out.</p>
          <p>Best regards,<br>47 Industries Team</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            47 Industries LLC<br>
            <a href="https://47industries.com" style="color: #3b82f6;">47industries.com</a>
          </p>
        </div>
      `,
    })

    // Log the message
    await prisma.clientMessage.create({
      data: {
        clientId: id,
        direction: 'OUTBOUND',
        channel: 'EMAIL',
        subject: body.subject || `Quote from 47 Industries - ${client.name}`,
        content: body.content || 'Quote sent',
        senderName: auth.userName || 'Admin',
        senderEmail: process.env.EMAIL_FROM || 'noreply@47industries.com',
        recipientEmail,
        recipientName,
        metadata: {
          quoteAmount: body.quoteAmount,
          resendId: emailResult.data?.id,
        },
      },
    })

    // Log activity
    await prisma.clientActivity.create({
      data: {
        clientId: id,
        type: 'EMAIL',
        description: `Quote email sent to ${recipientEmail}${body.quoteAmount ? ` ($${body.quoteAmount})` : ''}`,
        performedBy: auth.userId,
        metadata: {
          quoteAmount: body.quoteAmount,
          recipientEmail,
        },
      },
    })

    // Update last contacted
    await prisma.client.update({
      where: { id },
      data: { lastContactedAt: new Date() },
    })

    return NextResponse.json({ success: true, emailId: emailResult.data?.id })
  } catch (error) {
    console.error('Error sending quote:', error)
    return NextResponse.json({ error: 'Failed to send quote' }, { status: 500 })
  }
}
