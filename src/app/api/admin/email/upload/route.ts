import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ZohoMailClient, refreshAccessToken } from '@/lib/zoho'

// POST /api/admin/email/upload - Upload an attachment for sending
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
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

    const client = new ZohoMailClient(accessToken)
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const result = await client.uploadAttachment(fileBuffer, file.name)

    return NextResponse.json({
      success: true,
      storeName: result.storeName,
      fileName: file.name,
      fileSize: file.size,
    })
  } catch (error) {
    console.error('Error uploading attachment:', error)
    return NextResponse.json({ error: 'Failed to upload attachment' }, { status: 500 })
  }
}
