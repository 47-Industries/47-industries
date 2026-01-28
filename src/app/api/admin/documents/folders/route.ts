import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminAuthInfo } from '@/lib/auth-helper'

interface FolderNode {
  id: string
  name: string
  description: string | null
  parentId: string | null
  color: string | null
  icon: string | null
  sortOrder: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
  _count: {
    documents: number
  }
  children: FolderNode[]
}

// Build tree structure from flat list of folders
function buildFolderTree(folders: any[]): FolderNode[] {
  const folderMap = new Map<string, FolderNode>()
  const roots: FolderNode[] = []

  // First pass: create all nodes
  for (const folder of folders) {
    folderMap.set(folder.id, {
      ...folder,
      children: [],
    })
  }

  // Second pass: build tree
  for (const folder of folders) {
    const node = folderMap.get(folder.id)!
    if (folder.parentId && folderMap.has(folder.parentId)) {
      folderMap.get(folder.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Sort children by sortOrder
  function sortChildren(nodes: FolderNode[]) {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder)
    for (const node of nodes) {
      sortChildren(node.children)
    }
  }

  sortChildren(roots)
  return roots
}

// GET /api/admin/documents/folders - List all folders as tree structure
export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)

    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const flat = searchParams.get('flat') === 'true'

    const folders = await prisma.documentFolder.findMany({
      include: {
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    if (flat) {
      return NextResponse.json({ folders })
    }

    const tree = buildFolderTree(folders)
    return NextResponse.json({ folders: tree })
  } catch (error) {
    console.error('Error fetching folders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    )
  }
}

// POST /api/admin/documents/folders - Create a folder
export async function POST(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)

    if (!auth.isAuthorized || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, parentId, color, icon } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      )
    }

    // Validate parent folder exists if provided
    if (parentId) {
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

    // Get next sort order for siblings
    const maxSort = await prisma.documentFolder.findFirst({
      where: { parentId: parentId || null },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const folder = await prisma.documentFolder.create({
      data: {
        name: name.trim(),
        description: description || null,
        parentId: parentId || null,
        color: color || null,
        icon: icon || null,
        sortOrder: (maxSort?.sortOrder ?? -1) + 1,
        createdBy: auth.userId,
      },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    })

    return NextResponse.json(folder, { status: 201 })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    )
  }
}
