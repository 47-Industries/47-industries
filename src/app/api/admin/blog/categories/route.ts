import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/blog/categories - List all blog categories
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let categories: any[] = []

    try {
      categories = await prisma.blogCategory.findMany({
        include: {
          _count: {
            select: { posts: true },
          },
        },
        orderBy: { name: 'asc' },
      })
    } catch {
      // Model might not exist yet
    }

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching blog categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog categories' },
      { status: 500 }
    )
  }
}

// POST /api/admin/blog/categories - Create a new blog category
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, slug } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    try {
      // Check if slug exists
      const existing = await prisma.blogCategory.findUnique({
        where: { slug },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'A category with this slug already exists' },
          { status: 400 }
        )
      }

      const category = await prisma.blogCategory.create({
        data: { name, slug },
      })

      return NextResponse.json(category, { status: 201 })
    } catch {
      return NextResponse.json(
        { error: 'Blog category model not available' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error creating blog category:', error)
    return NextResponse.json(
      { error: 'Failed to create blog category' },
      { status: 500 }
    )
  }
}
