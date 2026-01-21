import { NextRequest, NextResponse } from 'next/server'
import { gmailScanner } from '@/lib/gmail-scanner'
import { billParser } from '@/lib/bill-parser'
import { pushService } from '@/lib/push-notifications'
import { prisma } from '@/lib/prisma'

// Vercel Cron or manual trigger
// Add to vercel.json: { "crons": [{ "path": "/api/cron/scan-bills", "schedule": "*/15 * * * *" }] }

export async function GET(request: NextRequest) {
  // Verify cron secret or admin auth
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Allow Vercel cron (has CRON_SECRET in header) or admin API key
  const isVercelCron = authHeader === `Bearer ${cronSecret}`
  const isAdminAuth = request.headers.get('x-api-key') === process.env.ADMIN_API_KEY

  // For manual scans from admin panel, we'll skip auth check if no CRON_SECRET is set
  if (!isVercelCron && !isAdminAuth && cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get daysBack and mode from query params
  const { searchParams } = new URL(request.url)
  const daysBackParam = searchParams.get('daysBack')
  const daysBack = Math.min(Math.max(parseInt(daysBackParam || '1') || 1, 1), 60)
  const mode = searchParams.get('mode') || 'proposed' // 'proposed' or 'legacy'

  try {
    console.log(`[SCAN] Starting bill scan (${daysBack} days back, mode: ${mode})...`)

    const results = {
      processed: 0,
      proposed: 0, // New: proposed bills created
      created: 0,  // Legacy: direct bills created
      paid: 0,
      skipped: 0,
      errors: 0,
      notifications: 0
    }

    // Check for database-configured email accounts
    const dbGmailAccounts = await prisma.emailAccount.count({
      where: { provider: 'GMAIL', isActive: true, scanForBills: true }
    })
    const dbZohoAccounts = await prisma.emailAccount.count({
      where: { provider: 'ZOHO', isActive: true, scanForBills: true }
    })

    // If no database accounts, fall back to env var check
    if (dbGmailAccounts === 0 && dbZohoAccounts === 0 && !process.env.GMAIL_REFRESH_TOKEN) {
      console.error('[SCAN] No email accounts configured')
      return NextResponse.json({
        success: false,
        error: 'No email accounts configured',
        message: 'Add email accounts in Settings or set GMAIL_REFRESH_TOKEN'
      }, { status: 500 })
    }

    // Scan Gmail accounts
    const gmailResults = await gmailScanner.fetchFromAllAccountsWithInfo(daysBack)
    let totalEmails = 0

    for (const accountResult of gmailResults) {
      totalEmails += accountResult.emails.length

      for (const email of accountResult.emails) {
        try {
          // Check if already processed in database
          const alreadyProcessed = await gmailScanner.isEmailProcessed(email.id)
          if (alreadyProcessed) {
            results.skipped++
            continue
          }

          if (mode === 'proposed') {
            // New flow: Create proposed bills for manual approval
            const result = await billParser.processEmailToProposed(email, 'GMAIL', accountResult.accountId)
            results.processed++

            if (result.created) {
              results.proposed++
            } else if (result.action === 'already_proposed' || result.action === 'already_processed') {
              results.skipped++
            }
          } else {
            // Legacy flow: Direct bill creation
            const result = await billParser.processEmail(email)
            results.processed++

            if (result.created) {
              results.created++

              // Send push notification for new bills
              if (result.action === 'created_new') {
                const billInstance = await prisma.billInstance.findUnique({
                  where: { id: result.billId }
                })

                if (billInstance) {
                  await pushService.sendBillNotification(
                    billInstance.vendor,
                    Number(billInstance.amount),
                    billInstance.dueDate?.toISOString().split('T')[0] || null
                  )
                  results.notifications++
                }
              }
            }

            if (result.action === 'marked_paid') {
              results.paid++

              // Send push notification for payment confirmations
              const billInstance = await prisma.billInstance.findUnique({
                where: { id: result.billId }
              })

              if (billInstance) {
                await pushService.sendPaymentConfirmation(
                  billInstance.vendor,
                  Number(billInstance.amount)
                )
                results.notifications++
              }
            }

            if (result.action === 'not_a_bill' || result.action === 'already_processed') {
              results.skipped++
            }
          }
        } catch (error: any) {
          console.error(`[CRON] Error processing email ${email.id}:`, error.message)
          results.errors++
        }
      }
    }

    // Scan Zoho accounts (if any)
    if (dbZohoAccounts > 0) {
      const { zohoBillScanner } = await import('@/lib/zoho-bill-scanner')
      const zohoResults = await zohoBillScanner.scanAllAccounts(daysBack)
      totalEmails += zohoResults.totalEmails
      results.proposed += zohoResults.proposedBills

      if (zohoResults.errors.length > 0) {
        results.errors += zohoResults.errors.length
      }
    }

    // Sync bank transactions from Stripe Financial Connections
    const transactionResults = await syncBankTransactions()

    // Generate any fixed recurring bills for current period
    await generateFixedBills()

    console.log('[SCAN] Scan complete:', results, 'Transactions:', transactionResults)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      daysBack,
      mode,
      emailsFound: totalEmails,
      results,
      transactions: transactionResults
    })
  } catch (error: any) {
    console.error('[CRON] Fatal error:', error.message)
    return NextResponse.json({ error: 'Scan failed', message: error.message }, { status: 500 })
  }
}

