import { prisma } from './prisma'

interface Transaction {
  id: string
  financialAccountId: string
  amount: number | { toNumber(): number }
  description: string | null
  merchantName: string | null
  approvalStatus?: string
}

/**
 * Apply all skip rules to a single transaction.
 * Returns the matching rule if one was applied, null otherwise.
 */
export async function applySkipRulesToTransaction(transaction: Transaction): Promise<any | null> {
  // Don't process already processed transactions
  if (transaction.approvalStatus && transaction.approvalStatus !== 'PENDING') {
    return null
  }

  // Get all active skip rules
  const rules = await prisma.transactionSkipRule.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  })

  const amount = typeof transaction.amount === 'number'
    ? transaction.amount
    : transaction.amount.toNumber()
  const description = (transaction.description || '').toLowerCase()
  const merchantName = (transaction.merchantName || '').toLowerCase()

  for (const rule of rules) {
    let matches = false

    if (rule.ruleType === 'ACCOUNT') {
      // Match by account
      matches = rule.financialAccountId === transaction.financialAccountId
    } else if (rule.ruleType === 'VENDOR_AMOUNT') {
      // Match by vendor pattern AND amount (with variance)
      const pattern = (rule.vendorPattern || '').toLowerCase()
      const patternMatches = description.includes(pattern) || merchantName.includes(pattern)

      if (patternMatches && rule.amount) {
        const ruleAmount = Number(rule.amount)
        const variance = rule.amountVariance || 5
        const minAmount = ruleAmount * (1 - variance / 100)
        const maxAmount = ruleAmount * (1 + variance / 100)
        matches = Math.abs(amount) >= minAmount && Math.abs(amount) <= maxAmount
      }
    } else if (rule.ruleType === 'DESCRIPTION_PATTERN') {
      // Match by description pattern only
      const pattern = (rule.descriptionPattern || '').toLowerCase()
      matches = description.includes(pattern) || merchantName.includes(pattern)
    } else if (rule.ruleType === 'VENDOR') {
      // Match by vendor pattern only (no amount check)
      const pattern = (rule.vendorPattern || '').toLowerCase()
      matches = description.includes(pattern) || merchantName.includes(pattern)
    } else if (rule.ruleType === 'AMOUNT_RANGE') {
      // Match by amount range
      const min = rule.amountMin ? Number(rule.amountMin) : 0
      const max = rule.amountMax ? Number(rule.amountMax) : Infinity
      matches = Math.abs(amount) >= min && Math.abs(amount) <= max
    }

    if (matches) {
      // Apply the rule
      await prisma.stripeTransaction.update({
        where: { id: transaction.id },
        data: {
          approvalStatus: 'SKIPPED',
          skippedByRuleId: rule.id
        }
      })

      // Increment skip count
      await prisma.transactionSkipRule.update({
        where: { id: rule.id },
        data: { skipCount: { increment: 1 } }
      })

      console.log(`[RULES] Transaction ${transaction.id} auto-skipped by rule "${rule.name}"`)
      return rule
    }
  }

  return null
}

/**
 * Apply skip rules to all pending transactions.
 * Useful for re-processing after rules change.
 */
export async function applySkipRulesToAllPending(): Promise<{ processed: number; skipped: number }> {
  const pendingTransactions = await prisma.stripeTransaction.findMany({
    where: { approvalStatus: 'PENDING' }
  })

  let skipped = 0
  for (const txn of pendingTransactions) {
    const rule = await applySkipRulesToTransaction(txn)
    if (rule) skipped++
  }

  return { processed: pendingTransactions.length, skipped }
}
