import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Get the next lead number
  const date = new Date()
  const timestamp = date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0')
  const count = await prisma.partnerLead.count()
  const leadNumber = `LEAD-${timestamp}-${(count + 1).toString().padStart(4, '0')}`

  // Create the lead for Spark8 (already converted)
  const lead = await prisma.partnerLead.create({
    data: {
      leadNumber,
      partnerId: 'cmkg6d0u6000ulh5j77t8xycl', // Jesse
      businessName: 'Spark8 Smoke Shop & Hookah Lounge',
      contactName: 'Spark8 Owner', // You can update this
      email: 'spark8smokeshop@gmail.com',
      phone: null,
      website: 'https://vape-shop-production.up.railway.app',
      description: 'Full-stack platform development including e-commerce, admin dashboard, and POS system.',
      status: 'CONVERTED',
      clientId: 'cmketuubm0001pf9ogzsmkx9n', // Spark8 client
      projectId: 'cmketuubm0003pf9o8dmilyqx', // Spark8 project
      closedAt: new Date('2026-01-15'), // Around when project started
      notes: 'Retroactively created lead record for existing referred project.',
    },
  })

  console.log('Created lead:', lead.leadNumber)
  console.log('Lead ID:', lead.id)

  // Now create the commission record (50% of $5000 = $2500)
  const commission = await prisma.partnerCommission.create({
    data: {
      partnerId: 'cmkg6d0u6000ulh5j77t8xycl', // Jesse
      leadId: lead.id,
      type: 'FIRST_SALE',
      baseAmount: 5000,
      rate: 50,
      amount: 2500,
      status: 'PENDING', // Or 'PAID' if you've already paid him
    },
  })

  console.log('Created commission:', commission.id)
  console.log('Commission amount: $' + commission.amount)
}

main().catch(console.error).finally(() => prisma.$disconnect())