// Generate bill instances for fixed-amount recurring bills
async function generateFixedBills() {
  const period = new Date().toISOString().slice(0, 7) // YYYY-MM

  // Get all active fixed recurring bills
  const fixedBills = await prisma.recurringBill.findMany({
    where: {
      active: true,
      amountType: 'FIXED'
    }
  })

  const founders = await prisma.user.findMany({
    where: { isFounder: true },
    select: { id: true }
  })

  const founderCount = founders.length

  for (const recurring of fixedBills) {
    // Check if we already have an instance for this period
    const existing = await prisma.billInstance.findFirst({
      where: {
        recurringBillId: recurring.id,
        period
      }
    })

    if (existing) continue

    // Check if it's time to create this bill (within 5 days of due date)
    const now = new Date()
    const dueDate = new Date(now.getFullYear(), now.getMonth(), recurring.dueDay)

    // If due day has passed, it's for next month
    if (dueDate < now && now.getDate() > recurring.dueDay + 5) {
      dueDate.setMonth(dueDate.getMonth() + 1)
    }

    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // Create bill instance if within 5 days of due date
    if (daysUntilDue <= 5 && daysUntilDue >= -2) {
      const amount = Number(recurring.fixedAmount) || 0
      const perPersonAmount = founderCount > 0 ? amount / founderCount : amount

      await prisma.billInstance.create({
        data: {
          recurringBillId: recurring.id,
          vendor: recurring.vendor,
          vendorType: recurring.vendorType,
          amount,
          dueDate,
          period,
          status: 'PENDING',
          founderPayments: {
            create: founders.map(founder => ({
              userId: founder.id,
              amount: perPersonAmount,
              status: 'PENDING'
            }))
          }
        }
      })

      console.log(`[CRON] Generated fixed bill: ${recurring.name} - $${amount}`)

      // Send notification
      await pushService.sendBillNotification(
        recurring.vendor,
        amount,
        dueDate.toISOString().split('T')[0]
      )
    }
  }
}

