import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/users/lookup - Search team members for business card creation
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    // Find admin and super admin users (team members)
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            role: {
              in: ['ADMIN', 'SUPER_ADMIN'],
            },
          },
          search
            ? {
                OR: [
                  { name: { contains: search } },
                  { email: { contains: search } },
                  { username: { contains: search } },
                ],
              }
            : {},
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        image: true,
        title: true,
      },
      orderBy: { name: 'asc' },
      take: 20,
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error looking up users:', error)
    return NextResponse.json(
      { error: 'Failed to lookup users' },
      { status: 500 }
    )
  }
}
