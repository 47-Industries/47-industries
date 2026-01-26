import cron from 'node-cron'
import { gmailScanner } from '@/lib/gmail-scanner'
import { billParser } from '@/lib/bill-parser'
import { pushService } from '@/lib/push-notifications'
import { prisma } from '@/lib/prisma'

let isRunning = false

async function scanBills() {
  if (isRunning) {
    console.log('[CRON] Scan already in progress, skipping...')
    return
  }

  isRunning = true
  console.log(`[CRON] Starting bill scan at ${new Date().toISOString()}`)

  try {
    // Fetch emails from last 24 hours
    const emails = await gmailScanner.fetchFromAllAccounts(1)
    console.log(`[CRON] Found ${emails.length} emails to process`)

    let processed = 0
    let created = 0
    let paid = 0
    let skipped = 0

    for (const email of emails) {
      try {
        // Check if already processed in database
        const alreadyProcessed = await gmailScanner.isEmailProcessed(email.id)
        if (alreadyProcessed) {
          skipped++
          continue
        }

        // Process the email
        const result = await billParser.processEmail(email)
        processed++

        if (result.created) {
          created++

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
            }
          }
        }

        if (result.action === 'marked_paid') {
          paid++

          // Send push notification for payment confirmations
          const billInstance = await prisma.billInstance.findUnique({
            where: { id: result.billId }
          })

          if (billInstance) {
            await pushService.sendPaymentConfirmation(
              billInstance.vendor,
              Number(billInstance.amount)
            )
          }
        }

        if (result.action === 'not_a_bill' || result.action === 'already_processed') {
          skipped++
        }
      } catch (error: any) {
        console.error(`[CRON] Error processing email ${email.id}:`, error.message)
      }
    }

    // Generate any fixed recurring bills for current period
    await generateFixedBills()

    console.log(`[CRON] Scan complete: processed=${processed}, created=${created}, paid=${paid}, skipped=${skipped}`)
  } catch (error: any) {
    console.error('[CRON] Fatal error:', error.message)
  } finally {
    isRunning = false
  }
}

// Generate bill instances for ALL active recurring bills (current month + next month)
async function generateFixedBills() {
  const now = new Date()

  // Generate for current month and next month
  const periods = [
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 7),
    new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 7)
  ]

  // Auto-generate all recurring bills (use estimated amounts for variable)
  const recurringBills = await prisma.recurringBill.findMany({
    where: { active: true }
  })

  // Get team members who split expenses
  const splitters = await prisma.teamMember.findMany({
    where: { splitsExpenses: true, status: 'ACTIVE' },
    select: { id: true }
  })

  const splitterCount = splitters.length
  let created = 0

  for (const period of periods) {
    const [year, month] = period.split('-').map(Number)

    for (const recurring of recurringBills) {
      // Handle different frequencies
      let shouldCreate = true
      let effectivePeriod = period

      if (recurring.frequency === 'QUARTERLY') {
        const quarterStartMonths = [1, 4, 7, 10]
        if (!quarterStartMonths.includes(month)) {
          shouldCreate = false
        } else {
          const quarter = Math.floor((month - 1) / 3) + 1
          effectivePeriod = `${year}-Q${quarter}`
        }
      } else if (recurring.frequency === 'ANNUAL') {
        if (month !== 1) {
          shouldCreate = false
        } else {
          effectivePeriod = `${year}`
        }
      }

      if (!shouldCreate) continue

      // Check if we already have an instance for this period
      const existing = await prisma.billInstance.findFirst({
        where: {
          recurringBillId: recurring.id,
          period: effectivePeriod
        }
      })

      if (existing) continue

      // Calculate due date
      const dueDate = new Date(year, month - 1, recurring.dueDay || 1)

      // For VARIABLE bills, use last paid amount or fixedAmount as estimate
      let amount = Number(recurring.fixedAmount) || 0

      if (recurring.amountType === 'VARIABLE') {
        const lastPaidInstance = await prisma.billInstance.findFirst({
          where: {
            recurringBillId: recurring.id,
            status: 'PAID',
            amount: { gt: 0 }
          },
          orderBy: { period: 'desc' }
        })
        if (lastPaidInstance) {
          amount = Number(lastPaidInstance.amount)
        }
      }

      // Skip if no valid amount (can't estimate)
      if (amount <= 0) continue

      const perPersonAmount = splitterCount > 0 ? amount / splitterCount : 0

      await prisma.billInstance.create({
        data: {
          recurringBillId: recurring.id,
          vendor: recurring.vendor,
          vendorType: recurring.vendorType,
          amount,
          dueDate,
          period: effectivePeriod,
          status: 'PENDING',
          billSplits: splitterCount > 0 ? {
            create: splitters.map(splitter => ({
              teamMemberId: splitter.id,
              amount: perPersonAmount,
              status: 'PENDING'
            }))
          } : undefined
        }
      })

      created++
      console.log(`[CRON] Generated bill: ${recurring.name} for ${effectivePeriod} - $${amount}`)

      // Send notification for fixed bills with amounts
      if (amount > 0) {
        await pushService.sendBillNotification(
          recurring.vendor,
          amount,
          dueDate.toISOString().split('T')[0]
        )
      }
    }
  }

  if (created > 0) {
    console.log(`[CRON] Generated ${created} recurring bill instance(s)`)
  }
}

export function startBillScannerCron() {
  // Check if Gmail is configured
  if (!process.env.GMAIL_REFRESH_TOKEN) {
    console.log('[CRON] Gmail not configured, bill scanner disabled')
    return
  }

  console.log('[CRON] Starting bill scanner cron job (every 15 minutes)')

  // Schedule: every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    scanBills()
  })

  // Run initial scan after 30 seconds (let the server fully start)
  setTimeout(() => {
    console.log('[CRON] Running initial bill scan...')
    scanBills()
  }, 30000)
}
