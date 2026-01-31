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

    // Find admin and super admin users (team members) with their TeamMember data
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
        phone: true,
        // Include TeamMember data for work email
        teamMember: {
          select: {
            workEmail: true,
            phone: true,
            title: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      take: 20,
    })

    // Transform to include work email at top level
    const transformedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      image: user.image || user.teamMember?.profileImageUrl,
      title: user.title || user.teamMember?.title,
      phone: user.phone || user.teamMember?.phone,
      // Prioritize work email from TeamMember
      workEmail: user.teamMember?.workEmail || null,
    }))

    return NextResponse.json({ users: transformedUsers })
  } catch (error) {
    console.error('Error looking up users:', error)
    return NextResponse.json(
      { error: 'Failed to lookup users' },
      { status: 500 }
    )
  }
}
