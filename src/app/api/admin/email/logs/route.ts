import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/email/logs - Get email logs (can filter by messageId)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const messageId = searchParams.get('messageId')
    const subject = searchParams.get('subject')
    const toAddress = searchParams.get('to')

    // Build query - can lookup by Zoho messageId, subject, or recipient
    const where: any = {}

    if (messageId) {
      where.zohoMessageId = messageId
    }

    if (subject) {
      where.subject = subject
    }

    if (toAddress) {
      where.toAddress = toAddress
    }

    const logs = await prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Error fetching email logs:', error)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}
