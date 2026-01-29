import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthInfo } from '@/lib/auth-helper'

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

  // Check if token is expired (with 5 minute buffer)
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

// GET /api/admin/email/inbox - Get emails
export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)

    if (!auth.isAuthorized || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessToken = await getValidAccessToken(auth.userId)

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Zoho Mail not connected', needsAuth: true },
        { status: 401 }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const folderId = searchParams.get('folder') || 'inbox'
    const mailbox = searchParams.get('mailbox') // email address to filter by
    const limit = parseInt(searchParams.get('limit') || '50')
    const start = parseInt(searchParams.get('start') || '0')
    const search = searchParams.get('search')

    const client = new ZohoMailClient(accessToken)

    let emails: any[] = []
    try {
      // Get all accounts first
      const accounts = await client.getAccounts()

      if (search) {
        // Search across all accounts
        emails = await client.searchEmails(search, { limit, start })
      } else if (mailbox) {
        // Specific mailbox selected
        const primaryAccount = accounts[0]
        const isPrimaryEmail = primaryAccount?.primaryEmailAddress?.toLowerCase() === mailbox.toLowerCase() ||
                               primaryAccount?.mailboxAddress?.toLowerCase() === mailbox.toLowerCase()

        if (isPrimaryEmail) {
          // Primary email - fetch normally
          emails = await client.getEmails({
            accountId: primaryAccount.accountId,
            folderId,
            limit,
            start
          })
        } else {
          // Group/shared email - search for emails sent TO this address
          // Use Zoho search to find emails where this address is in To/Cc
          try {
            emails = await client.searchEmails(`toAddress:${mailbox}`, { limit, start })
          } catch (e) {
            console.error('Search failed, falling back to filter:', e)
            // Fallback: fetch all and filter by toAddress
            const allEmails = await client.getEmails({
              accountId: primaryAccount.accountId,
              folderId,
              limit: limit * 3, // Fetch more to filter
              start
            })
            emails = allEmails.filter((email: any) =>
              email.toAddress?.toLowerCase().includes(mailbox.toLowerCase())
            ).slice(0, limit)
          }
        }
      } else {
        // "All Inboxes" or single account - fetch all emails from primary account
        const primaryAccount = accounts[0]
        if (primaryAccount) {
          emails = await client.getEmails({
            accountId: primaryAccount.accountId,
            folderId,
            limit,
            start
          })
        }
      }
    } catch (apiError) {
      console.error('Zoho API error:', apiError)
      // Return empty array instead of crashing
      emails = []
    }

    // Transform Zoho email format to mobile app expected format
    const transformedEmails = emails.map((email: any) => ({
      id: email.messageId || email.mailId,
      messageId: email.messageId || email.mailId,
      subject: email.subject || '(No Subject)',
      from: {
        address: email.fromAddress || email.sender || '',
        name: email.fromName || email.senderName || email.fromAddress?.split('@')[0] || '',
      },
      to: email.toAddress ? [{
        address: email.toAddress,
        name: email.toName || email.toAddress?.split('@')[0] || '',
      }] : [],
      date: email.receivedTime ? new Date(parseInt(email.receivedTime)).toISOString()
            : email.sentDateInGMT
            || email.receivedDate
            || new Date().toISOString(),
      snippet: email.summary || email.snippet || '',
      isRead: email.status === 'read' || email.isRead === true || email.status2 === '1',
      hasAttachment: email.hasAttachment === true || email.hasAttachment === 'true' || (email.attachmentCount && email.attachmentCount > 0),
    }))

    return NextResponse.json({
      emails: transformedEmails,
      pagination: {
        start,
        limit,
        hasMore: emails.length === limit,
      },
    })
  } catch (error) {
    console.error('Error fetching emails:', error)
    return NextResponse.json(
      { error: 'Failed to fetch emails', emails: [] },
      { status: 500 }
    )
  }
}
