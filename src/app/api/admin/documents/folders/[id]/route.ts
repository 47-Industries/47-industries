import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminAuthInfo } from '@/lib/auth-helper'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/admin/documents/folders/[id] - Get folder with its documents
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

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const folder = await prisma.documentFolder.findUnique({
      where: { id },
      include: {
        children: {
          include: {
            _count: {
              select: { documents: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { documents: true },
        },
      },
    })

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Fetch documents in this folder with pagination
    const [documents, totalDocuments] = await Promise.all([
      prisma.companyDocument.findMany({
        where: { folderId: id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.companyDocument.count({
        where: { folderId: id },
      }),
    ])

    return NextResponse.json({
      folder,
      documents,
      pagination: {
        page,
        limit,
        total: totalDocuments,
        totalPages: Math.ceil(totalDocuments / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching folder:', error)
    return NextResponse.json(
      { error: 'Failed to fetch folder' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/documents/folders/[id] - Update folder
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

    const folder = await prisma.documentFolder.findUnique({
      where: { id },
    })

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    const body = await req.json()
    const { name, description, parentId, color, icon, sortOrder } = body

    // Prevent circular parent reference
    if (parentId !== undefined) {
      if (parentId === id) {
        return NextResponse.json(
          { error: 'A folder cannot be its own parent' },
          { status: 400 }
        )
      }

      // Check that the new parent is not a descendant of this folder
      if (parentId) {
        const isDescendant = await checkIsDescendant(id, parentId)
        if (isDescendant) {
          return NextResponse.json(
            { error: 'Cannot move a folder into one of its own subfolders' },
            { status: 400 }
          )
        }

        // Validate parent exists
        const parent = await prisma.documentFolder.findUnique({
          where: { id: parentId },
        })
        if (!parent) {
          return NextResponse.json(
            { error: 'Parent folder not found' },
            { status: 404 }
          )
        }
      }
    }

    // Build update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description
    if (parentId !== undefined) updateData.parentId = parentId || null
    if (color !== undefined) updateData.color = color || null
    if (icon !== undefined) updateData.icon = icon || null
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder

    const updated = await prisma.documentFolder.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { documents: true },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating folder:', error)
    return NextResponse.json(
      { error: 'Failed to update folder' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/documents/folders/[id] - Delete folder
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

    const folder = await prisma.documentFolder.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            documents: true,
            children: true,
          },
        },
      },
    })

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Check if folder has children
    if (folder._count.children > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a folder that contains subfolders. Please move or delete subfolders first.' },
        { status: 400 }
      )
    }

    // If folder has documents, move them to the parent folder (or root)
    if (folder._count.documents > 0) {
      await prisma.companyDocument.updateMany({
        where: { folderId: id },
        data: { folderId: folder.parentId },
      })
    }

    await prisma.documentFolder.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Folder deleted',
      documentsMoved: folder._count.documents,
    })
  } catch (error) {
    console.error('Error deleting folder:', error)
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    )
  }
}

// Helper: Check if targetId is a descendant of folderId
async function checkIsDescendant(folderId: string, targetId: string): Promise<boolean> {
  const children = await prisma.documentFolder.findMany({
    where: { parentId: folderId },
    select: { id: true },
  })

  for (const child of children) {
    if (child.id === targetId) return true
    const isDesc = await checkIsDescendant(child.id, targetId)
    if (isDesc) return true
  }

  return false
}
