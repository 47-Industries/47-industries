import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/account/team/contracts - Get current team member's contracts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find team member for this user
    const teamMember = await prisma.teamMember.findUnique({
      where: { userId: session.user.id },
      include: {
        contracts: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
    }

    return NextResponse.json({
      teamMember: {
        id: teamMember.id,
        name: teamMember.name,
        employeeNumber: teamMember.employeeNumber,
        title: teamMember.title,
      },
      contracts: teamMember.contracts,
    })
  } catch (error) {
    console.error('Error fetching team contracts:', error)
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 })
  }
}
