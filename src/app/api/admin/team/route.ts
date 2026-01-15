import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/team - List all team members
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const department = searchParams.get('department')

    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (department && department !== 'all') {
      where.department = department
    }

    const teamMembers = await prisma.teamMember.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        _count: {
          select: {
            contracts: true,
            documents: true,
            payments: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    })

    // Get stats
    const stats = {
      total: await prisma.teamMember.count(),
      active: await prisma.teamMember.count({ where: { status: 'ACTIVE' } }),
      totalPayments: await prisma.teamMemberPayment.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
    }

    return NextResponse.json({
      teamMembers,
      stats: {
        ...stats,
        totalPayments: stats.totalPayments._sum.amount || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
  }
}

// POST /api/admin/team - Create a new team member
export async function POST(req: NextRequest) {
  try {
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

    if (!body.name || !body.email || !body.title || !body.startDate) {
      return NextResponse.json(
        { error: 'Name, email, title, and start date are required' },
        { status: 400 }
      )
    }

    // Generate employee number
    const count = await prisma.teamMember.count()
    const employeeNumber = `EMP-${(count + 1).toString().padStart(3, '0')}`

    // Check if a user with this email exists; if so, link them
    let userId: string | undefined
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
      select: { id: true, teamMember: true },
    })

    if (existingUser) {
      if (existingUser.teamMember) {
        return NextResponse.json(
          { error: 'This user is already a team member' },
          { status: 400 }
        )
      }
      userId = existingUser.id
    } else {
      // Create a user account for this team member
      const newUser = await prisma.user.create({
        data: {
          email: body.email,
          name: body.name,
          role: 'ADMIN', // Team members get admin access
        },
      })
      userId = newUser.id
    }

    const teamMember = await prisma.teamMember.create({
      data: {
        employeeNumber,
        userId,
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        address: body.address || null,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        title: body.title,
        department: body.department || null,
        startDate: new Date(body.startDate),
        status: 'ACTIVE',
        salaryType: body.salaryType || 'SALARY',
        salaryAmount: body.salaryAmount ? parseFloat(body.salaryAmount) : null,
        salaryFrequency: body.salaryFrequency || null,
        equityPercentage: body.equityPercentage ? parseFloat(body.equityPercentage) : null,
        equityNotes: body.equityNotes || null,
      },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    })

    return NextResponse.json({ success: true, teamMember })
  } catch (error) {
    console.error('Error creating team member:', error)
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
  }
}
