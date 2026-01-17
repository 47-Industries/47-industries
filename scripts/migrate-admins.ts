import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateAdmins() {
  console.log('Starting admin to team member migration...\n')

  // Get all admins (ADMIN and SUPER_ADMIN) that don't have a team member
  const admins = await prisma.user.findMany({
    where: {
      role: { in: ['ADMIN', 'SUPER_ADMIN'] },
      teamMember: null,
    },
  })

  console.log(`Found ${admins.length} admins without team member records\n`)

  if (admins.length === 0) {
    console.log('No migration needed - all admins already have team member records!')
    return
  }

  let migrated = 0
  let errors: string[] = []

  for (const admin of admins) {
    try {
      // Generate employee number
      const lastTeamMember = await prisma.teamMember.findFirst({
        orderBy: { employeeNumber: 'desc' },
      })
      const lastNum = lastTeamMember?.employeeNumber
        ? parseInt(lastTeamMember.employeeNumber.replace('EMP', '').replace('-', ''))
        : 0
      const employeeNumber = `EMP${String(lastNum + 1).padStart(4, '0')}`

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

      console.log(`  Migrated: ${admin.email} (${admin.role}) -> ${employeeNumber}`)
      migrated++
    } catch (err: any) {
      const errorMsg = `Failed to migrate ${admin.email}: ${err.message}`
      console.error(`  ERROR: ${errorMsg}`)
      errors.push(errorMsg)
    }
  }

  console.log('\n--- Migration Complete ---')
  console.log(`Total admins processed: ${admins.length}`)
  console.log(`Successfully migrated: ${migrated}`)
  console.log(`Errors: ${errors.length}`)

  if (errors.length > 0) {
    console.log('\nErrors:')
    errors.forEach(e => console.log(`  - ${e}`))
  }
}

migrateAdmins()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
