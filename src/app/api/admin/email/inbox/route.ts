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
        // Specific mailbox selected - find the matching account and fetch from it
        const matchingAccount = accounts.find((account: any) =>
          account.emailAddress?.toLowerCase() === mailbox.toLowerCase() ||
          account.primaryEmailAddress?.toLowerCase() === mailbox.toLowerCase() ||
          account.incomingEmailAddress?.toLowerCase() === mailbox.toLowerCase()
        )

        if (matchingAccount) {
          emails = await client.getEmails({
            accountId: matchingAccount.accountId,
            folderId,
            limit,
            start
          })
        } else {
          // Fallback: fetch from all accounts and filter
          const emailPromises = accounts.map(async (account: any) => {
            try {
              return await client.getEmails({
                accountId: account.accountId,
                folderId,
                limit,
                start: 0
              })
            } catch (e) {
              return []
            }
          })
          const allEmailArrays = await Promise.all(emailPromises)
          emails = allEmailArrays.flat().filter((email: any) =>
            email.toAddress?.toLowerCase().includes(mailbox.toLowerCase()) ||
            email.fromAddress?.toLowerCase().includes(mailbox.toLowerCase())
          )
        }
      } else if (accounts.length > 1) {
        // "All Inboxes" - fetch from ALL accounts and combine
        const emailPromises = accounts.map(async (account: any) => {
          try {
            return await client.getEmails({
              accountId: account.accountId,
              folderId,
              limit: Math.ceil(limit / accounts.length) + 10,
              start: 0
            })
          } catch (e) {
            console.error(`Failed to fetch from account ${account.accountId}:`, e)
            return []
          }
        })

        const allEmailArrays = await Promise.all(emailPromises)
        emails = allEmailArrays.flat()

        // Sort by date (most recent first) and apply limit
        emails.sort((a: any, b: any) => {
          const dateA = a.receivedTime ? parseInt(a.receivedTime) : 0
          const dateB = b.receivedTime ? parseInt(b.receivedTime) : 0
          return dateB - dateA
        })
        emails = emails.slice(start, start + limit)
      } else {
        // Only one account
        emails = await client.getEmails({ folderId, limit, start })
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
