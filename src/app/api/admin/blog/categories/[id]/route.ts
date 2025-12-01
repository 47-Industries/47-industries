import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/admin/blog/categories/[id] - Delete a blog category
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
      // First, unlink all posts from this category
      await prisma.blogPost.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      })

      // Then delete the category
      await prisma.blogCategory.delete({
        where: { id },
      })

      return NextResponse.json({ success: true })
    } catch {
      return NextResponse.json({ error: 'Blog category model not available' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error deleting blog category:', error)
    return NextResponse.json(
      { error: 'Failed to delete blog category' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/blog/categories/[id] - Update a blog category
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
      // Check if slug is being changed
      if (body.slug) {
        const existing = await prisma.blogCategory.findFirst({
          where: {
            slug: body.slug,
            id: { not: id },
          },
        })
        if (existing) {
          return NextResponse.json(
            { error: 'A category with this slug already exists' },
            { status: 400 }
          )
        }
      }

      const category = await prisma.blogCategory.update({
        where: { id },
        data: {
          ...(body.name && { name: body.name }),
          ...(body.slug && { slug: body.slug }),
        },
      })

      return NextResponse.json(category)
    } catch {
      return NextResponse.json({ error: 'Blog category model not available' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error updating blog category:', error)
    return NextResponse.json(
      { error: 'Failed to update blog category' },
      { status: 500 }
    )
  }
}
