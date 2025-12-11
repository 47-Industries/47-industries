import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthInfo } from '@/lib/auth-helper'

import { prisma } from '@/lib/prisma'

// GET /api/admin/email/signatures/[id] - Get a single signature
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAdminAuthInfo(req)
    if (!auth.isAuthorized || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const signature = await prisma.emailSignature.findFirst({
      where: {
        id,
        userId: auth.userId,
      },
    })

    if (!signature) {
      return NextResponse.json({ error: 'Signature not found' }, { status: 404 })
    }

    return NextResponse.json({ signature })
  } catch (error) {
    console.error('Error fetching signature:', error)
    return NextResponse.json({ error: 'Failed to fetch signature' }, { status: 500 })
  }
}

// PUT /api/admin/email/signatures/[id] - Update a signature
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAdminAuthInfo(req)
    if (!auth.isAuthorized || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { name, content, isDefault, forAddress } = await req.json()

    // Verify ownership
    const existing = await prisma.emailSignature.findFirst({
      where: {
        id,
        userId: auth.userId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Signature not found' }, { status: 404 })
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.emailSignature.updateMany({
        where: {
          userId: auth.userId,
          isDefault: true,
          id: { not: id },
          ...(forAddress ? { forAddress } : {}),
        },
        data: { isDefault: false },
      })
    }

    const signature = await prisma.emailSignature.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(content !== undefined && { content }),
        ...(isDefault !== undefined && { isDefault }),
        ...(forAddress !== undefined && { forAddress }),
      },
    })

    return NextResponse.json({ signature, success: true })
  } catch (error) {
    console.error('Error updating signature:', error)
    return NextResponse.json({ error: 'Failed to update signature' }, { status: 500 })
  }
}

// DELETE /api/admin/email/signatures/[id] - Delete a signature
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAdminAuthInfo(req)
    if (!auth.isAuthorized || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existing = await prisma.emailSignature.findFirst({
      where: {
        id,
        userId: auth.userId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Signature not found' }, { status: 404 })
    }

    await prisma.emailSignature.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting signature:', error)
    return NextResponse.json({ error: 'Failed to delete signature' }, { status: 500 })
  }
}
