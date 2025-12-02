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

    const searchParams = req.nextUrl.searchParams
    const folderId = searchParams.get('folder') || 'inbox'
    const mailbox = searchParams.get('mailbox') // email address to filter by
    const limit = parseInt(searchParams.get('limit') || '50')
    const start = parseInt(searchParams.get('start') || '0')
    const search = searchParams.get('search')

    const client = new ZohoMailClient(accessToken)

    let emails = []
    try {
      if (search) {
        emails = await client.searchEmails(search, { limit, start })
      } else {
        emails = await client.getEmails({ folderId, limit, start })
      }
    } catch (apiError) {
      console.error('Zoho API error:', apiError)
      // Return empty array instead of crashing
      emails = []
    }

    // Filter by mailbox (email address) if specified
    if (mailbox && emails.length > 0) {
      emails = emails.filter((email: any) =>
        email.toAddress?.toLowerCase().includes(mailbox.toLowerCase()) ||
        email.fromAddress?.toLowerCase().includes(mailbox.toLowerCase())
      )
    }

    return NextResponse.json({
      emails,
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
