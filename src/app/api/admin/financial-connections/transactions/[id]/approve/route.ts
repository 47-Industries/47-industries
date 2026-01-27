import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkExpensePermission } from '@/lib/expense-permissions'

// POST /api/admin/financial-connections/transactions/[id]/approve - Approve transaction as company expense
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

    console.log('[APPROVE] Body:', JSON.stringify(body))

    // Get the transaction
    const transaction = await prisma.stripeTransaction.findUnique({
      where: { id },
      include: { financialAccount: true }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (transaction.matchedBillInstanceId) {
      return NextResponse.json({ error: 'Transaction already matched to an expense' }, { status: 400 })
    }

    // Get team members who split expenses
    const splitters = await prisma.teamMember.findMany({
      where: { splitsExpenses: true, status: 'ACTIVE' },
      select: { id: true }
    })

    // Use absolute value for expense amount (transactions are often negative for expenses)
    const amount = Math.abs(transaction.amount.toNumber())
    const vendor = body.vendor || transaction.merchantName || transaction.description || 'Bank Transaction'
    const vendorType = body.vendorType || 'OTHER'
    const createRecurring = body.createRecurring === true
    const amountType = body.amountType || 'FIXED' // FIXED or VARIABLE
    const autoApprove = body.autoApprove === true
    const frequency = body.frequency || 'MONTHLY'
    // Use dueDay from body, or fall back to transaction date's day (capped at 28)
    const txnDate = new Date(transaction.transactedAt)
    const dueDay = body.dueDay || Math.min(txnDate.getDate(), 28)

    // Auto-approve rule parameters
    const createAutoApproveRule = body.createAutoApproveRule === true
    const ruleType = body.ruleType || 'VENDOR'
    const vendorPattern = body.vendorPattern || vendor
    const patternOverride = body.patternOverride || null // For DESCRIPTION_PATTERN
    const displayName = body.displayName || null
    const amountMode = body.amountMode || 'EXACT'
    const amountMin = body.amountMin
    const amountMax = body.amountMax

    // Determine period from transaction date (txnDate already defined above)
    const period = txnDate.toISOString().slice(0, 7)

    let recurringBillId: string | null = null

    // ALWAYS try to find a matching recurring bill template first
    const vendorFirstWord = vendor.split(' ')[0].toLowerCase()
    const existingRecurring = await prisma.recurringBill.findFirst({
      where: {
        active: true,
        OR: [
          { vendor: { contains: vendorFirstWord } },
          { name: { contains: vendorFirstWord } }
        ]
      }
    })

    if (existingRecurring) {
      recurringBillId = existingRecurring.id
      console.log(`[APPROVE] Auto-linked to recurring template: ${existingRecurring.name}`)
    }

    // Create or update recurring bill if requested
    if (createRecurring) {
      if (existingRecurring) {
        // Update existing recurring bill
        await prisma.recurringBill.update({
          where: { id: existingRecurring.id },
          data: {
            fixedAmount: amount,
            autoApprove: autoApprove || existingRecurring.autoApprove
          }
        })
        recurringBillId = existingRecurring.id
      } else {
        // Create new recurring bill
        // Extract patterns from vendor name for email matching
        const patterns = vendor.toLowerCase().split(' ').filter((w: string) => w.length > 2).slice(0, 3)
        const recurring = await prisma.recurringBill.create({
          data: {
            name: vendor,
            vendor,
            vendorType,
            frequency,
            amountType,
            fixedAmount: amountType === 'FIXED' ? amount : null,
            dueDay,
            active: true,
            autoApprove,
            emailPatterns: patterns // Required field
          }
        })
        recurringBillId = recurring.id
      }
    }

    // Create bill instance
    // If there are splitters, bill starts as PENDING (until all splits are paid)
    // If no splitters, bill is PAID since company paid it
    const billStatus = splitters.length > 0 ? 'PENDING' : 'PAID'

    const billInstance = await prisma.billInstance.create({
      data: {
        vendor,
        vendorType,
        amount,
        dueDate: txnDate,
        period,
        status: billStatus,
        paidDate: txnDate, // Track when company paid the vendor
        paidVia: `${transaction.financialAccount.institutionName} ****${transaction.financialAccount.accountLast4 || ''}`,
        stripeTransactionId: transaction.stripeTransactionId,
        recurringBillId
      }
    })

    // Create bill splits
    if (splitters.length > 0 && amount > 0) {
      const splitAmount = amount / splitters.length
      const splits = splitters.map(splitter => ({
        billInstanceId: billInstance.id,
        teamMemberId: splitter.id,
        amount: splitAmount,
        status: 'PENDING' as const, // Partner still owes their share
        paidDate: null
      }))

      await prisma.billSplit.createMany({ data: splits })
    }

    // Link transaction to bill instance and mark as approved
    await prisma.stripeTransaction.update({
      where: { id },
      data: {
        matchedBillInstanceId: billInstance.id,
        matchConfidence: 100, // Manual match
        approvalStatus: 'APPROVED',
        matchedBy: session.user.id,
        matchedAt: new Date(),
        displayName: displayName || undefined // Set display name if provided
      }
    })

    let ruleCreated = false
    let additionalApproved = 0
    let createdRuleId: string | null = null

    // Create auto-approve rule if requested
    if (createAutoApproveRule) {
      try {
        // Create persistent auto-approve rule
        const ruleData: any = {
          action: 'APPROVE',
          ruleType,
          name: displayName || vendor,
          displayName: displayName || null,
          vendorType,
          recurringBillId,
          createdBy: session.user.id
        }

        if (ruleType === 'VENDOR' || ruleType === 'VENDOR_AMOUNT') {
          ruleData.vendorPattern = vendorPattern
        }
        if (ruleType === 'VENDOR_AMOUNT') {
          if (amountMode === 'RANGE' && amountMin !== null && amountMax !== null) {
            ruleData.amountMin = amountMin
            ruleData.amountMax = amountMax
          } else {
            ruleData.amount = amount
            ruleData.amountVariance = 5
          }
        }
        if (ruleType === 'DESCRIPTION_PATTERN') {
          ruleData.descriptionPattern = patternOverride || vendorPattern
        }

        // Check for existing duplicate rule
        const existingRule = await prisma.transactionSkipRule.findFirst({
          where: {
            action: 'APPROVE',
            ruleType,
            isActive: true,
            ...(ruleType === 'VENDOR' || ruleType === 'VENDOR_AMOUNT' ? { vendorPattern } : {}),
            ...(ruleType === 'DESCRIPTION_PATTERN' ? { descriptionPattern: patternOverride || vendorPattern } : {})
          }
        })

        if (!existingRule) {
          const newRule = await prisma.transactionSkipRule.create({ data: ruleData })
          createdRuleId = newRule.id
          ruleCreated = true
        } else {
          createdRuleId = existingRule.id
        }

        // Apply rule to matching pending transactions
        let whereClause: any = {
          approvalStatus: 'PENDING',
          id: { not: id }
        }

        if (ruleType === 'VENDOR') {
          // Match on description or merchant name (MySQL is case-insensitive by default)
          whereClause.OR = [
            { description: { contains: vendorPattern } },
            { merchantName: { contains: vendorPattern } }
          ]
        } else if (ruleType === 'VENDOR_AMOUNT') {
          // Build amount conditions
          let amountConditions: any[]
          if (amountMode === 'RANGE' && amountMin !== null && amountMax !== null) {
            amountConditions = [
              { amount: { gte: amountMin, lte: amountMax } },
              { amount: { gte: -amountMax, lte: -amountMin } }
            ]
          } else {
            // 5% variance on exact amount
            const minAmt = amount * 0.95
            const maxAmt = amount * 1.05
            amountConditions = [
              { amount: { gte: minAmt, lte: maxAmt } },
              { amount: { gte: -maxAmt, lte: -minAmt } }
            ]
          }

          // Must match pattern AND amount
          whereClause.AND = [
            {
              OR: [
                { description: { contains: vendorPattern } },
                { merchantName: { contains: vendorPattern } }
              ]
            },
            { OR: amountConditions }
          ]
        } else if (ruleType === 'DESCRIPTION_PATTERN') {
          // Match on raw description text pattern
          const patternToMatch = patternOverride || vendorPattern
          whereClause.OR = [
            { description: { contains: patternToMatch } },
            { merchantName: { contains: patternToMatch } }
          ]
        }

        console.log('[APPROVE] Auto-approve query:', JSON.stringify(whereClause))

        // Find matching transactions
        const matchingTxns = await prisma.stripeTransaction.findMany({
          where: whereClause,
          include: { financialAccount: true }
        })

        // Auto-approve each matching transaction
        for (const txn of matchingTxns) {
          const txnAmount = Math.abs(txn.amount.toNumber())
          const txnDate = new Date(txn.transactedAt)
          const txnPeriod = txnDate.toISOString().slice(0, 7)

          // Create bill instance for this transaction
          // If there are splitters, bill starts as PENDING (until all splits are paid)
          const newBillStatus = splitters.length > 0 ? 'PENDING' : 'PAID'

          const newBillInstance = await prisma.billInstance.create({
            data: {
              vendor,
              vendorType,
              amount: txnAmount,
              dueDate: txnDate,
              period: txnPeriod,
              status: newBillStatus,
              paidDate: txnDate, // Track when company paid the vendor
              paidVia: `${txn.financialAccount.institutionName} ****${txn.financialAccount.accountLast4 || ''}`,
              stripeTransactionId: txn.stripeTransactionId,
              recurringBillId
            }
          })

          // Create bill splits
          if (splitters.length > 0 && txnAmount > 0) {
            const splitAmount = txnAmount / splitters.length
            const splits = splitters.map(splitter => ({
              billInstanceId: newBillInstance.id,
              teamMemberId: splitter.id,
              amount: splitAmount,
              status: 'PENDING' as const,
              paidDate: null
            }))
            await prisma.billSplit.createMany({ data: splits })
          }

          // Update transaction
          await prisma.stripeTransaction.update({
            where: { id: txn.id },
            data: {
              matchedBillInstanceId: newBillInstance.id,
              matchConfidence: 90, // Auto-matched
              approvalStatus: 'APPROVED',
              matchedBy: session.user.id,
              matchedAt: new Date(),
              displayName: displayName || undefined
            }
          })

          additionalApproved++
        }

        // Update rule match count (includes the original transaction)
        if (createdRuleId) {
          await prisma.transactionSkipRule.update({
            where: { id: createdRuleId },
            data: { skipCount: { increment: additionalApproved + 1 } }
          })
        }
      } catch (ruleError: any) {
        console.error('[APPROVE] Error creating auto-approve rule:', ruleError.message)
        // Continue without failing - the main transaction was approved
      }
    }

    return NextResponse.json({
      success: true,
      billInstanceId: billInstance.id,
      recurringBillId,
      recurringCreated: createRecurring && recurringBillId !== null,
      ruleCreated,
      additionalApproved
    })
  } catch (error: any) {
    console.error('[TRANSACTIONS] Error approving:', error.message, error.stack)
    return NextResponse.json({ error: 'Failed to approve transaction: ' + error.message }, { status: 500 })
  }
}
