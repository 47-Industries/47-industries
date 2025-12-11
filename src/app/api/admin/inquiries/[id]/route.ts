import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth-helper'

import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/admin/inquiries/[id] - Get single inquiry
export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    const { id } = await context.params

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const inquiry = await prisma.serviceInquiry.findUnique({
      where: { id },
    })

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    return NextResponse.json({ inquiry })
  } catch (error) {
    console.error('Error fetching inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inquiry' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/inquiries/[id] - Update inquiry
export async function PUT(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    const { id } = await context.params

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const inquiry = await prisma.serviceInquiry.update({
      where: { id },
      data: {
        status: body.status,
        assignedTo: body.assignedTo,
        estimatedCost: body.estimatedCost,
        proposalUrl: body.proposalUrl,
        adminNotes: body.adminNotes,
      },
    })

    return NextResponse.json({ inquiry })
  } catch (error) {
    console.error('Error updating inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to update inquiry' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/inquiries/[id] - Delete inquiry
export async function DELETE(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    const { id } = await context.params

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.serviceInquiry.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to delete inquiry' },
      { status: 500 }
    )
  }
}
