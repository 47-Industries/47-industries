import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth, getAdminAuthInfo } from '@/lib/auth-helper'

// GET /api/admin/contracts/[id]
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

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        client: true,
        project: true,
      },
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    return NextResponse.json({ contract })
  } catch (error) {
    console.error('Error fetching contract:', error)
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 })
  }
}

// PUT /api/admin/contracts/[id] - Update contract
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
    const auth = await getAdminAuthInfo(req)

    // Get current contract for status change logging
    const currentContract = await prisma.contract.findUnique({
      where: { id },
      select: { status: true, title: true, clientId: true },
    })

    if (!currentContract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    const contract = await prisma.contract.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        fileUrl: body.fileUrl,
        externalUrl: body.externalUrl,
        totalValue: body.totalValue,
        monthlyValue: body.monthlyValue,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        status: body.status,
        signedAt: body.status === 'SIGNED' && currentContract.status !== 'SIGNED'
          ? new Date()
          : undefined,
      },
      include: {
        client: true,
        project: true,
      },
    })

    // Log status change if changed
    if (currentContract.status !== body.status && body.status) {
      await prisma.clientActivity.create({
        data: {
          clientId: currentContract.clientId,
          type: body.status === 'SIGNED' ? 'CONTRACT_SIGNED' : 'CONTRACT_SENT',
          description: `Contract "${currentContract.title}" status changed to ${body.status}`,
          performedBy: auth.userId,
        },
      })
    }

    return NextResponse.json({ success: true, contract })
  } catch (error) {
    console.error('Error updating contract:', error)
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 })
  }
}

// DELETE /api/admin/contracts/[id]
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

    await prisma.contract.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting contract:', error)
    return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 })
  }
}
