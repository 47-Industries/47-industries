import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminAuthInfo } from '@/lib/auth-helper'
import { uploadToR2, generateFileKey, isR2Configured } from '@/lib/r2'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB for documents

// GET /api/admin/documents - List documents with filters
export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)

    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const folderId = searchParams.get('folderId')
    const category = searchParams.get('category')
    const year = searchParams.get('year')
    const teamMemberId = searchParams.get('teamMemberId')
    const search = searchParams.get('search')
    const tags = searchParams.get('tags') // comma-separated
    const visibility = searchParams.get('visibility')

    const skip = (page - 1) * limit

    const where: any = {}

    if (folderId) {
      where.folderId = folderId === 'root' ? null : folderId
    }

    if (category) {
      where.category = category
    }

    if (year) {
      where.year = parseInt(year)
    }

    if (teamMemberId) {
      where.teamMemberId = teamMemberId
    }

    if (visibility) {
      where.visibility = visibility
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { fileName: { contains: search } },
      ]
    }

    if (tags) {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
      if (tagList.length > 0) {
        // For JSON array stored tags, use string_contains for each tag
        where.AND = tagList.map(tag => ({
          tags: { string_contains: tag },
        }))
      }
    }

    const [documents, total] = await Promise.all([
      prisma.companyDocument.findMany({
        where,
        include: {
          folder: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.companyDocument.count({ where }),
    ])

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

// POST /api/admin/documents - Upload and create document
export async function POST(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)

    if (!auth.isAuthorized || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isR2Configured) {
      return NextResponse.json(
        { error: 'File storage not configured. Please set up Cloudflare R2.' },
        { status: 500 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const name = formData.get('name') as string | null
    const description = formData.get('description') as string | null
    const folderId = formData.get('folderId') as string | null
    const category = formData.get('category') as string | null
    const tagsRaw = formData.get('tags') as string | null
    const yearRaw = formData.get('year') as string | null
    const teamMemberId = formData.get('teamMemberId') as string | null
    const visibility = formData.get('visibility') as string || 'ADMIN'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      )
    }

    // Validate folder exists if provided
    if (folderId) {
      const folder = await prisma.documentFolder.findUnique({
        where: { id: folderId },
      })
      if (!folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
      }
    }

    // Parse tags
    const tags = tagsRaw
      ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
      : []

    // Parse year
    const year = yearRaw ? parseInt(yearRaw) : null

    // Upload file to R2
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileKey = generateFileKey(file.name, 'documents')
    const fileUrl = await uploadToR2(fileKey, buffer, file.type)

    // Create document record
    const document = await prisma.companyDocument.create({
      data: {
        name: name || file.name,
        description,
        folderId: folderId || null,
        fileUrl,
        fileKey,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        category: category || null,
        tags: tags.length > 0 ? tags : undefined,
        year,
        teamMemberId: teamMemberId || null,
        visibility,
        uploadedBy: auth.userId,
      },
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

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
}
