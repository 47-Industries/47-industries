import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { applySkipRulesToAllPending } from '@/lib/transaction-rules'

// POST /api/cron/expense-maintenance
// Runs automatically via Railway cron to:
// 1. Apply skip rules to any pending transactions
// 2. Clean up duplicate rules and bills
// 3. Sync transactions from connected accounts
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[CRON] Starting expense maintenance...')

  const results: any = {
    timestamp: new Date().toISOString(),
    rulesApplied: null,
    duplicateRulesMerged: 0,
    duplicateBillsMerged: 0
  }

  try {
    // 1. Apply skip rules to pending transactions
    console.log('[CRON] Applying skip rules to pending transactions...')
    results.rulesApplied = await applySkipRulesToAllPending()
    console.log(`[CRON] Processed ${results.rulesApplied.processed} transactions, skipped ${results.rulesApplied.skipped}`)

    // 2. Merge duplicate rules
    console.log('[CRON] Checking for duplicate rules...')
    const duplicateRules = await findAndMergeDuplicateRules()
    results.duplicateRulesMerged = duplicateRules
    console.log(`[CRON] Merged ${duplicateRules} duplicate rules`)

    // 3. Merge duplicate bills
    console.log('[CRON] Checking for duplicate bills...')
    const duplicateBills = await findAndMergeDuplicateBills()
    results.duplicateBillsMerged = duplicateBills
    console.log(`[CRON] Merged ${duplicateBills} duplicate bills`)

    console.log('[CRON] Expense maintenance complete')
    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    console.error('[CRON] Expense maintenance error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Also allow GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request)
}

async function findAndMergeDuplicateRules(): Promise<number> {
  const rules = await prisma.transactionSkipRule.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' }
  })

  const groups: Map<string, typeof rules> = new Map()

  for (const rule of rules) {
    let key = ''
    if (rule.ruleType === 'ACCOUNT') {
      key = `account:${rule.financialAccountId}`
    } else if (rule.ruleType === 'VENDOR_AMOUNT') {
      key = `vendor_amount:${(rule.vendorPattern || '').toLowerCase()}`
    } else if (rule.ruleType === 'VENDOR') {
      key = `vendor:${(rule.vendorPattern || '').toLowerCase()}`
    } else if (rule.ruleType === 'DESCRIPTION_PATTERN') {
      key = `desc:${(rule.descriptionPattern || '').toLowerCase()}`
    } else {
      continue
    }

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(rule)
  }

  let merged = 0
  for (const [, ruleGroup] of groups) {
    if (ruleGroup.length > 1) {
      const keep = ruleGroup[0]
      const duplicates = ruleGroup.slice(1)

      // Sum skip counts
      const totalSkipCount = duplicates.reduce((sum, r) => sum + (r.skipCount || 0), keep.skipCount || 0)

      await prisma.transactionSkipRule.update({
        where: { id: keep.id },
        data: { skipCount: totalSkipCount }
      })

      for (const dup of duplicates) {
        await prisma.stripeTransaction.updateMany({
          where: { skippedByRuleId: dup.id },
          data: { skippedByRuleId: keep.id }
        })
        await prisma.transactionSkipRule.update({
          where: { id: dup.id },
          data: { isActive: false, name: `[MERGED] ${dup.name}` }
        })
        merged++
      }
    }
  }

  return merged
}

async function findAndMergeDuplicateBills(): Promise<number> {
  const bills = await prisma.recurringBill.findMany({
    where: { active: true },
    orderBy: { createdAt: 'asc' }
  })

  const groups: Map<string, typeof bills> = new Map()

  for (const bill of bills) {
    const normalizedVendor = bill.vendor.toLowerCase().replace(/[^a-z0-9]/g, '')
    const key = `${normalizedVendor}:${bill.vendorType}`

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(bill)
  }

  let merged = 0
  for (const [, billGroup] of groups) {
    if (billGroup.length > 1) {
      // Keep the one with most instances
      const counts = await Promise.all(
        billGroup.map(async (b) => ({
          bill: b,
          count: await prisma.billInstance.count({ where: { recurringBillId: b.id } })
        }))
      )
      counts.sort((a, b) => b.count - a.count)

      const keep = counts[0].bill
      const duplicates = counts.slice(1).map(c => c.bill)

      for (const dup of duplicates) {
        // Migrate instances
        await prisma.billInstance.updateMany({
          where: { recurringBillId: dup.id },
          data: { recurringBillId: keep.id }
        })

        // Deactivate duplicate
        await prisma.recurringBill.update({
          where: { id: dup.id },
          data: { active: false, name: `[MERGED] ${dup.name}` }
        })
        merged++
      }
    }
  }

  return merged
}
