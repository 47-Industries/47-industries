import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/migrate-admins - Migrate all admins to team members
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SUPER_ADMIN can run migration
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (currentUser?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only super admins can run this migration' }, { status: 403 })
    }

    // Get all admins (ADMIN and SUPER_ADMIN)
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
      },
      include: {
        teamMember: true, // Check if already linked to a team member
      },
    })

    const results = {
      total: admins.length,
      migrated: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const admin of admins) {
      try {
        // Skip if already has a team member
        if (admin.teamMember) {
          results.skipped++
          continue
        }

        // Generate employee number
        const lastTeamMember = await prisma.teamMember.findFirst({
          orderBy: { employeeNumber: 'desc' },
        })
        const lastNum = lastTeamMember?.employeeNumber
          ? parseInt(lastTeamMember.employeeNumber.replace('EMP', ''))
          : 0
        const employeeNumber = `EMP${String(lastNum + 1 + results.migrated).padStart(4, '0')}`

        // Create team member for this admin
        await prisma.teamMember.create({
          data: {
            employeeNumber,
            name: admin.name || admin.email || 'Unknown',
            email: admin.email || '',
            title: admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin',
            department: 'Administration',
            startDate: admin.createdAt,
            status: 'ACTIVE',
            salaryType: 'NONE',
            userId: admin.id,
          },
        })

        results.migrated++
      } catch (err: any) {
        results.errors.push(`Failed to migrate ${admin.email}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration complete: ${results.migrated} admins migrated, ${results.skipped} skipped (already had team member)`,
      results,
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 })
  }
}

// GET /api/admin/migrate-admins - Check migration status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Count admins without team members
    const adminsWithoutTeamMember = await prisma.user.count({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        teamMember: null,
      },
    })

    const totalAdmins = await prisma.user.count({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
      },
    })

    const totalTeamMembers = await prisma.teamMember.count()

    return NextResponse.json({
      adminsNeedingMigration: adminsWithoutTeamMember,
      totalAdmins,
      totalTeamMembers,
      migrationNeeded: adminsWithoutTeamMember > 0,
    })
  } catch (error) {
    console.error('Check migration status error:', error)
    return NextResponse.json({ error: 'Failed to check migration status' }, { status: 500 })
  }
}
