import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { refreshAccessToken } from '@/lib/zoho'

const ZOHO_MAIL_API_URL = 'https://mail.zoho.com/api'

// GET /api/admin/email/[messageId]/attachments/[attachmentId] - Download attachment
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string; attachmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId, attachmentId } = await params
    const { searchParams } = new URL(req.url)
    const folderId = searchParams.get('folderId')
    const name = searchParams.get('name') || 'attachment'

    if (!folderId) {
      return NextResponse.json({ error: 'folderId is required' }, { status: 400 })
    }

    // Get user's Zoho tokens
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        zohoAccessToken: true,
        zohoRefreshToken: true,
        zohoTokenExpiry: true,
      },
    })

    if (!user?.zohoAccessToken || !user?.zohoRefreshToken) {
      return NextResponse.json({ error: 'Zoho not connected' }, { status: 401 })
    }

    // Check if token needs refresh
    let accessToken = user.zohoAccessToken
    if (user.zohoTokenExpiry && new Date(user.zohoTokenExpiry) < new Date()) {
      const tokens = await refreshAccessToken(user.zohoRefreshToken)
      accessToken = tokens.access_token

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          zohoAccessToken: tokens.access_token,
          zohoTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        },
      })
    }

    // Get account ID
    const accountsResponse = await fetch(`${ZOHO_MAIL_API_URL}/accounts`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
      },
    })
    const accountsData = await accountsResponse.json()
    const accountId = accountsData.data?.[0]?.accountId

    if (!accountId) {
      return NextResponse.json({ error: 'No Zoho account found' }, { status: 404 })
    }

    // Fetch the attachment from Zoho
    const attachmentUrl = `${ZOHO_MAIL_API_URL}/accounts/${accountId}/folders/${folderId}/messages/${messageId}/attachments/${attachmentId}`

    const response = await fetch(attachmentUrl, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Zoho attachment error:', error)
      return NextResponse.json({ error: 'Failed to fetch attachment' }, { status: 500 })
    }

    // Get the content type from Zoho response
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const arrayBuffer = await response.arrayBuffer()

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${name}"`,
      },
    })
  } catch (error) {
    console.error('Error downloading attachment:', error)
    return NextResponse.json({ error: 'Failed to download attachment' }, { status: 500 })
  }
}
