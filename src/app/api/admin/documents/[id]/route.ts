import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminAuthInfo } from '@/lib/auth-helper'
import { deleteFromR2, getR2SignedUrl } from '@/lib/r2'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/admin/documents/[id] - Get single document with signed download URL
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

    const document = await prisma.companyDocument.findUnique({
      where: { id },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Generate a signed download URL valid for 1 hour
    let downloadUrl: string | null = null
    try {
      downloadUrl = await getR2SignedUrl(document.fileKey, 3600)
    } catch {
      // If signed URL generation fails, fall back to stored URL
      downloadUrl = document.fileUrl
    }

    return NextResponse.json({
      ...document,
      downloadUrl,
    })
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/documents/[id] - Update document metadata
export async function PATCH(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await getAdminAuthInfo(req)
    const { id } = await context.params

    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const document = await prisma.companyDocument.findUnique({
      where: { id },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const body = await req.json()
    const {
      name,
      description,
      folderId,
      category,
      tags,
      year,
      teamMemberId,
      visibility,
    } = body

    // Validate folder exists if changing folder
    if (folderId !== undefined && folderId !== null) {
      const folder = await prisma.documentFolder.findUnique({
        where: { id: folderId },
      })
      if (!folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
      }
    }

    // Build update data - only include fields that were provided
    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (folderId !== undefined) updateData.folderId = folderId
    if (category !== undefined) updateData.category = category
    if (tags !== undefined) {
      // Accept tags as array or comma-separated string
      if (Array.isArray(tags)) {
        updateData.tags = tags
      } else if (typeof tags === 'string') {
        updateData.tags = tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      }
    }
    if (year !== undefined) updateData.year = year ? parseInt(year) : null
    if (teamMemberId !== undefined) updateData.teamMemberId = teamMemberId || null
    if (visibility !== undefined) updateData.visibility = visibility

    const updated = await prisma.companyDocument.update({
      where: { id },
      data: updateData,
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/documents/[id] - Delete document and remove from R2
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

    const document = await prisma.companyDocument.findUnique({
      where: { id },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete file from R2
    try {
      await deleteFromR2(document.fileKey)
    } catch (r2Error) {
      console.error('Error deleting file from R2:', r2Error)
      // Continue with database deletion even if R2 delete fails
    }

    // Delete document record
    await prisma.companyDocument.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Document deleted' })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
