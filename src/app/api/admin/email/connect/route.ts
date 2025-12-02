import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getZohoAuthUrl } from '@/lib/zoho'

// GET /api/admin/email/connect - Get Zoho OAuth URL
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authUrl = getZohoAuthUrl(session.user.id)

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Error generating Zoho auth URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    )
  }
}
