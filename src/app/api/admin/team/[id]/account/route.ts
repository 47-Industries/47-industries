import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

type Permission = 'products' | 'orders' | 'users' | 'settings' | 'email' | 'custom_requests' | 'analytics' | 'expenses'

// POST /api/admin/team/[id]/account - Create or update user account for team member
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const teamMember = await prisma.teamMember.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    const body = await req.json()
    const {
      action,
      email,
      password,
      username,
      role,
      permissions,
      emailAccess,
    } = body

    // Action: create - Create a new user account for this team member
    if (action === 'create') {
      if (teamMember.userId) {
        return NextResponse.json({ error: 'Team member already has a user account' }, { status: 400 })
      }

      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 })
      }

      // Check username if provided
      if (username) {
        const existingUsername = await prisma.user.findUnique({
          where: { username },
        })
        if (existingUsername) {
          return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create user and link to team member
      const newUser = await prisma.user.create({
        data: {
          email,
          name: teamMember.name,
          username: username || null,
          password: hashedPassword,
          role: role || 'CUSTOMER',
          permissions: permissions || [],
          emailAccess: emailAccess || [],
        },
      })

      await prisma.teamMember.update({
        where: { id },
        data: { userId: newUser.id },
      })

      return NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          username: newUser.username,
          role: newUser.role,
          permissions: newUser.permissions,
          emailAccess: newUser.emailAccess,
        },
      })
    }

    // Action: link - Link an existing user account to this team member
    if (action === 'link') {
      if (teamMember.userId) {
        return NextResponse.json({ error: 'Team member already has a user account' }, { status: 400 })
      }

      const { userId } = body
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
      }

      const userToLink = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!userToLink) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Check if user is already linked to another team member
      const existingTeamMember = await prisma.teamMember.findUnique({
        where: { userId },
      })

      if (existingTeamMember) {
        return NextResponse.json({ error: 'This user is already linked to another team member' }, { status: 400 })
      }

      await prisma.teamMember.update({
        where: { id },
        data: { userId },
      })

      return NextResponse.json({ success: true })
    }

    // Action: unlink - Demote user to CUSTOMER and remove from team member
    if (action === 'unlink') {
      if (!teamMember.userId) {
        return NextResponse.json({ error: 'Team member does not have a user account' }, { status: 400 })
      }

      // Demote user to CUSTOMER role and clear admin permissions
      await prisma.user.update({
        where: { id: teamMember.userId },
        data: {
          role: 'CUSTOMER',
          permissions: [],
          emailAccess: [],
        },
      })

      // Disconnect user from team member
      await prisma.teamMember.update({
        where: { id },
        data: { userId: null },
      })

      return NextResponse.json({ success: true })
    }

    // Action: update - Update the linked user's account settings
    if (action === 'update') {
      if (!teamMember.userId) {
        return NextResponse.json({ error: 'Team member does not have a user account' }, { status: 400 })
      }

      // Permission check: Only SUPER_ADMIN can modify another admin's role
      const targetUser = await prisma.user.findUnique({
        where: { id: teamMember.userId },
        select: { role: true },
      })

      if (role && ['ADMIN', 'SUPER_ADMIN'].includes(targetUser?.role || '') && currentUser.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Only super admins can modify admin roles' }, { status: 403 })
      }

      const updateData: any = {}

      if (role !== undefined) {
        updateData.role = role
      }

      if (permissions !== undefined) {
        // Validate permissions
        const validPermissions: Permission[] = ['products', 'orders', 'users', 'settings', 'email', 'custom_requests', 'analytics', 'expenses']
        const filteredPermissions = (permissions as string[]).filter(p => validPermissions.includes(p as Permission))
        updateData.permissions = filteredPermissions
      }

      if (emailAccess !== undefined) {
        updateData.emailAccess = emailAccess
      }

      if (username !== undefined) {
        if (username) {
          // Check if username is taken by another user
          const existingUsername = await prisma.user.findFirst({
            where: {
              username,
              id: { not: teamMember.userId },
            },
          })
          if (existingUsername) {
            return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
          }
        }
        updateData.username = username || null
      }

      await prisma.user.update({
        where: { id: teamMember.userId },
        data: updateData,
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error managing team member account:', error)
    return NextResponse.json({ error: 'Failed to manage account' }, { status: 500 })
  }
}
