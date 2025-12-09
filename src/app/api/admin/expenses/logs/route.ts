import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth-helper'

export async function GET(request: NextRequest) {
  const isAuthorized = await verifyAdminAuth(request)

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const billNotifierUrl = process.env.BILL_NOTIFIER_URL
    const apiKey = process.env.BILL_NOTIFIER_API_KEY

    if (!billNotifierUrl || !apiKey) {
      return NextResponse.json({ logs: [] })
    }

    const res = await fetch(`${billNotifierUrl}/api/logs`, {
      headers: {
        'X-API-Key': apiKey
      },
      cache: 'no-store'
    })

    if (!res.ok) {
      throw new Error('Failed to fetch logs')
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ logs: [] })
  }
}
