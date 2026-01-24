import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkExpensePermission } from '@/lib/expense-permissions'
import { applySkipRulesToAllPending } from '@/lib/transaction-rules'

// POST /api/admin/expenses/consolidate - Consolidate duplicates and re-apply rules
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const permission = await checkExpensePermission()
  if (!permission.canManage) {
    return NextResponse.json({ error: 'Access denied - requires manage permission' }, { status: 403 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { action } = body // 'rules', 'bills', 'apply-rules', or 'all'

    const results: any = {}

    // Consolidate duplicate skip rules
    if (action === 'rules' || action === 'all') {
      results.rules = await consolidateDuplicateRules()
    }

    // Consolidate duplicate recurring bills
    if (action === 'bills' || action === 'all') {
      results.bills = await consolidateDuplicateBills()
    }

    // Re-apply skip rules to pending transactions
    if (action === 'apply-rules' || action === 'all') {
      results.rulesApplied = await applySkipRulesToAllPending()
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    console.error('[CONSOLIDATE] Error:', error.message)
    return NextResponse.json({ error: 'Failed to consolidate' }, { status: 500 })
  }
}

// GET /api/admin/expenses/consolidate - Preview duplicates without taking action
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const permission = await checkExpensePermission()
  if (!permission.canAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const [duplicateRules, duplicateBills] = await Promise.all([
      findDuplicateRules(),
      findDuplicateBills()
    ])

    return NextResponse.json({
      duplicateRules,
      duplicateBills,
      summary: {
        duplicateRuleGroups: duplicateRules.length,
        duplicateBillGroups: duplicateBills.length,
        totalDuplicateRules: duplicateRules.reduce((sum, g) => sum + g.duplicates.length, 0),
        totalDuplicateBills: duplicateBills.reduce((sum, g) => sum + g.duplicates.length, 0)
      }
    })
  } catch (error: any) {
    console.error('[CONSOLIDATE] Error finding duplicates:', error.message)
    return NextResponse.json({ error: 'Failed to find duplicates' }, { status: 500 })
  }
}

// Find duplicate skip rules (same vendor pattern or description pattern)
async function findDuplicateRules() {
  const rules = await prisma.transactionSkipRule.findMany({
    orderBy: { createdAt: 'asc' }
  })

  const groups: Map<string, typeof rules> = new Map()

  for (const rule of rules) {
    // Create a key based on rule type and pattern
    let key = ''
    if (rule.ruleType === 'ACCOUNT') {
      key = `account:${rule.financialAccountId}`
    } else if (rule.ruleType === 'VENDOR_AMOUNT') {
      key = `vendor_amount:${(rule.vendorPattern || '').toLowerCase()}:${rule.amount}`
    } else if (rule.ruleType === 'VENDOR') {
      key = `vendor:${(rule.vendorPattern || '').toLowerCase()}`
    } else if (rule.ruleType === 'DESCRIPTION_PATTERN') {
      key = `desc:${(rule.descriptionPattern || '').toLowerCase()}`
    } else {
      key = `other:${rule.id}`
    }

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(rule)
  }

  // Filter to only groups with duplicates
  const duplicates = []
  for (const [key, ruleGroup] of groups) {
    if (ruleGroup.length > 1) {
      duplicates.push({
        key,
        keep: ruleGroup[0], // Keep the oldest one
        duplicates: ruleGroup.slice(1) // Mark the rest as duplicates
      })
    }
  }

  return duplicates
}

// Find duplicate recurring bills (same vendor + similar name)
async function findDuplicateBills() {
  const bills = await prisma.recurringBill.findMany({
    where: { active: true },
    orderBy: { createdAt: 'asc' }
  })

  const groups: Map<string, typeof bills> = new Map()

  for (const bill of bills) {
    // Normalize vendor name for comparison
    const normalizedVendor = bill.vendor.toLowerCase().replace(/[^a-z0-9]/g, '')
    const key = `${normalizedVendor}:${bill.vendorType}`

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(bill)
  }

  // Filter to only groups with duplicates
  const duplicates = []
  for (const [key, billGroup] of groups) {
    if (billGroup.length > 1) {
      // Keep the one with the most instances
      const sorted = await Promise.all(
        billGroup.map(async (bill) => ({
          bill,
          instanceCount: await prisma.billInstance.count({ where: { recurringBillId: bill.id } })
        }))
      )
      sorted.sort((a, b) => b.instanceCount - a.instanceCount)

      duplicates.push({
        key,
        keep: sorted[0].bill,
        keepInstanceCount: sorted[0].instanceCount,
        duplicates: sorted.slice(1).map(s => ({ ...s.bill, instanceCount: s.instanceCount }))
      })
    }
  }

  return duplicates
}

// Consolidate duplicate rules - keep oldest, merge skip counts, delete duplicates
async function consolidateDuplicateRules() {
  const duplicateGroups = await findDuplicateRules()

  let merged = 0
  let deleted = 0

  for (const group of duplicateGroups) {
    // Sum up skip counts from duplicates
    const totalSkipCount = group.duplicates.reduce((sum, r) => sum + ((r as any).skipCount || 0), group.keep.skipCount || 0)

    // Update the rule we're keeping with combined skip count
    await prisma.transactionSkipRule.update({
      where: { id: group.keep.id },
      data: { skipCount: totalSkipCount }
    })

    // Update any transactions that reference duplicate rules to point to the kept rule
    for (const duplicate of group.duplicates) {
      await prisma.stripeTransaction.updateMany({
        where: { skippedByRuleId: duplicate.id },
        data: { skippedByRuleId: group.keep.id }
      })

      // Delete the duplicate rule
      await prisma.transactionSkipRule.delete({
        where: { id: duplicate.id }
      })
      deleted++
    }
    merged++
  }

  return { groupsMerged: merged, rulesDeleted: deleted }
}

// Consolidate duplicate bills - keep one with most instances, migrate instances, delete duplicates
async function consolidateDuplicateBills() {
  const duplicateGroups = await findDuplicateBills()

  let merged = 0
  let deleted = 0
  let instancesMigrated = 0

  for (const group of duplicateGroups) {
    // Migrate instances from duplicates to the bill we're keeping
    for (const duplicate of group.duplicates) {
      const migrateResult = await prisma.billInstance.updateMany({
        where: { recurringBillId: (duplicate as any).id },
        data: { recurringBillId: group.keep.id }
      })
      instancesMigrated += migrateResult.count

      // Migrate default splitters
      const existingSplitters = await prisma.recurringBillSplitter.findMany({
        where: { recurringBillId: group.keep.id },
        select: { teamMemberId: true }
      })
      const existingSplitterIds = new Set(existingSplitters.map(s => s.teamMemberId))

      const duplicateSplitters = await prisma.recurringBillSplitter.findMany({
        where: { recurringBillId: (duplicate as any).id }
      })

      for (const splitter of duplicateSplitters) {
        if (!existingSplitterIds.has(splitter.teamMemberId)) {
          await prisma.recurringBillSplitter.create({
            data: {
              recurringBillId: group.keep.id,
              teamMemberId: splitter.teamMemberId,
              splitPercent: splitter.splitPercent
            }
          })
        }
      }

      // Delete duplicate splitters
      await prisma.recurringBillSplitter.deleteMany({
        where: { recurringBillId: (duplicate as any).id }
      })

      // Deactivate the duplicate bill (soft delete)
      await prisma.recurringBill.update({
        where: { id: (duplicate as any).id },
        data: { active: false, name: `[DUPLICATE] ${(duplicate as any).name}` }
      })
      deleted++
    }
    merged++
  }

  return { groupsMerged: merged, billsDeactivated: deleted, instancesMigrated }
}
