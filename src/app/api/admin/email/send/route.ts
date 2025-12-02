import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ZohoMailClient, refreshAccessToken } from '@/lib/zoho'

// Helper to get a valid access token
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

// POST /api/admin/email/send - Send an email
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessToken = await getValidAccessToken(session.user.id)

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Zoho Mail not connected', needsAuth: true },
        { status: 401 }
      )
    }

    const body = await req.json()

    if (!body.to || !body.subject || !body.content) {
      return NextResponse.json(
        { error: 'To, subject, and content are required' },
        { status: 400 }
      )
    }

    const client = new ZohoMailClient(accessToken)

    const fromAddress = body.from || 'noreply@47industries.com'
    let result
    let sendError: string | null = null

    try {
      // Use sendEmailWithAttachments if attachments are provided
      result = body.attachments && body.attachments.length > 0
        ? await client.sendEmailWithAttachments({
            fromAddress,
            toAddress: body.to,
            ccAddress: body.cc,
            bccAddress: body.bcc,
            subject: body.subject,
            content: body.content,
            isHtml: body.isHtml !== false,
            attachments: body.attachments,
          })
        : await client.sendEmail({
            fromAddress,
            toAddress: body.to,
            ccAddress: body.cc,
            bccAddress: body.bcc,
            subject: body.subject,
            content: body.content,
            isHtml: body.isHtml !== false,
          })
    } catch (err) {
      sendError = err instanceof Error ? err.message : 'Unknown error'
    }

    // Log the email (whether successful or failed)
    await prisma.emailLog.create({
      data: {
        userId: session.user.id,
        userName: session.user.name || session.user.email || 'Unknown',
        fromAddress,
        toAddress: body.to,
        ccAddress: body.cc || null,
        bccAddress: body.bcc || null,
        subject: body.subject,
        zohoMessageId: result?.messageId || null,
        status: sendError ? 'failed' : 'sent',
        error: sendError,
      },
    })

    if (sendError) {
      return NextResponse.json(
        { error: 'Failed to send email', details: sendError },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result?.messageId,
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
