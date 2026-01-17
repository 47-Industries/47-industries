import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/admin/customers/[id]/username - Update customer username
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { username } = body

    // Validate username format if provided
    if (username) {
      if (!/^[a-z0-9]+$/.test(username)) {
        return NextResponse.json(
          { error: 'Username can only contain lowercase letters and numbers' },
          { status: 400 }
        )
      }

      if (username.length < 3) {
        return NextResponse.json(
          { error: 'Username must be at least 3 characters' },
          { status: 400 }
        )
      }

      if (username.length > 30) {
        return NextResponse.json(
          { error: 'Username must be 30 characters or less' },
          { status: 400 }
        )
      }

      // Check if username is already taken by another user
      const existingUser = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      })

      if (existingUser && existingUser.id !== id) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        )
      }
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { username: username || null },
      select: {
        id: true,
        username: true,
      },
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error) {
    console.error('Error updating username:', error)
    return NextResponse.json({ error: 'Failed to update username' }, { status: 500 })
  }
}
