import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/email/signatures/[id] - Get a single signature
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const signature = await prisma.emailSignature.findFirst({
      where: {
        id,
        userId: session.user.id,
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
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { name, content, isDefault, forAddress } = await req.json()

    // Verify ownership
    const existing = await prisma.emailSignature.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Signature not found' }, { status: 404 })
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.emailSignature.updateMany({
        where: {
          userId: session.user.id,
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
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existing = await prisma.emailSignature.findFirst({
      where: {
        id,
        userId: session.user.id,
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
