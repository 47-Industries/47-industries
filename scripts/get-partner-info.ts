import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Get Jesse's partner info
  const partner = await prisma.partner.findFirst({
    where: { name: { contains: 'Jesse' } },
    include: { user: true }
  })
  console.log('=== PARTNER (Jesse) ===')
  console.log(JSON.stringify(partner, null, 2))

  // Get company settings
  const settings = await prisma.setting.findMany()
  console.log('\n=== SETTINGS ===')
  console.log(JSON.stringify(settings, null, 2))

  // Get founders/team
  const founders = await prisma.user.findMany({
    where: { isFounder: true },
    select: { name: true, email: true, role: true }
  })
  console.log('\n=== FOUNDERS ===')
  console.log(JSON.stringify(founders, null, 2))

  // Get team members
  const team = await prisma.teamMember.findMany({
    include: { user: { select: { name: true, email: true } } }
  })
  console.log('\n=== TEAM MEMBERS ===')
  console.log(JSON.stringify(team, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
