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

    // Generate any fixed recurring bills for current period
    await generateFixedBills()

    console.log('[SCAN] Scan complete:', results)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      daysBack,
      mode,
      emailsFound: totalEmails,
      results
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

// Also allow POST for manual testing
export async function POST(request: NextRequest) {
  return GET(request)
}
