import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthInfo } from '@/lib/auth-helper'

import { prisma } from '@/lib/prisma'

// GET /api/admin/blog/posts - List all blog posts
export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)

    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const categoryId = searchParams.get('category')

    let posts: any[] = []

    try {
      const where: any = {}
      if (status && status !== 'all') {
        where.status = status
      }
      if (categoryId && categoryId !== 'all') {
        where.categoryId = categoryId
      }

      posts = await prisma.blogPost.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true },
          },
          author: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch {
      // Model might not exist yet
    }

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    )
  }
}

// POST /api/admin/blog/posts - Create a new blog post
export async function POST(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)

    if (!auth.isAuthorized || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, slug, excerpt, content, categoryId, status, coverImage } = body

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Title, slug, and content are required' },
        { status: 400 }
      )
    }

    try {
      // Check if slug exists
      const existing = await prisma.blogPost.findUnique({
        where: { slug },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'A post with this slug already exists' },
          { status: 400 }
        )
      }

      const post = await prisma.blogPost.create({
        data: {
          title,
          slug,
          excerpt: excerpt || null,
          content,
          categoryId: categoryId || null,
          authorId: auth.userId,
          status: status || 'DRAFT',
          coverImage: coverImage || null,
          publishedAt: status === 'PUBLISHED' ? new Date() : null,
        },
        include: {
          category: {
            select: { id: true, name: true },
          },
          author: {
            select: { name: true, email: true },
          },
        },
      })

      return NextResponse.json(post, { status: 201 })
    } catch {
      return NextResponse.json(
        { error: 'Blog post model not available' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error creating blog post:', error)
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    )
  }
}
