import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

// PUT /api/admin/customers/segments/[id] - Update a segment
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await req.json()

    // Check if segment exists
    const existing = await prisma.customerSegment.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Segment not found' },
        { status: 404 }
      )
    }

    // Check if name is taken by another segment
    if (body.name && body.name !== existing.name) {
      const nameConflict = await prisma.customerSegment.findUnique({
        where: { name: body.name },
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'A segment with this name already exists' },
          { status: 400 }
        )
      }
    }

    const segment = await prisma.customerSegment.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.conditions !== undefined && { conditions: body.conditions }),
        ...(body.isAutomatic !== undefined && { isAutomatic: body.isAutomatic }),
        ...(body.memberIds !== undefined && { memberIds: body.memberIds }),
      },
    })

    const memberIds = (segment.memberIds as string[]) || []

    return NextResponse.json({
      ...segment,
      memberCount: memberIds.length,
    })
  } catch (error) {
    console.error('Error updating segment:', error)
    return NextResponse.json(
      { error: 'Failed to update segment' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/customers/segments/[id] - Delete a segment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if segment exists
    const existing = await prisma.customerSegment.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Segment not found' },
        { status: 404 }
      )
    }

    const memberIds = (existing.memberIds as string[]) || []

    await prisma.customerSegment.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      memberCount: memberIds.length,
    })
  } catch (error) {
    console.error('Error deleting segment:', error)
    return NextResponse.json(
      { error: 'Failed to delete segment' },
      { status: 500 }
    )
  }
}
