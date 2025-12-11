import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthInfo } from '@/lib/auth-helper'

import { prisma } from '@/lib/prisma'
import { ZohoMailClient, refreshAccessToken } from '@/lib/zoho'

async function getValidAccessToken(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      zohoAccessToken: true,
      zohoRefreshToken: true,
      zohoTokenExpiry: true,
    },
  })

  if (!user?.zohoAccessToken || !user?.zohoRefreshToken) {
    return null
  }

  const isExpired = user.zohoTokenExpiry
    ? new Date(user.zohoTokenExpiry).getTime() < Date.now() + 5 * 60 * 1000
    : true

  if (isExpired) {
    try {
      const tokens = await refreshAccessToken(user.zohoRefreshToken)
      await prisma.user.update({
        where: { id: userId },
        data: {
          zohoAccessToken: tokens.access_token,
          zohoTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        },
      })
      return tokens.access_token
    } catch (error) {
      console.error('Failed to refresh Zoho token:', error)
      return null
    }
  }

  return user.zohoAccessToken
}

// GET /api/admin/email/labels - Get all labels
export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)
    if (!auth.isAuthorized || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessToken = await getValidAccessToken(auth.userId)
    if (!accessToken) {
      return NextResponse.json({ error: 'Zoho Mail not connected', needsAuth: true }, { status: 401 })
    }

    const client = new ZohoMailClient(accessToken)
    const labels = await client.getLabels()

    return NextResponse.json({ labels })
  } catch (error) {
    console.error('Error fetching labels:', error)
    return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 })
  }
}

// POST /api/admin/email/labels - Create a new label
export async function POST(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)
    if (!auth.isAuthorized || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessToken = await getValidAccessToken(auth.userId)
    if (!accessToken) {
      return NextResponse.json({ error: 'Zoho Mail not connected', needsAuth: true }, { status: 401 })
    }

    const { name, color } = await req.json()
    if (!name) {
      return NextResponse.json({ error: 'Label name is required' }, { status: 400 })
    }

    const client = new ZohoMailClient(accessToken)
    const label = await client.createLabel(name, color)

    return NextResponse.json({ label, success: true })
  } catch (error) {
    console.error('Error creating label:', error)
    return NextResponse.json({ error: 'Failed to create label' }, { status: 500 })
  }
}
