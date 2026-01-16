import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Find Spark8
  const projects = await prisma.clientProject.findMany({
    where: {
      OR: [
        { name: { contains: 'Spark' } },
        { client: { name: { contains: 'Spark' } } }
      ]
    },
    include: {
      client: true,
      referredByPartner: true
    }
  })
  console.log('=== SPARK8 PROJECT ===')
  console.log(JSON.stringify(projects, null, 2))

  // Get Jesse's partner
  const jesse = await prisma.partner.findFirst({
    where: { name: { contains: 'Jesse' } },
    include: {
      leads: true
    }
  })
  console.log('\n=== JESSE PARTNER ===')
  console.log('ID:', jesse?.id)
  console.log('Partner Number:', jesse?.partnerNumber)
  console.log('Leads count:', jesse?.leads?.length)
  if (jesse?.leads?.length) {
    console.log('Leads:', jesse.leads.map(l => l.businessName))
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
