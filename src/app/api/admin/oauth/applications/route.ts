import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthInfo } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

// GET /api/admin/oauth/applications - List all OAuth applications
export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)
    if (!auth.isAuthorized || !['ADMIN', 'SUPER_ADMIN'].includes(auth.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const applications = await prisma.oAuthApplication.findMany({
      include: {
        _count: {
          select: {
            accessTokens: {
              where: {
                revoked: false,
                expiresAt: { gte: new Date() }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ applications })
  } catch (error) {
    console.error('Error fetching OAuth applications:', error)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}

// POST /api/admin/oauth/applications - Create new OAuth application
export async function POST(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)
    if (!auth.isAuthorized || !['ADMIN', 'SUPER_ADMIN'].includes(auth.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, websiteUrl, redirectUris } = body

    if (!name || !redirectUris || !Array.isArray(redirectUris) || redirectUris.length === 0) {
      return NextResponse.json(
        { error: 'Name and at least one redirect URI are required' },
        { status: 400 }
      )
    }

    // Validate redirect URIs
    for (const uri of redirectUris) {
      try {
        new URL(uri)
      } catch {
        return NextResponse.json(
          { error: `Invalid redirect URI: ${uri}` },
          { status: 400 }
        )
      }
    }

    const application = await prisma.oAuthApplication.create({
      data: {
        name,
        description,
        websiteUrl,
        redirectUris: redirectUris,
        scopes: ['openid', 'email', 'profile'],
        ownerId: auth.userId || undefined,
      },
      include: {
        _count: {
          select: { accessTokens: true }
        }
      }
    })

    return NextResponse.json({ application })
  } catch (error) {
    console.error('Error creating OAuth application:', error)
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 })
  }
}
