import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToR2 } from '@/lib/r2'

// GET - Get a user's signature (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: { signatureUrl: true, initialsUrl: true, name: true, title: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      signatureUrl: user.signatureUrl || null,
      initialsUrl: user.initialsUrl || null,
      name: user.name || null,
      title: user.title || null,
      email: user.email || null,
    })
  } catch (error) {
    console.error('Error fetching user signature:', error)
    return NextResponse.json({ error: 'Failed to fetch signature' }, { status: 500 })
  }
}

// POST - Save signature, initials, and title for a user (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { signatureDataUrl, initialsDataUrl, title } = await request.json()

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updateData: Record<string, string | null> = {}

    // Handle signature upload
    if (signatureDataUrl) {
      if (!signatureDataUrl.startsWith('data:image/png;base64,')) {
        return NextResponse.json({ error: 'Invalid signature data' }, { status: 400 })
      }
      const base64Data = signatureDataUrl.replace(/^data:image\/png;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      const fileName = `signatures/users/${id}-signature-${Date.now()}.png`
      updateData.signatureUrl = await uploadToR2(fileName, buffer, 'image/png')
    }

    // Handle initials upload
    if (initialsDataUrl) {
      if (!initialsDataUrl.startsWith('data:image/png;base64,')) {
        return NextResponse.json({ error: 'Invalid initials data' }, { status: 400 })
      }
      const base64Data = initialsDataUrl.replace(/^data:image\/png;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      const fileName = `signatures/users/${id}-initials-${Date.now()}.png`
      updateData.initialsUrl = await uploadToR2(fileName, buffer, 'image/png')
    }

    // Handle title update
    if (title !== undefined) {
      updateData.title = title?.trim() || null
    }

    // Update user record
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id },
        data: updateData,
      })
    }

    // Fetch updated user
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      select: { signatureUrl: true, initialsUrl: true, title: true },
    })

    return NextResponse.json({
      signatureUrl: updatedUser?.signatureUrl || null,
      initialsUrl: updatedUser?.initialsUrl || null,
      title: updatedUser?.title || null,
    })
  } catch (error) {
    console.error('Error saving user signature:', error)
    return NextResponse.json({ error: 'Failed to save signature' }, { status: 500 })
  }
}
