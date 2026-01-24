import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('Bill instances for January 2026:\n')

  const instances = await prisma.billInstance.findMany({
    where: {
      OR: [
        { period: '2026-01' },
        { dueDate: { gte: new Date('2026-01-01'), lt: new Date('2026-02-01') } }
      ]
    },
    include: {
      recurringBill: { select: { name: true, vendor: true } }
    },
    orderBy: { dueDate: 'asc' }
  })

  console.log(`Found ${instances.length} bill instances:\n`)

  for (const inst of instances) {
    const dueDate = inst.dueDate ? inst.dueDate.toISOString().slice(0,10) : 'no date'
    console.log(`${inst.id.slice(0,8)} | ${inst.vendor.padEnd(30)} | $${String(inst.amount).padStart(8)} | ${dueDate} | ${inst.period || 'no period'} | recurring: ${inst.recurringBill?.name || 'NONE'}`)
  }

  // Find any that look like duplicates (same vendor, same period)
  console.log('\n\nPotential duplicates (same vendor, same month):')
  const byVendorPeriod = new Map<string, typeof instances>()
  for (const inst of instances) {
    const key = `${inst.vendor.toLowerCase().replace(/[^a-z0-9]/g, '')}:${inst.period || inst.dueDate?.toISOString().slice(0,7)}`
    if (!byVendorPeriod.has(key)) byVendorPeriod.set(key, [])
    byVendorPeriod.get(key)!.push(inst)
  }

  for (const [key, group] of byVendorPeriod) {
    if (group.length > 1) {
      console.log(`\n${key}:`)
      for (const inst of group) {
        console.log(`  - ${inst.id.slice(0,8)} | $${inst.amount} | ${inst.dueDate?.toISOString().slice(0,10)} | recurring: ${inst.recurringBillId?.slice(0,8) || 'none'}`)
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
