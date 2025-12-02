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

// GET /api/admin/email/[messageId] - Get full email content
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
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

    const { messageId } = await params
    const client = new ZohoMailClient(accessToken)

    // Get email content (HTML body)
    const content = await client.getEmailContent(messageId)

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Error fetching email content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email content' },
      { status: 500 }
    )
  }
}
