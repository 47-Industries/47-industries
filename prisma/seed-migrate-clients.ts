import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting client migration...')
  console.log('')

  // 1. Migrate accepted/completed inquiries to clients
  console.log('=== Migrating accepted inquiries to clients ===')

  const inquiriesToMigrate = await prisma.serviceInquiry.findMany({
    where: {
      status: {
        in: ['ACCEPTED', 'COMPLETED', 'IN_PROGRESS'],
      },
    },
    include: {
      invoices: true,
    },
  })

  console.log(`Found ${inquiriesToMigrate.length} inquiries to migrate`)

  let migratedCount = 0
  let skippedCount = 0

  for (const inquiry of inquiriesToMigrate) {
    // Check if already converted
    const existingClient = await prisma.client.findUnique({
      where: { inquiryId: inquiry.id },
    })

    if (existingClient) {
      console.log(`  - Skipping ${inquiry.inquiryNumber} (already converted to ${existingClient.clientNumber})`)
      skippedCount++
      continue
    }

    // Generate client number
    const date = new Date()
    const timestamp = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0')
    const count = await prisma.client.count()
    const clientNumber = `CLI-${timestamp}-${(count + 1).toString().padStart(4, '0')}`

    // Determine client type based on inquiry status
    const clientType = inquiry.status === 'COMPLETED' ? 'PAST' : 'ACTIVE'

    // Create the client
    const client = await prisma.client.create({
      data: {
        clientNumber,
        name: inquiry.company || inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone || null,
        website: inquiry.website || null,
        type: clientType,
        source: 'INQUIRY',
        inquiryId: inquiry.id,
        // Create primary contact
        contacts: {
          create: {
            name: inquiry.name,
            email: inquiry.email,
            phone: inquiry.phone || null,
            isPrimary: true,
          },
        },
        // Create project from inquiry
        projects: {
          create: {
            name: `${inquiry.company || inquiry.name} - ${inquiry.serviceType.replace('_', ' ')}`,
            description: inquiry.description,
            type: inquiry.serviceType,
            status: inquiry.status === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE',
            contractValue: inquiry.estimatedCost || null,
            inquiryId: inquiry.id,
          },
        },
      },
    })

    // Link existing invoices to the new client
    if (inquiry.invoices.length > 0) {
      await prisma.invoice.updateMany({
        where: { inquiryId: inquiry.id },
        data: { clientId: client.id },
      })
      console.log(`    - Linked ${inquiry.invoices.length} invoice(s) to client`)
    }

    // Calculate and update revenue
    const paidInvoices = inquiry.invoices.filter(inv => inv.status === 'PAID')
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.total), 0)
    const outstandingInvoices = inquiry.invoices.filter(inv => ['SENT', 'VIEWED', 'OVERDUE'].includes(inv.status))
    const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + Number(inv.total), 0)

    if (totalRevenue > 0 || totalOutstanding > 0) {
      await prisma.client.update({
        where: { id: client.id },
        data: {
          totalRevenue,
          totalOutstanding,
        },
      })
    }

    // Update inquiry status
    await prisma.serviceInquiry.update({
      where: { id: inquiry.id },
      data: {
        status: 'CONVERTED',
        adminNotes: inquiry.adminNotes
          ? `${inquiry.adminNotes}\n\nMigrated to Client: ${clientNumber}`
          : `Migrated to Client: ${clientNumber}`,
      },
    })

    // Log activity
    await prisma.clientActivity.create({
      data: {
        clientId: client.id,
        type: 'STATUS_CHANGE',
        description: `Client created from inquiry ${inquiry.inquiryNumber} (migration)`,
      },
    })

    console.log(`  + Created client ${clientNumber} from ${inquiry.inquiryNumber}`)
    migratedCount++
  }

  console.log('')
  console.log(`Migration complete: ${migratedCount} migrated, ${skippedCount} skipped`)
  console.log('')

  // 2. Create Spark8 client if not exists
  console.log('=== Creating Spark8 client ===')

  const spark8Inquiry = await prisma.serviceInquiry.findFirst({
    where: {
      OR: [
        { inquiryNumber: 'SVC-SPARK8-001' },
        { name: { contains: 'Spark8' } },
      ],
    },
    include: {
      invoices: true,
    },
  })

  if (spark8Inquiry) {
    const existingSpark8 = await prisma.client.findUnique({
      where: { inquiryId: spark8Inquiry.id },
    })

    if (existingSpark8) {
      console.log(`Spark8 already exists as client: ${existingSpark8.clientNumber}`)
    } else {
      // Generate client number
      const date = new Date()
      const timestamp = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0')
      const count = await prisma.client.count()
      const clientNumber = `CLI-${timestamp}-${(count + 1).toString().padStart(4, '0')}`

      const spark8Client = await prisma.client.create({
        data: {
          clientNumber,
          name: 'Spark8 Smoke Shop & Hookah Lounge',
          email: 'spark8smokeshop@gmail.com',
          website: 'https://vape-shop-production.up.railway.app',
          industry: 'Smoke Shop / Retail',
          type: 'ACTIVE',
          source: 'INQUIRY',
          inquiryId: spark8Inquiry.id,
          contacts: {
            create: {
              name: spark8Inquiry.name,
              email: spark8Inquiry.email,
              phone: spark8Inquiry.phone || null,
              role: 'Owner',
              isPrimary: true,
            },
          },
          projects: {
            create: {
              name: 'Spark8 Platform Development',
              description: spark8Inquiry.description,
              type: 'WEB_DEVELOPMENT',
              status: 'ACTIVE',
              contractValue: 5000,
              monthlyRecurring: 100,
              productionUrl: 'https://vape-shop-production.up.railway.app',
              inquiryId: spark8Inquiry.id,
            },
          },
        },
      })

      // Link invoices
      if (spark8Inquiry.invoices.length > 0) {
        await prisma.invoice.updateMany({
          where: { inquiryId: spark8Inquiry.id },
          data: { clientId: spark8Client.id },
        })
      }

      // Update inquiry
      await prisma.serviceInquiry.update({
        where: { id: spark8Inquiry.id },
        data: {
          status: 'CONVERTED',
          adminNotes: spark8Inquiry.adminNotes
            ? `${spark8Inquiry.adminNotes}\n\nMigrated to Client: ${clientNumber}`
            : `Migrated to Client: ${clientNumber}`,
        },
      })

      console.log(`Created Spark8 client: ${clientNumber}`)
    }
  } else {
    console.log('Spark8 inquiry not found - run seed-spark8.ts first if needed')
  }

  console.log('')
  console.log('=== Summary ===')

  const totalClients = await prisma.client.count()
  const activeClients = await prisma.client.count({ where: { type: 'ACTIVE' } })
  const totalProjects = await prisma.clientProject.count()

  console.log(`Total clients: ${totalClients}`)
  console.log(`Active clients: ${activeClients}`)
  console.log(`Total projects: ${totalProjects}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
