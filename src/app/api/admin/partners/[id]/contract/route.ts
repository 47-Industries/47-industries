import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/partners/[id]/contract - Get partner contract
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

    const contract = await prisma.partnerContract.findUnique({
      where: { partnerId: id },
    })

    return NextResponse.json({ contract })
  } catch (error) {
    console.error('Error fetching contract:', error)
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 })
  }
}

// POST /api/admin/partners/[id]/contract - Create or update partner contract
export async function POST(
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

    // Check if partner exists
    const partner = await prisma.partner.findUnique({
      where: { id },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    // Upsert contract (create or update)
    const contract = await prisma.partnerContract.upsert({
      where: { partnerId: id },
      create: {
        partnerId: id,
        title: body.title,
        description: body.description,
        fileUrl: body.fileUrl,
        status: body.status || 'DRAFT',
        signedAt: body.status === 'SIGNED' ? new Date() : null,
      },
      update: {
        title: body.title,
        description: body.description,
        fileUrl: body.fileUrl,
        status: body.status,
        signedAt: body.status === 'SIGNED' && body.signedAt === undefined
          ? new Date()
          : body.signedAt || undefined,
      },
    })

    return NextResponse.json({ success: true, contract })
  } catch (error) {
    console.error('Error saving contract:', error)
    return NextResponse.json({ error: 'Failed to save contract' }, { status: 500 })
  }
}

// DELETE /api/admin/partners/[id]/contract - Delete partner contract
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

    await prisma.partnerContract.delete({
      where: { partnerId: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting contract:', error)
    return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 })
  }
}
