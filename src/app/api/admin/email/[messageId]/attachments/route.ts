import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ZohoMailClient, refreshAccessToken } from '@/lib/zoho'

// GET /api/admin/email/[messageId]/attachments - Get attachments for an email
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId } = await params
    const { searchParams } = new URL(req.url)
    const folderId = searchParams.get('folderId')

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

    const client = new ZohoMailClient(accessToken)
    const accountId = await client.getAccountId()

    // Get folderId if not provided (default to inbox)
    let folderIdToUse = folderId
    if (!folderIdToUse) {
      const folders = await client.getFolders(accountId)
      const inbox = folders.find((f: any) => f.folderName?.toLowerCase() === 'inbox')
      folderIdToUse = inbox?.folderId
    }

    if (!folderIdToUse) {
      return NextResponse.json({ attachments: [] })
    }

    const attachments = await client.getAttachments(messageId, folderIdToUse, accountId)

    // Add download URLs to attachments
    const attachmentsWithUrls = attachments.map((att: any) => ({
      ...att,
      downloadUrl: `/api/admin/email/${messageId}/attachments/${att.attachmentId}?folderId=${folderIdToUse}&name=${encodeURIComponent(att.attachmentName)}`,
    }))

    return NextResponse.json({ attachments: attachmentsWithUrls, accountId, folderId: folderIdToUse })
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 })
  }
}
