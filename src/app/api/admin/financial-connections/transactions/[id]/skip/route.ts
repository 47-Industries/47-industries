import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkExpensePermission } from '@/lib/expense-permissions'

// POST /api/admin/financial-connections/transactions/[id]/skip - Skip transaction (not a company expense)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const permission = await checkExpensePermission()
  if (!permission.canAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))

    // Get the transaction with account info
    const transaction = await prisma.stripeTransaction.findUnique({
      where: { id },
      include: { financialAccount: true }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    let ruleId: string | null = null
    let ruleCreated = false
    let additionalSkipped = 0

    // Create skip rule if requested
    if (body.createRule) {
      const { ruleType, ruleName, reason, scopeToAccount } = body

      let ruleData: any = {
        ruleType,
        name: ruleName || generateRuleName(transaction, ruleType, scopeToAccount),
        reason: reason || 'Personal expense',
        createdBy: session.user.id
      }

      // If scoped to account, add the account filter
      if (scopeToAccount) {
        ruleData.financialAccountId = transaction.financialAccountId
      }

      if (ruleType === 'VENDOR') {
        // Skip by vendor name only (any amount)
        const vendorPattern = extractVendorPattern(transaction.description || '')
        ruleData.vendorPattern = vendorPattern
      } else if (ruleType === 'VENDOR_AMOUNT') {
        // Skip by vendor + specific amount
        const vendorPattern = extractVendorPattern(transaction.description || '')
        ruleData.vendorPattern = vendorPattern
        ruleData.amount = Math.abs(Number(transaction.amount))
        ruleData.amountVariance = 5
      } else if (ruleType === 'DESCRIPTION_PATTERN') {
        ruleData.descriptionPattern = body.descriptionPattern || extractDescriptionPattern(transaction.description || '')
      }

      const rule = await prisma.transactionSkipRule.create({ data: ruleData })
      ruleId = rule.id
      ruleCreated = true

      // Apply rule to other pending transactions
      additionalSkipped = await applyRuleToOtherTransactions(rule, transaction.id)
    }

    // Mark this transaction as skipped
    await prisma.stripeTransaction.update({
      where: { id },
      data: {
        approvalStatus: 'SKIPPED',
        skippedByRuleId: ruleId,
        matchedBy: session.user.id,
        matchedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      ruleCreated,
      ruleId,
      additionalSkipped
    })
  } catch (error: any) {
    console.error('[TRANSACTIONS] Error skipping:', error.message)
    return NextResponse.json({ error: 'Failed to skip transaction' }, { status: 500 })
  }
}

// Generate a user-friendly rule name
function generateRuleName(transaction: any, ruleType: string, scopeToAccount: boolean = false): string {
  const accountSuffix = scopeToAccount
    ? ` (${transaction.financialAccount?.accountLast4 || 'account'})`
    : ''

  if (ruleType === 'VENDOR') {
    const vendor = extractVendorPattern(transaction.description || '')
    return `${vendor}${accountSuffix}`
  }
  if (ruleType === 'VENDOR_AMOUNT') {
    const vendor = extractVendorPattern(transaction.description || '')
    const amount = Math.abs(Number(transaction.amount))
    return `${vendor} $${amount.toFixed(2)}${accountSuffix}`
  }
  if (ruleType === 'DESCRIPTION_PATTERN') {
    return `${extractDescriptionPattern(transaction.description || '')}${accountSuffix}`
  }
  return `Skip rule${accountSuffix}`
}

// Extract vendor name from description (first meaningful words)
function extractVendorPattern(description: string): string {
  // Take first 2-3 words, excluding common transaction prefixes
  const words = description
    .replace(/^(CHECKCARD|ACH|WIRE|TRANSFER|PAYMENT|DEBIT|CREDIT)\s*/i, '')
    .split(/\s+/)
    .slice(0, 3)
    .join(' ')
    .replace(/\d{4,}/g, '') // Remove long numbers
    .trim()
  return words || description.slice(0, 30)
}

// Extract pattern for description matching
function extractDescriptionPattern(description: string): string {
  // Find recurring patterns like "KEEPTHECHANGE", "Interest Earned", etc.
  const patterns = [
    /KEEPTHECHANGE/i,
    /Interest (Earned|Charge)/i,
    /Monthly Fee/i,
    /PAYROLL/i
  ]

  for (const pattern of patterns) {
    const match = description.match(pattern)
    if (match) return match[0]
  }

  // Default to first significant word
  return description.split(/\s+/)[0]
}

// Apply rule to other pending transactions (not the current one)
async function applyRuleToOtherTransactions(rule: any, excludeId: string): Promise<number> {
  let whereClause: any = {
    approvalStatus: 'PENDING',
    id: { not: excludeId }
  }

  // If rule is scoped to an account, add account filter
  if (rule.financialAccountId) {
    whereClause.financialAccountId = rule.financialAccountId
  }

  if (rule.ruleType === 'VENDOR') {
    // Vendor only - match description contains vendor pattern
    whereClause.description = { contains: rule.vendorPattern }
  } else if (rule.ruleType === 'VENDOR_AMOUNT') {
    const amount = Number(rule.amount)
    const variance = rule.amountVariance || 5
    const minAmount = amount * (1 - variance / 100)
    const maxAmount = amount * (1 + variance / 100)

    // Match vendor AND amount
    whereClause.AND = [
      { description: { contains: rule.vendorPattern } },
      {
        OR: [
          { amount: { gte: minAmount, lte: maxAmount } },
          { amount: { gte: -maxAmount, lte: -minAmount } }
        ]
      }
    ]
  } else if (rule.ruleType === 'DESCRIPTION_PATTERN') {
    whereClause.description = { contains: rule.descriptionPattern }
  }

  const result = await prisma.stripeTransaction.updateMany({
    where: whereClause,
    data: {
      approvalStatus: 'SKIPPED',
      skippedByRuleId: rule.id
    }
  })

  // Update skip count
  if (result.count > 0) {
    await prisma.transactionSkipRule.update({
      where: { id: rule.id },
      data: { skipCount: { increment: result.count } }
    })
  }

  return result.count
}
