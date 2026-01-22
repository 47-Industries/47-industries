import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixVariableRecurring() {
  console.log('Analyzing recurring bills for variable amounts...\n')

  // Get all recurring bills with their bill instances
  const recurringBills = await prisma.recurringBill.findMany({
    where: { active: true },
    include: {
      instances: {
        orderBy: { dueDate: 'desc' },
        take: 10
      }
    }
  })

  console.log(`Found ${recurringBills.length} active recurring bills\n`)

  const shouldBeVariable: { id: string; name: string; amounts: number[]; currentType: string }[] = []
  const alreadyVariable: string[] = []
  const fixed: string[] = []

  for (const recurring of recurringBills) {
    const amounts = recurring.instances
      .map((bi: { amount: any }) => Number(bi.amount))
      .filter((a: number) => a > 0)

    if (amounts.length === 0) {
      console.log(`${recurring.name}: No bill instances yet`)
      continue
    }

    // Check if amounts vary (more than 1% difference)
    const uniqueAmounts = [...new Set(amounts.map((a: number) => a.toFixed(2)))]
    const hasVariance = uniqueAmounts.length > 1

    if (recurring.amountType === 'VARIABLE') {
      alreadyVariable.push(recurring.name)
      console.log(`${recurring.name}: Already VARIABLE (${uniqueAmounts.length} unique amounts)`)
    } else if (hasVariance) {
      shouldBeVariable.push({
        id: recurring.id,
        name: recurring.name,
        amounts,
        currentType: recurring.amountType
      })
      console.log(`${recurring.name}: Should be VARIABLE - has ${uniqueAmounts.length} different amounts: ${uniqueAmounts.join(', ')}`)
    } else {
      fixed.push(recurring.name)
      console.log(`${recurring.name}: Correctly FIXED at $${amounts[0]}`)
    }
  }

  console.log('\n--- Summary ---')
  console.log(`Already VARIABLE: ${alreadyVariable.length}`)
  console.log(`Correctly FIXED: ${fixed.length}`)
  console.log(`Should be VARIABLE: ${shouldBeVariable.length}`)

  if (shouldBeVariable.length > 0) {
    console.log('\n--- Updating to VARIABLE ---')
    for (const item of shouldBeVariable) {
      await prisma.recurringBill.update({
        where: { id: item.id },
        data: {
          amountType: 'VARIABLE',
          fixedAmount: null
        }
      })
      console.log(`Updated ${item.name} to VARIABLE`)
    }
    console.log(`\nUpdated ${shouldBeVariable.length} recurring bills to VARIABLE`)
  }

  // Also check for income-related recurring bills (like Wix payouts)
  console.log('\n--- Checking for potential income recurring bills ---')
  const incomeKeywords = ['payout', 'payment', 'deposit', 'income', 'revenue', 'wix', 'stripe']

  for (const recurring of recurringBills) {
    const lowerName = recurring.name.toLowerCase()
    const lowerVendor = (recurring.vendor || '').toLowerCase()

    const isIncome = incomeKeywords.some(kw => lowerName.includes(kw) || lowerVendor.includes(kw))

    if (isIncome) {
      console.log(`Potential income: ${recurring.name} (${recurring.amountType})`)
    }
  }

  await prisma.$disconnect()
}

fixVariableRecurring().catch(console.error)