// Sync bank transactions from Stripe Financial Connections
async function syncBankTransactions(): Promise<{
  synced: number
  autoMatched: number
  errors: string[]
}> {
  const results = {
    synced: 0,
    autoMatched: 0,
    errors: [] as string[]
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return results
  }

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    // Get all active financial accounts
    const accounts = await prisma.stripeFinancialAccount.findMany({
      where: { status: 'ACTIVE' }
    })

    if (accounts.length === 0) {
      return results
    }

    // Get recurring bills for auto-matching
    const recurringBills = await prisma.recurringBill.findMany({
      where: { active: true }
    })

    for (const account of accounts) {
      try {
        // Subscribe and refresh
        try {
          await stripe.financialConnections.accounts.subscribe(account.stripeAccountId, {
            features: ['transactions']
          })
          await stripe.financialConnections.accounts.refresh(account.stripeAccountId, {
            features: ['transactions']
          })
        } catch (e) {
          // Continue - might already be subscribed
        }

        // Fetch all transactions with pagination
        let hasMore = true
        let startingAfter: string | undefined = undefined
        let pageCount = 0

        while (hasMore) {
          const transactions = await stripe.financialConnections.transactions.list({
            account: account.stripeAccountId,
            limit: 100,
            ...(startingAfter && { starting_after: startingAfter })
          })

          pageCount++
          console.log(`[SYNC] ${account.institutionName}: Page ${pageCount}, got ${transactions.data.length} transactions, has_more: ${transactions.has_more}`)

          for (const txn of transactions.data) {
          // Check if already synced
          const existing = await prisma.stripeTransaction.findUnique({
            where: { stripeTransactionId: txn.id }
          })

          if (existing) continue

          // Check if this transaction should be auto-skipped by a rule
          // Pass raw amount (preserving sign) for income/expense filtering
          const skipRule = await findMatchingSkipRule(
            account.id,
            txn.description || '',
            txn.amount / 100 // Raw amount with sign
          )

          if (skipRule) {
            // Create as auto-skipped
            await prisma.stripeTransaction.create({
              data: {
                financialAccountId: account.id,
                stripeTransactionId: txn.id,
                amount: txn.amount / 100,
                description: txn.description || null,
                merchantName: null,
                displayName: skipRule.displayName || null, // Apply clean name from rule
                category: null,
                transactedAt: new Date(txn.transacted_at * 1000),
                postedAt: txn.posted_at ? new Date(txn.posted_at * 1000) : null,
                status: txn.status,
                approvalStatus: 'SKIPPED',
                skippedByRuleId: skipRule.id
              }
            })

            // Increment skip count
            await prisma.transactionSkipRule.update({
              where: { id: skipRule.id },
              data: { skipCount: { increment: 1 } }
            })

            results.synced++
            continue // Skip further processing
          }

          // Try to auto-match to a recurring bill
          const matchedRecurring = findMatchingRecurringBill(recurringBills, txn.description || '', Math.abs(txn.amount) / 100)

          // Create the transaction record
          const newTxn = await prisma.stripeTransaction.create({
            data: {
              financialAccountId: account.id,
              stripeTransactionId: txn.id,
              amount: txn.amount / 100,
              description: txn.description || null,
              merchantName: null,
              category: null,
              transactedAt: new Date(txn.transacted_at * 1000),
              postedAt: txn.posted_at ? new Date(txn.posted_at * 1000) : null,
              status: txn.status,
              matchedRecurringBillId: matchedRecurring?.id || null,
              matchConfidence: matchedRecurring ? 80 : null
            }
          })

          results.synced++

          // Auto-approve if matched to a recurring bill with autoApprove enabled
          if (matchedRecurring?.autoApprove) {
            await autoApproveTransaction(newTxn.id, matchedRecurring)
            results.autoMatched++
          }
          }

          // Check if there are more pages
          hasMore = transactions.has_more
          if (hasMore && transactions.data.length > 0) {
            startingAfter = transactions.data[transactions.data.length - 1].id
          }
        }

        // Update last sync time
        await prisma.stripeFinancialAccount.update({
          where: { id: account.id },
          data: { lastSyncAt: new Date() }
        })
      } catch (err: any) {
        results.errors.push(`${account.institutionName}: ${err.message}`)
      }
    }
  } catch (error: any) {
    results.errors.push(`Sync error: ${error.message}`)
  }

  return results
}

