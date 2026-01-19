import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/team/[id] - Get team member details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const teamMember = await prisma.teamMember.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            image: true,
            role: true,
            permissions: true,
            emailAccess: true,
            zohoRefreshToken: true,
            orders: {
              select: {
                id: true,
                orderNumber: true,
                status: true,
                total: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 50,
            },
            _count: {
              select: { orders: true },
            },
          },
        },
        contracts: {
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Calculate payment totals
    const totalPaid = await prisma.teamMemberPayment.aggregate({
      where: { teamMemberId: id, status: 'PAID' },
      _sum: { amount: true },
    })

    // Transform user data to not expose sensitive tokens
    const transformedTeamMember = {
      ...teamMember,
      totalPaid: totalPaid._sum.amount || 0,
      user: teamMember.user ? {
        ...teamMember.user,
        zohoRefreshToken: undefined,
        zohoConnected: !!teamMember.user.zohoRefreshToken,
      } : null,
    }

    return NextResponse.json({
      teamMember: transformedTeamMember,
    })
  } catch (error) {
    console.error('Error fetching team member:', error)
    return NextResponse.json({ error: 'Failed to fetch team member' }, { status: 500 })
  }
}

// PUT /api/admin/team/[id] - Update team member
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()

    const teamMember = await prisma.teamMember.findUnique({
      where: { id },
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    const updateData: any = {}

    // Basic info
    if (body.name !== undefined) updateData.name = body.name
    if (body.workEmail !== undefined) updateData.workEmail = body.workEmail || null
    if (body.phone !== undefined) updateData.phone = body.phone || null
    if (body.address !== undefined) updateData.address = body.address || null
    if (body.dateOfBirth !== undefined) {
      updateData.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null
    }
    if (body.profileImageUrl !== undefined) updateData.profileImageUrl = body.profileImageUrl || null

    // Employment
    if (body.title !== undefined) updateData.title = body.title
    if (body.department !== undefined) updateData.department = body.department || null
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate)
    if (body.endDate !== undefined) {
      updateData.endDate = body.endDate ? new Date(body.endDate) : null
    }
    if (body.status !== undefined) updateData.status = body.status

    // Compensation
    if (body.salaryType !== undefined) updateData.salaryType = body.salaryType
    if (body.salaryAmount !== undefined) {
      updateData.salaryAmount = body.salaryAmount ? parseFloat(body.salaryAmount) : null
    }
    if (body.salaryFrequency !== undefined) updateData.salaryFrequency = body.salaryFrequency || null

    // Equity
    if (body.equityPercentage !== undefined) {
      updateData.equityPercentage = body.equityPercentage ? parseFloat(body.equityPercentage) : null
    }
    if (body.equityNotes !== undefined) updateData.equityNotes = body.equityNotes || null

    // Update team member and optionally update linked user's username
    const updated = await prisma.$transaction(async (tx) => {
      // Update team member
      const teamMemberUpdated = await tx.teamMember.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: { id: true, email: true, username: true },
          },
        },
      })

      // Update linked user fields (username and personalEmail)
      if (teamMemberUpdated.userId) {
        const userUpdateData: any = {}

        // Handle username update
        if (body.username !== undefined) {
          const newUsername = body.username || null
          if (newUsername) {
            const existingUser = await tx.user.findFirst({
              where: {
                username: newUsername,
                NOT: { id: teamMemberUpdated.userId },
              },
            })
            if (existingUser) {
              throw new Error('Username is already taken')
            }
          }
          userUpdateData.username = newUsername
        }

        // Handle personal email update
        if (body.personalEmail !== undefined) {
          const newEmail = body.personalEmail || null
          if (newEmail) {
            const existingUser = await tx.user.findFirst({
              where: {
                email: newEmail,
                NOT: { id: teamMemberUpdated.userId },
              },
            })
            if (existingUser) {
              throw new Error('Email is already taken')
            }
          }
          userUpdateData.email = newEmail
        }

        // Update user if there are changes
        if (Object.keys(userUpdateData).length > 0) {
          const updatedUser = await tx.user.update({
            where: { id: teamMemberUpdated.userId },
            data: userUpdateData,
            select: { id: true, email: true, username: true },
          })

          return {
            ...teamMemberUpdated,
            user: updatedUser,
          }
        }
      }

      return teamMemberUpdated
    })

    return NextResponse.json({ success: true, teamMember: updated })
  } catch (error) {
    console.error('Error updating team member:', error)
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 })
  }
}

// DELETE /api/admin/team/[id] - Delete team member
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only super admins can delete team members' }, { status: 403 })
    }

    const teamMember = await prisma.teamMember.findUnique({
      where: { id },
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    await prisma.teamMember.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting team member:', error)
    return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 })
  }
}
