import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendVerificationCode, verifyCode } from '@/lib/twilio'

// POST /api/admin/verify-sms - Send or verify SMS code
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, phone: true },
    })

    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only super admins can use this feature' }, { status: 403 })
    }

    if (!currentUser.phone) {
      return NextResponse.json({ error: 'No phone number on file. Please add your phone number in settings.' }, { status: 400 })
    }

    const body = await req.json()
    const { action, code } = body

    if (action === 'send') {
      // Send verification code
      const result = await sendVerificationCode(currentUser.phone)
      if (result.success) {
        return NextResponse.json({ success: true, message: 'Verification code sent' })
      } else {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
    }

    if (action === 'verify') {
      // Verify the code
      if (!code) {
        return NextResponse.json({ error: 'Code is required' }, { status: 400 })
      }

      const result = await verifyCode(currentUser.phone, code)
      if (result.success) {
        return NextResponse.json({ success: true, verified: true })
      } else {
        return NextResponse.json({ error: result.error, verified: false }, { status: 400 })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('SMS verification error:', error)
    return NextResponse.json({ error: 'Failed to process verification' }, { status: 500 })
  }
}
