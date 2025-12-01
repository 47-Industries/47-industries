import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/blog/posts/[id] - Get a specific blog post
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

    try {
      const post = await prisma.blogPost.findUnique({
        where: { id },
        include: {
          category: {
            select: { id: true, name: true },
          },
          author: {
            select: { name: true, email: true },
          },
        },
      })

      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }

      return NextResponse.json(post)
    } catch {
      return NextResponse.json({ error: 'Blog post model not available' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/blog/posts/[id] - Update a blog post
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    try {
      // Get current post
      const currentPost = await prisma.blogPost.findUnique({
        where: { id },
      })

      if (!currentPost) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }

      // Check if slug is being changed and if new slug already exists
      if (body.slug && body.slug !== currentPost.slug) {
        const existing = await prisma.blogPost.findUnique({
          where: { slug: body.slug },
        })
        if (existing) {
          return NextResponse.json(
            { error: 'A post with this slug already exists' },
            { status: 400 }
          )
        }
      }

      // If status changing to PUBLISHED, set publishedAt
      let publishedAt = currentPost.publishedAt
      if (body.status === 'PUBLISHED' && currentPost.status !== 'PUBLISHED') {
        publishedAt = new Date()
      }

      const post = await prisma.blogPost.update({
        where: { id },
        data: {
          ...(body.title && { title: body.title }),
          ...(body.slug && { slug: body.slug }),
          ...(body.excerpt !== undefined && { excerpt: body.excerpt }),
          ...(body.content && { content: body.content }),
          ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
          ...(body.status && { status: body.status }),
          ...(body.coverImage !== undefined && { coverImage: body.coverImage }),
          publishedAt,
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

      return NextResponse.json(post)
    } catch {
      return NextResponse.json({ error: 'Blog post model not available' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error updating blog post:', error)
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/blog/posts/[id] - Delete a blog post
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

    try {
      await prisma.blogPost.delete({
        where: { id },
      })

      return NextResponse.json({ success: true })
    } catch {
      return NextResponse.json({ error: 'Blog post model not available' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error deleting blog post:', error)
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    )
  }
}
