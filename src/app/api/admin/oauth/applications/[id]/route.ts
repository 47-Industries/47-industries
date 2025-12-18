import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthInfo } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

// PATCH /api/admin/oauth/applications/[id] - Update OAuth application
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAdminAuthInfo(req)
    if (!auth.isAuthorized || !['ADMIN', 'SUPER_ADMIN'].includes(auth.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, description, websiteUrl, redirectUris, active } = body

    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl
    if (active !== undefined) updateData.active = active

    if (redirectUris !== undefined) {
      if (!Array.isArray(redirectUris) || redirectUris.length === 0) {
        return NextResponse.json(
          { error: 'At least one redirect URI is required' },
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

      updateData.redirectUris = redirectUris
    }

    const application = await prisma.oAuthApplication.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { accessTokens: true }
        }
      }
    })

    return NextResponse.json({ application })
  } catch (error: any) {
    console.error('Error updating OAuth application:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
  }
}

// DELETE /api/admin/oauth/applications/[id] - Delete OAuth application
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAdminAuthInfo(req)
    if (!auth.isAuthorized || !['ADMIN', 'SUPER_ADMIN'].includes(auth.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.oAuthApplication.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting OAuth application:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 })
  }
}
