import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToR2 } from '@/lib/r2'

// GET - Get current user's signature data
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        signatureUrl: true,
        initialsUrl: true,
        title: true,
        name: true,
        email: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      signatureUrl: user.signatureUrl || null,
      initialsUrl: user.initialsUrl || null,
      title: user.title || null,
      name: user.name || null,
      email: user.email || null,
    })
  } catch (error) {
    console.error('Error fetching signature data:', error)
    return NextResponse.json({ error: 'Failed to fetch signature data' }, { status: 500 })
  }
}

// POST - Save signature, initials, and/or title for current user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { signatureDataUrl, initialsDataUrl, title } = await request.json()

    const updateData: Record<string, string | null> = {}

    // Handle signature upload
    if (signatureDataUrl) {
      if (!signatureDataUrl.startsWith('data:image/')) {
        return NextResponse.json({ error: 'Invalid signature data' }, { status: 400 })
      }

      // Extract base64 and mime type
      const matches = signatureDataUrl.match(/^data:image\/(\w+);base64,(.+)$/)
      if (!matches) {
        return NextResponse.json({ error: 'Invalid signature data format' }, { status: 400 })
      }

      const mimeType = `image/${matches[1]}`
      const base64Data = matches[2]
      const buffer = Buffer.from(base64Data, 'base64')
      const fileName = `signatures/users/${session.user.id}-signature-${Date.now()}.png`
      updateData.signatureUrl = await uploadToR2(fileName, buffer, mimeType)
    }

    // Handle initials upload
    if (initialsDataUrl) {
      if (!initialsDataUrl.startsWith('data:image/')) {
        return NextResponse.json({ error: 'Invalid initials data' }, { status: 400 })
      }

      const matches = initialsDataUrl.match(/^data:image\/(\w+);base64,(.+)$/)
      if (!matches) {
        return NextResponse.json({ error: 'Invalid initials data format' }, { status: 400 })
      }

      const mimeType = `image/${matches[1]}`
      const base64Data = matches[2]
      const buffer = Buffer.from(base64Data, 'base64')
      const fileName = `signatures/users/${session.user.id}-initials-${Date.now()}.png`
      updateData.initialsUrl = await uploadToR2(fileName, buffer, mimeType)
    }

    // Handle title update
    if (title !== undefined) {
      updateData.title = title?.trim() || null
    }

    // Update user record
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: updateData,
      })
    }

    // Fetch updated user
    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { signatureUrl: true, initialsUrl: true, title: true },
    })

    return NextResponse.json({
      signatureUrl: updatedUser?.signatureUrl || null,
      initialsUrl: updatedUser?.initialsUrl || null,
      title: updatedUser?.title || null,
    })
  } catch (error) {
    console.error('Error saving signature data:', error)
    return NextResponse.json({ error: 'Failed to save signature data' }, { status: 500 })
  }
}

// DELETE - Delete signature or initials
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type } = await request.json()

    if (!type || !['signature', 'initials'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const updateData: Record<string, null> = {}
    if (type === 'signature') {
      updateData.signatureUrl = null
    } else {
      updateData.initialsUrl = null
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting signature data:', error)
    return NextResponse.json({ error: 'Failed to delete signature data' }, { status: 500 })
  }
}
