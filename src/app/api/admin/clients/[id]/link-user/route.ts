import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/clients/[id]/link-user
// Link a user account to a client
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'No user found with that email. They must register first.' },
        { status: 404 }
      )
    }

    // Check if user is already linked to a different client
    const existingLink = await prisma.client.findUnique({
      where: { userId: user.id },
    })

    if (existingLink && existingLink.id !== id) {
      return NextResponse.json(
        { error: 'This user is already linked to another client' },
        { status: 400 }
      )
    }

    // Find the client
    const client = await prisma.client.findUnique({
      where: { id },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Link the user to the client
    await prisma.client.update({
      where: { id },
      data: { userId: user.id },
    })

    // Log activity
    await prisma.clientActivity.create({
      data: {
        clientId: id,
        type: 'PORTAL_ACCESS',
        description: `User account ${user.email} linked for portal access`,
        metadata: {
          userId: user.id,
          userEmail: user.email,
          linkedBy: session.user.email,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'User linked successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error('Error linking user:', error)
    return NextResponse.json(
      { error: 'Failed to link user' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/clients/[id]/link-user
// Unlink a user account from a client
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Find the client
    const client = await prisma.client.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (!client.userId) {
      return NextResponse.json({ error: 'No user is linked to this client' }, { status: 400 })
    }

    const previousEmail = client.user?.email

    // Unlink the user
    await prisma.client.update({
      where: { id },
      data: { userId: null },
    })

    // Log activity
    await prisma.clientActivity.create({
      data: {
        clientId: id,
        type: 'PORTAL_ACCESS',
        description: `User account ${previousEmail} unlinked from portal access`,
        metadata: {
          previousEmail,
          unlinkedBy: session.user.email,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'User unlinked successfully',
    })
  } catch (error) {
    console.error('Error unlinking user:', error)
    return NextResponse.json(
      { error: 'Failed to unlink user' },
      { status: 500 }
    )
  }
}
