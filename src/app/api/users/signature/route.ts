import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToR2 } from '@/lib/r2'

// GET - Get current user's signature
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { signatureUrl: true, name: true },
    })

    return NextResponse.json({
      signatureUrl: user?.signatureUrl || null,
      name: user?.name || null,
    })
  } catch (error) {
    console.error('Error fetching signature:', error)
    return NextResponse.json({ error: 'Failed to fetch signature' }, { status: 500 })
  }
}

// POST - Save signature for current user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { signatureDataUrl } = await request.json()

    if (!signatureDataUrl || !signatureDataUrl.startsWith('data:image/png;base64,')) {
      return NextResponse.json({ error: 'Invalid signature data' }, { status: 400 })
    }

    // Convert base64 to buffer
    const base64Data = signatureDataUrl.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Upload to R2
    const fileName = `signatures/users/${session.user.id}-${Date.now()}.png`
    const signatureUrl = await uploadToR2(fileName, buffer, 'image/png')

    // Update user record
    await prisma.user.update({
      where: { id: session.user.id },
      data: { signatureUrl },
    })

    return NextResponse.json({ signatureUrl })
  } catch (error) {
    console.error('Error saving signature:', error)
    return NextResponse.json({ error: 'Failed to save signature' }, { status: 500 })
  }
}

// DELETE - Remove signature for current user
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { signatureUrl: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting signature:', error)
    return NextResponse.json({ error: 'Failed to delete signature' }, { status: 500 })
  }
}
