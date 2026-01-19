import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

// POST /api/auth/forgot-password - Request password reset
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Always return success to prevent email enumeration
    const successResponse = {
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    // If no user found, return success anyway (prevent enumeration)
    if (!user) {
      return NextResponse.json(successResponse)
    }

    // Check for rate limiting - max 3 requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentTokens = await prisma.passwordResetToken.count({
      where: {
        userId: user.id,
        createdAt: { gte: oneHourAgo },
      },
    })

    if (recentTokens >= 3) {
      // Return success to prevent enumeration, but don't send email
      console.log(`Rate limit exceeded for password reset: ${email}`)
      return NextResponse.json(successResponse)
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Create password reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    // Send password reset email
    const emailResult = await sendPasswordResetEmail({
      to: user.email!,
      name: user.name || 'User',
      resetToken: token,
    })

    if (!emailResult.success) {
      console.error('Failed to send password reset email to:', email, emailResult.error)
    } else {
      console.log('Password reset email sent successfully to:', email)
    }

    return NextResponse.json(successResponse)
  } catch (error) {
    console.error('Error in forgot-password:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    )
  }
}
