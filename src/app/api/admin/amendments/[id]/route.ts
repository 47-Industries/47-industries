import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/amendments/[id] - Get single amendment
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const amendment = await prisma.contractAmendment.findUnique({
      where: { id },
      include: {
        clientContract: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                clientNumber: true,
              },
            },
          },
        },
        partnerContract: {
          include: {
            partner: {
              select: {
                id: true,
                name: true,
                email: true,
                partnerNumber: true,
              },
            },
          },
        },
      },
    })

    if (!amendment) {
      return NextResponse.json({ error: 'Amendment not found' }, { status: 404 })
    }

    return NextResponse.json({ amendment })
  } catch (error) {
    console.error('Error fetching amendment:', error)
    return NextResponse.json({ error: 'Failed to fetch amendment' }, { status: 500 })
  }
}

// PUT /api/admin/amendments/[id] - Update amendment
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    // Check if amendment exists and can be updated
    const existing = await prisma.contractAmendment.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Amendment not found' }, { status: 404 })
    }

    // Only allow updates if still in DRAFT status
    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only edit amendments in DRAFT status' },
        { status: 400 }
      )
    }

    const amendment = await prisma.contractAmendment.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        additionalValue: body.additionalValue,
        additionalMonthlyValue: body.additionalMonthlyValue,
        effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
      },
      include: {
        clientContract: {
          include: {
            client: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        partnerContract: {
          include: {
            partner: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    })

    return NextResponse.json({ success: true, amendment })
  } catch (error) {
    console.error('Error updating amendment:', error)
    return NextResponse.json({ error: 'Failed to update amendment' }, { status: 500 })
  }
}

// DELETE /api/admin/amendments/[id] - Delete amendment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if amendment exists
    const existing = await prisma.contractAmendment.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Amendment not found' }, { status: 404 })
    }

    // Only allow deletion if in DRAFT status
    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only delete amendments in DRAFT status' },
        { status: 400 }
      )
    }

    await prisma.contractAmendment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting amendment:', error)
    return NextResponse.json({ error: 'Failed to delete amendment' }, { status: 500 })
  }
}
