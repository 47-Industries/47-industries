import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendPasswordChangedNotification } from '@/lib/email'
import bcrypt from 'bcryptjs'

// POST /api/admin/users/[id]/reset-password - Admin resets a user's password
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true },
    })

    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const { newPassword, sendNotification } = await req.json()

    if (!newPassword) {
      return NextResponse.json({ error: 'New password is required' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check permissions:
    // - Cannot reset your own password this way
    // - Regular ADMIN can only reset CUSTOMER passwords
    // - SUPER_ADMIN can reset any password
    if (targetUser.id === adminUser.id) {
      return NextResponse.json(
        { error: 'You cannot reset your own password here. Use your profile settings.' },
        { status: 403 }
      )
    }

    if (adminUser.role === 'ADMIN' && targetUser.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'You do not have permission to reset this user\'s password' },
        { status: 403 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update the user's password
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    })

    // Send notification email if requested and user has an email
    if (sendNotification && targetUser.email) {
      await sendPasswordChangedNotification({
        to: targetUser.email,
        name: targetUser.name || 'User',
        changedByAdmin: true,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      notificationSent: sendNotification && !!targetUser.email,
    })
  } catch (error) {
    console.error('Error resetting user password:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
