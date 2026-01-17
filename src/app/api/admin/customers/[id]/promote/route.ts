import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/customers/[id]/promote - Promote customer to team member
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

    // Get the customer
    const customer = await prisma.user.findUnique({
      where: { id },
      include: { teamMember: true },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    if (customer.teamMember) {
      return NextResponse.json({ error: 'This user is already a team member' }, { status: 400 })
    }

    const body = await req.json()
    const { title, department, grantAdminAccess } = body

    if (!title) {
      return NextResponse.json({ error: 'Job title is required' }, { status: 400 })
    }

    // Generate employee number
    const lastTeamMember = await prisma.teamMember.findFirst({
      orderBy: { employeeNumber: 'desc' },
    })
    const lastNum = lastTeamMember?.employeeNumber
      ? parseInt(lastTeamMember.employeeNumber.replace('EMP', '').replace('-', ''))
      : 0
    const employeeNumber = `EMP${String(lastNum + 1).padStart(4, '0')}`

    // Create team member and optionally update role in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create team member
      const teamMember = await tx.teamMember.create({
        data: {
          employeeNumber,
          name: customer.name || customer.email || 'Unknown',
          email: customer.email || '',
          title,
          department: department || null,
          startDate: new Date(),
          status: 'ACTIVE',
          salaryType: 'NONE',
          userId: customer.id,
        },
      })

      // Update user role if granting admin access
      if (grantAdminAccess) {
        await tx.user.update({
          where: { id: customer.id },
          data: { role: 'ADMIN' },
        })
      }

      return teamMember
    })

    return NextResponse.json({
      success: true,
      teamMemberId: result.id,
      message: `${customer.name || customer.email} has been promoted to team member${grantAdminAccess ? ' with admin access' : ''}`,
    })
  } catch (error) {
    console.error('Error promoting customer:', error)
    return NextResponse.json({ error: 'Failed to promote customer' }, { status: 500 })
  }
}
