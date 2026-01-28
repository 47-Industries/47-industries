import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

interface ParsedBill {
  vendor: string
  vendorType: string
  amount: number | null
  dueDate: string | null
  isPaid: boolean
  paymentMethod?: string
  confidence: number
}

interface EmailData {
  id: string
  from: string
  subject: string
  body: string
  snippet: string
  date: string
}

export class BillParser {
  async parseEmail(email: EmailData): Promise<ParsedBill | null> {
    // First try to match against recurring bills
    const recurringMatch = await this.matchRecurringBill(email)

    const prompt = `Analyze this email and extract bill/payment information.

FROM: ${email.from}
SUBJECT: ${email.subject}
SNIPPET: ${email.snippet}
BODY (first 2000 chars): ${email.body.substring(0, 2000)}

Determine if this is:
1. A BILL notification (statement ready, payment due, amount owed)
2. A PAYMENT confirmation (payment received, transfer complete, money sent)
3. Neither (promotional, informational, etc.)

Extract:
- vendor: Company/person name (e.g., "Duke Energy", "Chase", "Monique Roberts")
- vendorType: One of: UTILITY, CREDIT_CARD, RENT, SUBSCRIPTION, TRANSFER, OTHER
- amount: Dollar amount if found (number only, no $)
- dueDate: Due date if this is a bill (YYYY-MM-DD format)
- isPaid: true if this is a payment confirmation, false if it's a bill notification
- paymentMethod: How it was paid (e.g., "Zelle", "Autopay", "Bank Transfer") if isPaid is true
- confidence: 0-100 how confident you are this is a real bill/payment

For Zelle transfers:
- The sender (you) sent money TO someone - this is a PAYMENT (isPaid: true)
- Someone sent money TO you - this is income, not a bill

Return JSON only, no explanation:
{"vendor": "", "vendorType": "", "amount": null, "dueDate": null, "isPaid": false, "paymentMethod": null, "confidence": 0}

If this is not a bill or payment, return confidence: 0.`

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })

      const content = response.content[0]
      if (content.type !== 'text') return null

      // Extract JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return null

      const parsed = JSON.parse(jsonMatch[0]) as ParsedBill

      // Skip low confidence results
      if (parsed.confidence < 50) {
        return null
      }

      // If we matched a recurring bill, use its details
      if (recurringMatch) {
        parsed.vendor = recurringMatch.vendor
        parsed.vendorType = recurringMatch.vendorType
        if (recurringMatch.amountType === 'FIXED' && recurringMatch.fixedAmount) {
          parsed.amount = Number(recurringMatch.fixedAmount)
        }
      }

      return parsed
    } catch (error: any) {
      console.error('[PARSER] Error parsing email')
      return null
    }
  }

  private async matchRecurringBill(email: EmailData): Promise<any | null> {
    const recurringBills = await prisma.recurringBill.findMany({
      where: { active: true }
    })

    const emailText = `${email.from} ${email.subject} ${email.snippet} ${email.body}`.toLowerCase()

    let bestMatch: any = null
    let bestScore = 0

    for (const bill of recurringBills) {
      const patterns = bill.emailPatterns as string[]
      if (!patterns || patterns.length === 0) continue

      // Count how many patterns match (more matches = higher confidence)
      let matchCount = 0
      for (const pattern of patterns) {
        if (emailText.includes(pattern.toLowerCase())) {
          matchCount++
        }
      }

      // Calculate score as percentage of patterns matched
      const score = matchCount / patterns.length

      // Need at least one pattern to match, prefer higher scores
      if (matchCount > 0 && score > bestScore) {
        bestScore = score
        bestMatch = bill
      }
    }

    return bestMatch
  }

  async processEmail(email: EmailData): Promise<{ created: boolean; billId?: string; action?: string }> {
    // Check if already processed
    const existing = await prisma.processedEmail.findUnique({
      where: { emailId: email.id }
    })

    if (existing) {
      return { created: false, action: 'already_processed' }
    }

    // Parse the email
    const parsed = await this.parseEmail(email)
    if (!parsed) {
      await this.markProcessed(email.id, 'skipped')
      return { created: false, action: 'not_a_bill' }
    }

    // Determine period from email date or parsed due date (not current date)
    // This ensures historical scans put bills in the correct month
    let period: string
    if (parsed.dueDate) {
      // Use due date month as the period
      period = parsed.dueDate.slice(0, 7)
    } else if (email.date) {
      // Fall back to email date
      const emailDate = new Date(email.date)
      period = emailDate.toISOString().slice(0, 7)
    } else {
      // Last resort: current date
      period = new Date().toISOString().slice(0, 7)
    }

    // Get team members who split expenses
    const splitters = await prisma.teamMember.findMany({
      where: { splitsExpenses: true, status: 'ACTIVE' },
      select: { id: true }
    })
    const splitterCount = splitters.length

    if (parsed.isPaid) {
      // This is a payment confirmation - find and update existing bill instance
      const result = await this.handlePaymentConfirmation(email, parsed, period)
      return result
    } else {
      // This is a bill notification - create new bill instance
      const result = await this.handleBillNotification(email, parsed, period, splitterCount)
      return result
    }
  }

  private async handlePaymentConfirmation(
    email: EmailData,
    parsed: ParsedBill,
    period: string
  ): Promise<{ created: boolean; billId?: string; action?: string }> {
    // Find matching recurring bill for better matching
    const recurringBill = await this.matchRecurringBill(email)

    // Determine the period (handle quarterly bills)
    let billPeriod = period
    if (recurringBill?.frequency === 'QUARTERLY') {
      const now = new Date()
      const quarter = Math.floor(now.getMonth() / 3) + 1
      billPeriod = `${now.getFullYear()}-Q${quarter}`
    }

    // Find existing pending bill instance for this vendor
    // Try multiple matching strategies
    const existingBill = await prisma.billInstance.findFirst({
      where: {
        OR: [
          // Match by recurring bill ID
          { recurringBillId: recurringBill?.id, status: 'PENDING' },
          // Match by exact vendor and period
          { vendor: parsed.vendor, period: billPeriod, status: 'PENDING' },
          // Match by partial vendor name and period
          { vendor: { contains: parsed.vendor.split(' ')[0] }, period: billPeriod, status: 'PENDING' },
          // Also check previous period in case payment is late
          { vendor: { contains: parsed.vendor.split(' ')[0] }, status: 'PENDING' }
        ]
      },
      orderBy: { dueDate: 'asc' } // Get oldest pending bill first
    })

    if (existingBill) {
      // Mark as paid and update amount if we have it
      await prisma.billInstance.update({
        where: { id: existingBill.id },
        data: {
          status: 'PAID',
          paidDate: new Date(),
          paidVia: parsed.paymentMethod || 'Confirmed via email',
          // Update amount if we have one and the current is 0 or different
          ...(parsed.amount && (Number(existingBill.amount) === 0 || !existingBill.amount)
            ? { amount: parsed.amount }
            : {})
        }
      })

      // Mark all bill splits as paid
      await prisma.billSplit.updateMany({
        where: { billInstanceId: existingBill.id },
        data: {
          status: 'PAID',
          paidDate: new Date()
        }
      })

      await this.markProcessed(email.id, parsed.vendor, existingBill.id)
      return { created: false, billId: existingBill.id, action: 'marked_paid' }
    } else {
      // Create a new bill instance marked as already paid
      const billInstance = await this.createBillInstance(email, parsed, billPeriod, true)
      return { created: true, billId: billInstance?.id, action: 'created_paid' }
    }
  }

  private async handleBillNotification(
    email: EmailData,
    parsed: ParsedBill,
    period: string,
    splitterCount: number
  ): Promise<{ created: boolean; billId?: string; action?: string }> {
    // Find matching recurring bill for better vendor matching
    const recurringBill = await this.matchRecurringBill(email)

    // Determine the period for this bill (handle quarterly bills)
    let billPeriod = period
    if (recurringBill?.frequency === 'QUARTERLY') {
      const now = new Date()
      const quarter = Math.floor(now.getMonth() / 3) + 1
      billPeriod = `${now.getFullYear()}-Q${quarter}`
    }

    // Check if we already have a bill for this vendor/recurring bill this period
    const existingBill = await prisma.billInstance.findFirst({
      where: {
        OR: [
          { recurringBillId: recurringBill?.id, period: billPeriod },
          { vendor: parsed.vendor, period: billPeriod },
          // Also match by partial vendor name
          { vendor: { contains: parsed.vendor.split(' ')[0] }, period: billPeriod }
        ],
        emailId: { not: email.id }
      }
    })

    if (existingBill) {
      // Update amount if we now have one (or if the amount changed for variable bills)
      const shouldUpdateAmount = parsed.amount && (
        !existingBill.amount ||
        Number(existingBill.amount) === 0 ||
        // For variable bills, always update to latest amount
        (recurringBill?.amountType === 'VARIABLE' && parsed.amount !== Number(existingBill.amount))
      )

      if (shouldUpdateAmount && parsed.amount) {
        await prisma.billInstance.update({
          where: { id: existingBill.id },
          data: {
            amount: parsed.amount,
            // Update due date if we have a more specific one
            ...(parsed.dueDate ? { dueDate: new Date(parsed.dueDate) } : {})
          }
        })

        // Update bill split amounts
        const existingSplits = await prisma.billSplit.findMany({
          where: { billInstanceId: existingBill.id }
        })

        if (existingSplits.length > 0 && parsed.amount) {
          // Check if any have custom percentages
          const hasCustomPercents = existingSplits.some(s => s.splitPercent !== null)

          if (hasCustomPercents) {
            // Update based on percentages
            for (const split of existingSplits) {
              const newAmount = split.splitPercent
                ? parsed.amount * (Number(split.splitPercent) / 100)
                : parsed.amount / existingSplits.length
              await prisma.billSplit.update({
                where: { id: split.id },
                data: { amount: newAmount }
              })
            }
          } else {
            // Equal split
            const perPerson = parsed.amount / existingSplits.length
            await prisma.billSplit.updateMany({
              where: { billInstanceId: existingBill.id },
              data: { amount: perPerson }
            })
          }
        }

      }

      await this.markProcessed(email.id, parsed.vendor, existingBill.id)
      return { created: false, billId: existingBill.id, action: 'updated_existing' }
    }

    // Create new bill instance
    const billInstance = await this.createBillInstance(email, parsed, billPeriod, false)
    return { created: true, billId: billInstance?.id, action: 'created_new' }
  }

  private async createBillInstance(
    email: EmailData,
    parsed: ParsedBill,
    period: string,
    isPaid: boolean
  ): Promise<any | null> {
    try {
      // Find matching recurring bill
      const recurringBill = await prisma.recurringBill.findFirst({
        where: {
          vendor: { contains: parsed.vendor.split(' ')[0] },
          active: true
        },
        include: {
          defaultSplitters: true
        }
      })

      // Calculate due date
      let dueDate: Date
      if (parsed.dueDate) {
        dueDate = new Date(parsed.dueDate)
      } else if (recurringBill) {
        // Use recurring bill's due day
        const now = new Date()
        dueDate = new Date(now.getFullYear(), now.getMonth(), recurringBill.dueDay)
        if (dueDate < now) {
          dueDate.setMonth(dueDate.getMonth() + 1)
        }
      } else {
        // Default to end of month
        const now = new Date()
        dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      }

      // Determine amount
      let amount = parsed.amount || 0
      if (!amount && recurringBill?.amountType === 'FIXED' && recurringBill.fixedAmount) {
        amount = Number(recurringBill.fixedAmount)
      }

      // Determine who splits this bill
      let splittersToUse: { id: string; splitPercent?: number }[] = []

      if (recurringBill?.defaultSplitters?.length) {
        // Use recurring bill's default splitters
        splittersToUse = recurringBill.defaultSplitters.map(s => ({
          id: s.teamMemberId,
          splitPercent: s.splitPercent ? Number(s.splitPercent) : undefined
        }))
      } else {
        // Fallback to all team members with splitsExpenses=true
        const defaultSplitters = await prisma.teamMember.findMany({
          where: { splitsExpenses: true, status: 'ACTIVE' },
          select: { id: true }
        })
        splittersToUse = defaultSplitters.map(s => ({ id: s.id }))
      }

      // Create bill instance
      const billInstance = await prisma.billInstance.create({
        data: {
          recurringBillId: recurringBill?.id,
          vendor: parsed.vendor,
          vendorType: parsed.vendorType,
          amount,
          dueDate,
          period,
          status: isPaid ? 'PAID' : 'PENDING',
          paidDate: isPaid ? new Date() : null,
          paidVia: isPaid ? (parsed.paymentMethod || 'Confirmed via email') : null,
          emailId: email.id,
          emailSubject: email.subject,
          emailFrom: email.from
        }
      })

      // Create bill splits
      if (splittersToUse.length > 0) {
        const splits = splittersToUse.map(splitter => {
          let splitAmount: number
          let splitPercent: number | null = null

          if (splitter.splitPercent) {
            splitPercent = splitter.splitPercent
            splitAmount = amount * (splitter.splitPercent / 100)
          } else {
            // Equal split
            splitAmount = amount / splittersToUse.length
          }

          return {
            billInstanceId: billInstance.id,
            teamMemberId: splitter.id,
            amount: splitAmount,
            splitPercent,
            status: isPaid ? 'PAID' : 'PENDING',
            paidDate: isPaid ? new Date() : null
          }
        })

        await prisma.billSplit.createMany({ data: splits })
      }

      await this.markProcessed(email.id, parsed.vendor, billInstance.id)
      return billInstance
    } catch (error: any) {
      console.error('[PARSER] Error creating bill instance')
      return null
    }
  }

  private async markProcessed(emailId: string, vendor?: string, billId?: string): Promise<void> {
    await prisma.processedEmail.create({
      data: {
        emailId,
        vendor,
        billId
      }
    }).catch(() => {
      // Ignore duplicate errors
    })
  }

  /**
   * Process an email and create a ProposedBill instead of BillInstance.
   * All bills require manual approval before being created as actual BillInstances.
   */
  async processEmailToProposed(
    email: EmailData,
    source: 'GMAIL' | 'ZOHO',
    sourceAccountId?: string
  ): Promise<{ created: boolean; proposedBillId?: string; action: string }> {
    // Check if already processed
    const existing = await prisma.processedEmail.findUnique({
      where: { emailId: email.id }
    })

    if (existing) {
      return { created: false, action: 'already_processed' }
    }

    // Check if we already have a proposed bill for this email
    const existingProposed = await prisma.proposedBill.findUnique({
      where: { emailId: email.id }
    })

    if (existingProposed) {
      return { created: false, proposedBillId: existingProposed.id, action: 'already_proposed' }
    }

    // Parse the email
    const parsed = await this.parseEmail(email)

    // Find matching recurring bill if any
    const recurringBill = await this.matchRecurringBill(email)

    // If recurring bill has autoApprove enabled, skip the queue and directly create BillInstance
    if (recurringBill?.autoApprove) {
      const result = await this.processEmail(email)
      // Mark as processed
      await this.markProcessed(email.id, parsed?.vendor || recurringBill.name)
      return {
        created: result.created,
        action: result.created ? 'auto_approved' : 'auto_approve_failed'
      }
    }

    // Create proposed bill regardless of parse result (even low confidence)
    // The human reviewer can decide if it's a real bill
    try {
      const proposedBill = await prisma.proposedBill.create({
        data: {
          source,
          sourceAccountId,
          emailId: email.id,
          emailSubject: email.subject || null,
          emailFrom: email.from,
          emailDate: email.date ? new Date(email.date) : null,
          emailBody: email.body?.substring(0, 10000) || null, // Limit body size

          // Parsed data (may be null/incomplete)
          vendor: parsed?.vendor || this.extractVendorFromEmail(email),
          vendorType: parsed?.vendorType || null,
          amount: parsed?.amount || null,
          dueDate: parsed?.dueDate ? new Date(parsed.dueDate) : null,
          isPaid: parsed?.isPaid || false,
          paymentMethod: parsed?.paymentMethod || null,

          // AI metadata
          confidence: parsed?.confidence || 0,
          parseRawOutput: parsed ? JSON.parse(JSON.stringify(parsed)) : null,

          // Matching
          matchedRecurringBillId: recurringBill?.id || null,

          // Status
          status: 'PENDING'
        }
      })

      // Mark email as processed
      await this.markProcessed(email.id, parsed?.vendor || 'Unknown')

      return { created: true, proposedBillId: proposedBill.id, action: 'proposed' }
    } catch (error: any) {
      console.error('[PARSER] Error creating proposed bill')
      return { created: false, action: 'error' }
    }
  }

  /**
   * Extract a vendor name from the email when AI parsing fails
   */
  private extractVendorFromEmail(email: EmailData): string {
    // Try to extract from the "from" address
    const from = email.from.toLowerCase()

    // Known vendor patterns
    const vendors: Record<string, string> = {
      'duke-energy': 'Duke Energy',
      'duke energy': 'Duke Energy',
      'chase': 'Chase',
      'americanexpress': 'American Express',
      'amex': 'American Express',
      'bankofamerica': 'Bank of America',
      'wells fargo': 'Wells Fargo',
      'verizon': 'Verizon',
      'spectrum': 'Spectrum',
      'comcast': 'Comcast',
      'xfinity': 'Xfinity',
      'zelle': 'Zelle Transfer',
      'venmo': 'Venmo',
      'paypal': 'PayPal'
    }

    for (const [pattern, vendor] of Object.entries(vendors)) {
      if (from.includes(pattern)) {
        return vendor
      }
    }

    // Try to extract from email domain
    const domainMatch = from.match(/@([^>]+)/)
    if (domainMatch) {
      const domain = domainMatch[1].split('.')[0]
      return domain.charAt(0).toUpperCase() + domain.slice(1)
    }

    return 'Unknown Vendor'
  }

  /**
   * Approve a proposed bill - creates BillInstance with splits
   */
  async approveProposedBill(
    proposedBillId: string,
    reviewerId: string,
    overrides?: {
      vendor?: string
      vendorType?: string
      amount?: number
      dueDate?: string
      enableAutoApprove?: boolean
    }
  ): Promise<{ success: boolean; billInstanceId?: string; recurringBillId?: string; error?: string }> {
    try {
      const proposed = await prisma.proposedBill.findUnique({
        where: { id: proposedBillId }
      })

      if (!proposed) {
        return { success: false, error: 'Proposed bill not found' }
      }

      if (proposed.status !== 'PENDING') {
        return { success: false, error: `Bill already ${proposed.status.toLowerCase()}` }
      }

      // Merge overrides with proposed data
      const vendor = overrides?.vendor || proposed.vendor || 'Unknown'
      const vendorType = overrides?.vendorType || proposed.vendorType || 'OTHER'
      const amount = overrides?.amount ?? (proposed.amount ? Number(proposed.amount) : 0)
      const dueDate = overrides?.dueDate
        ? new Date(overrides.dueDate)
        : proposed.dueDate || new Date()

      // Determine period
      const period = dueDate.toISOString().slice(0, 7)

      // Get team members who split expenses
      const splitters = await prisma.teamMember.findMany({
        where: { splitsExpenses: true, status: 'ACTIVE' },
        select: { id: true }
      })

      // Check for linked recurring bill to get default splitters
      let splittersToUse: { id: string; splitPercent?: number }[] = []

      if (proposed.matchedRecurringBillId) {
        const recurring = await prisma.recurringBill.findUnique({
          where: { id: proposed.matchedRecurringBillId },
          include: { defaultSplitters: true }
        })

        if (recurring?.defaultSplitters?.length) {
          splittersToUse = recurring.defaultSplitters.map(s => ({
            id: s.teamMemberId,
            splitPercent: s.splitPercent ? Number(s.splitPercent) : undefined
          }))
        }
      }

      if (splittersToUse.length === 0) {
        splittersToUse = splitters.map(s => ({ id: s.id }))
      }

      // Create bill instance
      const billInstance = await prisma.billInstance.create({
        data: {
          recurringBillId: proposed.matchedRecurringBillId,
          vendor,
          vendorType,
          amount,
          dueDate,
          period,
          status: proposed.isPaid ? 'PAID' : 'PENDING',
          paidDate: proposed.isPaid ? new Date() : null,
          paidVia: proposed.isPaid ? (proposed.paymentMethod || 'Via proposed bill') : null,
          emailId: proposed.emailId,
          emailSubject: proposed.emailSubject,
          emailFrom: proposed.emailFrom
        }
      })

      // Create bill splits
      if (splittersToUse.length > 0 && amount > 0) {
        const splits = splittersToUse.map(splitter => {
          let splitAmount: number
          let splitPercent: number | null = null

          if (splitter.splitPercent) {
            splitPercent = splitter.splitPercent
            splitAmount = amount * (splitter.splitPercent / 100)
          } else {
            splitAmount = amount / splittersToUse.length
          }

          return {
            billInstanceId: billInstance.id,
            teamMemberId: splitter.id,
            amount: splitAmount,
            splitPercent,
            status: proposed.isPaid ? 'PAID' : 'PENDING',
            paidDate: proposed.isPaid ? new Date() : null
          }
        })

        await prisma.billSplit.createMany({ data: splits })
      }

      // Update proposed bill status
      await prisma.proposedBill.update({
        where: { id: proposedBillId },
        data: {
          status: 'APPROVED',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          createdBillInstanceId: billInstance.id
        }
      })

      // Handle auto-approve setting
      let recurringBillId = proposed.matchedRecurringBillId

      if (overrides?.enableAutoApprove) {
        if (recurringBillId) {
          // Update existing recurring bill to enable auto-approve
          await prisma.recurringBill.update({
            where: { id: recurringBillId },
            data: { autoApprove: true }
          })
        } else {
          // Create a new recurring bill with auto-approve enabled
          const newRecurring = await prisma.recurringBill.create({
            data: {
              name: vendor,
              vendorType: vendorType as any,
              expectedAmount: amount,
              frequency: 'MONTHLY', // Default frequency
              isActive: true,
              autoApprove: true,
              defaultSplitters: {
                create: splittersToUse.map(s => ({
                  teamMemberId: s.id,
                  splitPercent: s.splitPercent || null
                }))
              }
            }
          })
          recurringBillId = newRecurring.id

          // Link the bill instance to the new recurring bill
          await prisma.billInstance.update({
            where: { id: billInstance.id },
            data: { recurringBillId: newRecurring.id }
          })
        }
      }

      return { success: true, billInstanceId: billInstance.id, recurringBillId }
    } catch (error: any) {
      console.error('[PARSER] Error approving proposed bill')
      return { success: false, error: error.message }
    }
  }

  /**
   * Reject a proposed bill
   */
  async rejectProposedBill(
    proposedBillId: string,
    reviewerId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const proposed = await prisma.proposedBill.findUnique({
        where: { id: proposedBillId }
      })

      if (!proposed) {
        return { success: false, error: 'Proposed bill not found' }
      }

      if (proposed.status !== 'PENDING') {
        return { success: false, error: `Bill already ${proposed.status.toLowerCase()}` }
      }

      await prisma.proposedBill.update({
        where: { id: proposedBillId },
        data: {
          status: 'REJECTED',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          rejectionReason: reason || null
        }
      })

      return { success: true }
    } catch (error: any) {
      console.error('[PARSER] Error rejecting proposed bill')
      return { success: false, error: error.message }
    }
  }
}

export const billParser = new BillParser()
