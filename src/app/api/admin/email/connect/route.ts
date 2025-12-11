import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthInfo } from '@/lib/auth-helper'

import { getZohoAuthUrl } from '@/lib/zoho'

// GET /api/admin/email/connect - Get Zoho OAuth URL
export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)

    if (!auth.isAuthorized || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authUrl = getZohoAuthUrl(auth.userId)

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Error generating Zoho auth URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    )
  }
}