// Find a skip rule that matches the transaction
// rawAmount is the actual amount (positive = income, negative = expense)
async function findMatchingSkipRule(
  accountId: string,
  description: string,
  rawAmount: number
): Promise<any | null> {
  const rules = await prisma.transactionSkipRule.findMany({
    where: { isActive: true }
  })

  const descLower = description.toLowerCase()
  const absAmount = Math.abs(rawAmount)
  const isIncome = rawAmount > 0

  for (const rule of rules) {
    // If rule is scoped to an account, check account matches
    if (rule.financialAccountId && rule.financialAccountId !== accountId) {
      continue // Rule doesn't apply to this account
    }

    // Check transaction type filter (INCOME = positive, EXPENSE = negative)
    if (rule.transactionType) {
      if (rule.transactionType === 'INCOME' && !isIncome) continue
      if (rule.transactionType === 'EXPENSE' && isIncome) continue
    }

    // Check VENDOR rule (vendor pattern only, any amount)
    if (rule.ruleType === 'VENDOR' && rule.vendorPattern) {
      if (descLower.includes(rule.vendorPattern.toLowerCase())) {
        return rule
      }
    }

    // Check VENDOR_AMOUNT rule
    if (rule.ruleType === 'VENDOR_AMOUNT' && rule.vendorPattern) {
      const vendorMatch = descLower.includes(rule.vendorPattern.toLowerCase())
      if (!vendorMatch) continue

      let amountMatch = false

      // Check range mode first (amountMin/amountMax)
      if (rule.amountMin !== null && rule.amountMax !== null) {
        const minAmt = Number(rule.amountMin)
        const maxAmt = Number(rule.amountMax)
        amountMatch = absAmount >= minAmt && absAmount <= maxAmt
      } else if (rule.amount) {
        // Exact mode with variance
        const ruleAmount = Number(rule.amount)
        const variance = rule.amountVariance || 5
        const minAmount = ruleAmount * (1 - variance / 100)
        const maxAmount = ruleAmount * (1 + variance / 100)
        amountMatch = absAmount >= minAmount && absAmount <= maxAmount
      }

      if (vendorMatch && amountMatch) {
        return rule
      }
    }

    // Check DESCRIPTION_PATTERN rule
    if (rule.ruleType === 'DESCRIPTION_PATTERN' && rule.descriptionPattern) {
      if (descLower.includes(rule.descriptionPattern.toLowerCase())) {
        return rule
      }
    }
  }

  return null
}

// Find a recurring bill that matches the transaction
function findMatchingRecurringBill(
  recurringBills: any[],
  description: string,
  amount: number
): any | null {
  const descLower = description.toLowerCase()

  for (const bill of recurringBills) {
    const vendorLower = bill.vendor.toLowerCase()

    // Check if description contains vendor name (or vice versa)
    const nameMatch = descLower.includes(vendorLower) || vendorLower.includes(descLower.split(' ')[0])

    // Check amount match (exact or within 5%)
    const billAmount = bill.fixedAmount ? Number(bill.fixedAmount) : 0
    const amountMatch = billAmount > 0 && Math.abs(amount - billAmount) / billAmount < 0.05

    if (nameMatch && amountMatch) {
      return bill
    }
  }

  return null
}

// Auto-approve a transaction by creating a BillInstance
async function autoApproveTransaction(transactionId: string, recurringBill: any) {
  const txn = await prisma.stripeTransaction.findUnique({
    where: { id: transactionId },
    include: { financialAccount: true }
  })

  if (!txn) return

  // Get team members who split expenses
  const splitters = await prisma.teamMember.findMany({
    where: { splitsExpenses: true, active: true },
    include: { user: true }
  })

  const splitterCount = splitters.length || 1
  const amount = Math.abs(Number(txn.amount))
  const perPersonAmount = amount / splitterCount
  const period = txn.transactedAt.toISOString().slice(0, 7)

  // Create bill instance
  const billInstance = await prisma.billInstance.create({
    data: {
      vendor: recurringBill.vendor,
      vendorType: recurringBill.vendorType,
      amount,
      dueDate: txn.transactedAt,
      period,
      status: 'PAID',
      isPaid: true,
      paidDate: txn.transactedAt,
      paymentMethod: `Bank: ${txn.financialAccount?.institutionName || 'Unknown'}`,
      recurringBillId: recurringBill.id,
      stripeTransactionId: txn.stripeTransactionId,
      billSplits: {
        create: splitters.map(member => ({
          teamMemberId: member.id,
          amount: perPersonAmount,
          status: 'PENDING'
        }))
      }
    }
  })

  // Link transaction to the bill instance and mark as approved
  await prisma.stripeTransaction.update({
    where: { id: transactionId },
    data: {
      matchedBillInstanceId: billInstance.id,
      approvalStatus: 'APPROVED',
      matchedAt: new Date()
    }
  })

  console.log(`[CRON] Auto-approved transaction as ${recurringBill.vendor}: $${amount}`)
}

// Also allow POST for manual testing
export async function POST(request: NextRequest) {
  return GET(request)
}
