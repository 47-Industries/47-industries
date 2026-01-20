import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkExpensePermission } from '@/lib/expense-permissions'

// GET /api/admin/skip-rules - List all skip rules
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
    const rules = await prisma.transactionSkipRule.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        financialAccount: {
          select: {
            institutionName: true,
            accountLast4: true
          }
        }
      }
    })

    return NextResponse.json({ rules })
  } catch (error: any) {
    console.error('[SKIP_RULES] Error listing:', error.message)
    return NextResponse.json({ error: 'Failed to fetch skip rules' }, { status: 500 })
  }
}

// POST /api/admin/skip-rules - Create a new skip rule
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const permission = await checkExpensePermission()
  if (!permission.canAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { ruleType, name, reason, financialAccountId, vendorPattern, amount, amountVariance, descriptionPattern } = body

    if (!ruleType || !name) {
      return NextResponse.json({ error: 'Rule type and name are required' }, { status: 400 })
    }

    // Validate based on rule type
    if (ruleType === 'ACCOUNT' && !financialAccountId) {
      return NextResponse.json({ error: 'Account is required for account rules' }, { status: 400 })
    }
    if (ruleType === 'VENDOR_AMOUNT' && (!vendorPattern || amount === undefined)) {
      return NextResponse.json({ error: 'Vendor pattern and amount are required for vendor+amount rules' }, { status: 400 })
    }
    if (ruleType === 'DESCRIPTION_PATTERN' && !descriptionPattern) {
      return NextResponse.json({ error: 'Description pattern is required for pattern rules' }, { status: 400 })
    }

    const rule = await prisma.transactionSkipRule.create({
      data: {
        ruleType,
        name,
        reason,
        financialAccountId: ruleType === 'ACCOUNT' ? financialAccountId : null,
        vendorPattern: ruleType === 'VENDOR_AMOUNT' ? vendorPattern : null,
        amount: ruleType === 'VENDOR_AMOUNT' ? amount : null,
        amountVariance: ruleType === 'VENDOR_AMOUNT' ? (amountVariance || 5) : null,
        descriptionPattern: ruleType === 'DESCRIPTION_PATTERN' ? descriptionPattern : null,
        createdBy: session.user.id
      },
      include: {
        financialAccount: {
          select: {
            institutionName: true,
            accountLast4: true
          }
        }
      }
    })

    // Apply rule to existing pending transactions
    const skippedCount = await applyRuleToExistingTransactions(rule)

    return NextResponse.json({ rule, skippedCount })
  } catch (error: any) {
    console.error('[SKIP_RULES] Error creating:', error.message)
    return NextResponse.json({ error: 'Failed to create skip rule' }, { status: 500 })
  }
}

// Helper to apply a new rule to existing pending transactions
async function applyRuleToExistingTransactions(rule: any): Promise<number> {
  let whereClause: any = { approvalStatus: 'PENDING' }

  if (rule.ruleType === 'ACCOUNT') {
    whereClause.financialAccountId = rule.financialAccountId
  } else if (rule.ruleType === 'VENDOR_AMOUNT') {
    // For vendor+amount, we need to check description contains vendor AND amount matches
    const amount = Number(rule.amount)
    const variance = rule.amountVariance || 5
    const minAmount = amount * (1 - variance / 100)
    const maxAmount = amount * (1 + variance / 100)

    whereClause.description = { contains: rule.vendorPattern }
    whereClause.amount = { gte: minAmount, lte: maxAmount }
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
