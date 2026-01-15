import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth, getAdminAuthInfo } from '@/lib/auth-helper'

// GET /api/admin/clients/[id]/messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const messages = await prisma.clientMessage.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// POST /api/admin/clients/[id]/messages - Add message (internal thread)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const auth = await getAdminAuthInfo(req)

    if (!body.content) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    const message = await prisma.clientMessage.create({
      data: {
        clientId: id,
        direction: body.direction || 'INTERNAL',
        channel: body.channel || 'NOTE',
        subject: body.subject || null,
        content: body.content,
        senderName: auth.userName || 'Admin',
        senderEmail: auth.userEmail || null,
      },
    })

    // Log activity
    await prisma.clientActivity.create({
      data: {
        clientId: id,
        type: body.direction === 'OUTBOUND' ? 'EMAIL' : 'NOTE',
        description: body.direction === 'OUTBOUND'
          ? `Email sent: ${body.subject || 'No subject'}`
          : 'Internal message added',
        performedBy: auth.userId,
      },
    })

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }
}

// DELETE /api/admin/clients/[id]/messages - Delete message
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const messageId = searchParams.get('messageId')

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
    }

    await prisma.clientMessage.delete({
      where: { id: messageId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
  }
}
