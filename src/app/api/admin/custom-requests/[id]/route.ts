import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthInfo } from '@/lib/auth-helper'

import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/admin/custom-requests/[id] - Get single custom request
export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await getAdminAuthInfo(req)
    const { id } = await context.params

    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const request = await prisma.customRequest.findUnique({
      where: { id },
    })

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    return NextResponse.json({ request })
  } catch (error) {
    console.error('Error fetching custom request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch custom request' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/custom-requests/[id] - Update custom request
export async function PUT(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await getAdminAuthInfo(req)
    const { id } = await context.params

    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const updateData: any = {
      status: body.status,
      adminNotes: body.adminNotes,
    }

    // If providing a quote, get user info for quotedBy
    if (body.estimatedPrice !== undefined) {
      updateData.estimatedPrice = body.estimatedPrice
      updateData.estimatedDays = body.estimatedDays
      updateData.quoteNotes = body.quoteNotes
      updateData.quotedAt = new Date()

      // Get user email for quotedBy field
      if (auth.userId) {
        const user = await prisma.user.findUnique({
          where: { id: auth.userId },
          select: { email: true, name: true }
        })
        updateData.quotedBy = user?.email || user?.name || 'Admin'
      } else {
        updateData.quotedBy = 'Admin'
      }
    }

    const request = await prisma.customRequest.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ request })
  } catch (error) {
    console.error('Error updating custom request:', error)
    return NextResponse.json(
      { error: 'Failed to update custom request' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/custom-requests/[id] - Delete custom request
export async function DELETE(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await getAdminAuthInfo(req)
    const { id } = await context.params

    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.customRequest.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting custom request:', error)
    return NextResponse.json(
      { error: 'Failed to delete custom request' },
      { status: 500 }
    )
  }
}
