import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthInfo } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

// GET /api/admin/email/status - Check Zoho connection status
export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)

    if (!auth.isAuthorized || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        zohoAccessToken: true,
        zohoRefreshToken: true,
        zohoTokenExpiry: true,
      },
    })

    const isConnected = !!(user?.zohoAccessToken && user?.zohoRefreshToken)
    const isExpired = user?.zohoTokenExpiry
      ? new Date(user.zohoTokenExpiry).getTime() < Date.now()
      : true

    return NextResponse.json({
      connected: isConnected,
      status: isConnected ? (isExpired ? 'TOKEN_EXPIRED' : 'CONNECTED') : 'NOT_CONNECTED',
    })
  } catch (error) {
    console.error('Error checking Zoho status:', error)
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
}
