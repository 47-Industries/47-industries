import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const teamBios = [
  {
    name: 'Kyle',
    title: 'President',
    publicBio: 'Taught himself to code with AI in 2025. Leads all development across MotoRev, BookFade, and 47 Industries.',
    accentColor: 'blue',
    displayOrder: 1,
  },
  {
    name: 'Dean',
    title: 'Chief Executive Officer',
    publicBio: "Stepped up to lead 47 Industries after Bryce's passing. Keeps the team united and the mission on track.",
    accentColor: 'emerald',
    displayOrder: 2,
  },
  {
    name: 'Wesley',
    title: 'Chief Product Officer',
    publicBio: 'Oversees physical operations, product manufacturing, maintenance, and R&D. The hands that build what we design.',
    accentColor: 'purple',
    displayOrder: 3,
  },
  {
    name: 'Dylan',
    title: 'Executive Chairman',
    publicBio: 'Joined full-time when all four brothers moved under one roof in May 2025. The final piece of the team.',
    accentColor: 'orange',
    displayOrder: 4,
  },
]

async function main() {
  console.log('Populating team bios...\n')

  for (const bio of teamBios) {
    // Find team member by name (case-insensitive partial match)
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        name: {
          contains: bio.name,
        },
        status: 'ACTIVE',
      },
    })

    if (teamMember) {
      await prisma.teamMember.update({
        where: { id: teamMember.id },
        data: {
          showOnAbout: true,
          publicBio: bio.publicBio,
          accentColor: bio.accentColor,
          displayOrder: bio.displayOrder,
        },
      })
      console.log(`Updated ${teamMember.name} (${teamMember.employeeNumber})`)
      console.log(`  - Bio: ${bio.publicBio.substring(0, 50)}...`)
      console.log(`  - Color: ${bio.accentColor}, Order: ${bio.displayOrder}`)
      console.log('')
    } else {
      console.log(`Could not find team member matching "${bio.name}"`)
    }
  }

  console.log('Done!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
