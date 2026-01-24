import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('All Frontier bill instances:\n')

  const instances = await prisma.billInstance.findMany({
    where: {
      OR: [
        { vendor: { contains: 'Frontier' } },
        { vendor: { contains: 'frontier' } },
        { vendor: { contains: 'WiFi' } },
        { vendor: { contains: 'wifi' } }
      ]
    },
    include: {
      recurringBill: { select: { name: true, active: true } }
    },
    orderBy: { dueDate: 'desc' }
  })

  console.log(`Found ${instances.length} Frontier instances:\n`)

  for (const inst of instances) {
    const dueDate = inst.dueDate ? inst.dueDate.toISOString().slice(0,10) : 'no date'
    console.log(`${inst.id} | ${inst.vendor.padEnd(20)} | $${String(inst.amount).padStart(8)} | ${dueDate} | period: ${inst.period || 'none'} | recurringId: ${inst.recurringBillId || 'ORPHAN'}`)
  }

  // Also check all January bills regardless of vendor
  console.log('\n\n--- All January 2026 bills (broader search) ---\n')

  const allJan = await prisma.billInstance.findMany({
    where: {
      dueDate: { gte: new Date('2026-01-01'), lt: new Date('2026-02-01') }
    },
    orderBy: { dueDate: 'asc' }
  })

  console.log(`Found ${allJan.length} total January bills:`)
  for (const inst of allJan) {
    const dueDate = inst.dueDate ? inst.dueDate.toISOString().slice(0,10) : 'no date'
    console.log(`${inst.id.slice(0,8)} | ${inst.vendor.padEnd(30)} | $${String(inst.amount).padStart(8)} | ${dueDate}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
