import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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
    const session = await getServerSession(authOptions)
    const { id } = await context.params

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const request = await prisma.customRequest.findUnique({
      where: { id },
    })

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    return NextResponse.json(request)
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
    const session = await getServerSession(authOptions)
    const { id } = await context.params

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const updateData: any = {
      status: body.status,
      adminNotes: body.adminNotes,
    }

    // If providing a quote
    if (body.estimatedPrice !== undefined) {
      updateData.estimatedPrice = body.estimatedPrice
      updateData.estimatedDays = body.estimatedDays
      updateData.quoteNotes = body.quoteNotes
      updateData.quotedAt = new Date()
      updateData.quotedBy = session.user.email || session.user.name || 'Admin'
    }

    const request = await prisma.customRequest.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(request)
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
    const session = await getServerSession(authOptions)
    const { id } = await context.params

    if (!session || session.user.role !== 'ADMIN') {
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
