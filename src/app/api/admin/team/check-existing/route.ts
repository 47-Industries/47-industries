import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/team/check-existing?email=xxx - Check if there's an unlinked team member
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ existingTeamMember: null })
    }

    // Find an unlinked team member with this email
    const existingTeamMember = await prisma.teamMember.findFirst({
      where: {
        email: email,
        userId: null, // Only unlinked team members
      },
      select: {
        id: true,
        employeeNumber: true,
        name: true,
        email: true,
        title: true,
        department: true,
        status: true,
      },
    })

    return NextResponse.json({ existingTeamMember })
  } catch (error) {
    console.error('Error checking for existing team member:', error)
    return NextResponse.json({ error: 'Failed to check' }, { status: 500 })
  }
}
