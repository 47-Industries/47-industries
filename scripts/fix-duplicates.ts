import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('Finding duplicate recurring bills...\n')

  // Get all active recurring bills
  const bills = await prisma.recurringBill.findMany({
    where: { active: true },
    include: {
      instances: {
        select: { id: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  console.log('Active Recurring Bills:')
  bills.forEach(b => {
    console.log(`- ${b.id.slice(0,8)} | ${b.name} | ${b.vendor} | ${b.vendorType} | instances: ${b.instances.length}`)
  })

  // Group by normalized vendor + type
  const groups = new Map<string, typeof bills>()
  for (const bill of bills) {
    const normalized = bill.vendor.toLowerCase().replace(/[^a-z0-9]/g, '')
    const key = `${normalized}:${bill.vendorType}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(bill)
  }

  console.log('\n\nDuplicate Groups:')
  let totalMerged = 0

  for (const [key, group] of groups) {
    if (group.length > 1) {
      console.log(`\n${key}: ${group.length} duplicates`)

      // Keep the one with most instances
      group.sort((a, b) => b.instances.length - a.instances.length)
      const keep = group[0]
      const duplicates = group.slice(1)

      console.log(`  KEEP: ${keep.name} (${keep.instances.length} instances)`)

      for (const dup of duplicates) {
        console.log(`  MERGE: ${dup.name} (${dup.instances.length} instances)`)

        // Migrate instances
        const migrated = await prisma.billInstance.updateMany({
          where: { recurringBillId: dup.id },
          data: { recurringBillId: keep.id }
        })
        console.log(`    - Migrated ${migrated.count} instances`)

        // Deactivate duplicate
        await prisma.recurringBill.update({
          where: { id: dup.id },
          data: { active: false, name: `[MERGED] ${dup.name}` }
        })
        console.log(`    - Deactivated`)
        totalMerged++
      }
    }
  }

  console.log(`\n\nTotal merged: ${totalMerged}`)

  // Now check for duplicate bill instances in the same period
  console.log('\n\nChecking for duplicate bill instances...')

  const instances = await prisma.billInstance.findMany({
    where: { recurringBillId: { not: null } },
    include: { recurringBill: true },
    orderBy: { createdAt: 'asc' }
  })

  const instanceGroups = new Map<string, typeof instances>()
  for (const inst of instances) {
    const key = `${inst.recurringBillId}:${inst.period}`
    if (!instanceGroups.has(key)) instanceGroups.set(key, [])
    instanceGroups.get(key)!.push(inst)
  }

  let instancesMerged = 0
  for (const [key, group] of instanceGroups) {
    if (group.length > 1) {
      console.log(`\nDuplicate instances for ${group[0].recurringBill?.name} period ${group[0].period}:`)

      // Keep first, delete rest
      const keep = group[0]
      const duplicates = group.slice(1)

      console.log(`  KEEP: ${keep.id.slice(0,8)} - $${keep.amount}`)

      for (const dup of duplicates) {
        console.log(`  DELETE: ${dup.id.slice(0,8)} - $${dup.amount}`)

        // Delete splits first
        await prisma.billSplit.deleteMany({
          where: { billInstanceId: dup.id }
        })

        // Delete instance
        await prisma.billInstance.delete({
          where: { id: dup.id }
        })
        instancesMerged++
      }
    }
  }

  console.log(`\n\nTotal duplicate instances deleted: ${instancesMerged}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
