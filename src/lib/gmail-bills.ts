import { google } from 'googleapis'
import { prisma } from './prisma'

// Gmail API service for monitoring incoming bill emails
export class GmailBillService {
  private oauth2Client: ReturnType<typeof google.auth.OAuth2>
  private gmail: ReturnType<typeof google.gmail>

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/admin/bills/oauth/callback`
    )

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })
  }

  // Set credentials from database
  async setCredentialsFromDb(accountEmail?: string) {
    const creds = await prisma.gmailCredentials.findFirst({
      where: accountEmail ? { accountEmail } : undefined,
      orderBy: { updatedAt: 'desc' }
    })

    if (creds) {
      this.oauth2Client.setCredentials({
        access_token: creds.accessToken,
        refresh_token: creds.refreshToken,
        expiry_date: creds.tokenExpiry?.getTime()
      })

      // Handle token refresh
      this.oauth2Client.on('tokens', async (tokens) => {
        if (tokens.access_token) {
          await prisma.gmailCredentials.update({
            where: { id: creds.id },
            data: {
              accessToken: tokens.access_token,
              tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
            }
          })
        }
      })

      return true
    }

    return false
  }

  // Generate OAuth URL for initial setup
  getAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      prompt: 'consent'
    })
  }

  // Exchange auth code for tokens and save to database
  async exchangeCodeAndSave(code: string, accountEmail: string) {
    const { tokens } = await this.oauth2Client.getToken(code)
    this.oauth2Client.setCredentials(tokens)

    await prisma.gmailCredentials.upsert({
      where: { accountEmail },
      update: {
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token || '',
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
      },
      create: {
        accountEmail,
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token || ''
      }
    })

    return tokens
  }

  // Build Gmail search query for bill senders
  buildSearchQuery() {
    const senders = [
      'duke-energy.com',           // Duke Energy
      'chase.com',                 // Chase Credit Card
      'americanexpress.com',       // Amex
      'aexp.com',                  // Amex alternate domain
      'toteenterprises.com',       // Trash service
      'pinellascounty.org',        // Pinellas County Utilities (Water)
      'bankofamerica.com',         // BoA balance alerts
      'ealerts.bankofamerica.com'  // BoA alerts alternate
    ]

    // Search for emails from these senders in the last 7 days
    const senderQuery = senders.map(s => `from:${s}`).join(' OR ')
    return `(${senderQuery}) newer_than:7d`
  }

  // Fetch recent emails matching our criteria
  async fetchRecentEmails() {
    const query = this.buildSearchQuery()

    const response = await this.gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 50
    })

    const messages = response.data.messages || []
    const emails: ParsedEmail[] = []

    for (const msg of messages) {
      // Check if already processed
      const existing = await prisma.processedEmail.findUnique({
        where: { emailId: msg.id! }
      })

      if (existing) continue

      const email = await this.getEmailDetails(msg.id!)
      if (email) {
        emails.push(email)
      }
    }

    return emails
  }

  // Get full email details
  async getEmailDetails(messageId: string): Promise<ParsedEmail | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      })

      const message = response.data
      const headers = message.payload?.headers || []

      const getHeader = (name: string) => {
        const header = headers.find(h => h.name?.toLowerCase() === name.toLowerCase())
        return header?.value || ''
      }

      return {
        id: message.id!,
        threadId: message.threadId!,
        from: getHeader('From'),
        to: getHeader('To'),
        subject: getHeader('Subject'),
        date: getHeader('Date'),
        body: this.extractBody(message.payload),
        snippet: message.snippet || ''
      }
    } catch (error: any) {
      console.error(`Error getting email ${messageId}:`, error.message)
      return null
    }
  }

  // Extract email body text
  private extractBody(payload: any): string {
    let body = ''

    if (payload?.body?.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8')
    } else if (payload?.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8')
          break
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8')
        } else if (part.parts) {
          body = this.extractBody(part)
          if (body) break
        }
      }
    }

    return body
  }
}

// Types
export interface ParsedEmail {
  id: string
  threadId: string
  from: string
  to: string
  subject: string
  date: string
  body: string
  snippet: string
}

export interface ParsedBill {
  type: 'bill' | 'balance'
  vendor: string
  vendorType: 'UTILITY' | 'CREDIT_CARD' | 'BANK_ALERT' | 'OTHER'
  icon: string
  amount?: string
  amountNum?: number
  dueDate?: string
  dueDateParsed?: Date
  balance?: string
  accountType?: string
  subject: string
}

// Detect email type based on sender
export function detectEmailType(email: ParsedEmail): string | null {
  const from = email.from.toLowerCase()
  const subject = email.subject.toLowerCase()

  if (from.includes('duke-energy') || from.includes('duke energy')) {
    return 'duke_energy'
  }
  if (from.includes('chase.com') || from.includes('chase')) {
    if (subject.includes('statement') || subject.includes('payment due') ||
        subject.includes('minimum payment') || subject.includes('payment is scheduled') ||
        subject.includes('autopay')) {
      return 'chase_bill'
    }
    return null
  }
  if (from.includes('americanexpress') || from.includes('aexp.com')) {
    if (subject.includes('statement') || subject.includes('payment') || subject.includes('due')) {
      return 'amex_bill'
    }
    return null
  }
  if (from.includes('toteenterprises') || from.includes('tote enterprises')) {
    return 'trash_bill'
  }
  if (from.includes('pinellascounty') || from.includes('pinellas county')) {
    if (subject.includes('water') || subject.includes('utility') || subject.includes('bill')) {
      return 'water_bill'
    }
    return null
  }
  if (from.includes('bankofamerica') || from.includes('ealerts.bankofamerica')) {
    if (subject.includes('welcome') || subject.includes('bonus') || subject.includes('offer')) {
      return null
    }
    if (subject.includes('balance') || subject.includes('account') || subject.includes('alert') ||
        subject.includes('summary') || subject.includes('low balance') || subject.includes('direct deposit')) {
      return 'boa_balance'
    }
    return null
  }

  return null
}

// Parse amount string to number
function parseAmount(amountStr: string): number | undefined {
  const cleaned = amountStr.replace(/[$,]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? undefined : num
}

// Parse date string to Date object
function parseDate(dateStr: string): Date | undefined {
  try {
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return date
    }
  } catch {
    // Try alternative parsing
  }
  return undefined
}

// Parse Duke Energy bill
export function parseDukeEnergy(email: ParsedEmail): ParsedBill {
  const body = email.body || email.snippet

  const amountMatch = body.match(/\$[\d,]+\.?\d*/)
  const amount = amountMatch ? amountMatch[0] : undefined

  const dueDateMatch = body.match(/due\s*(?:date)?[:\s]*(\w+\s+\d{1,2}(?:,?\s*\d{4})?)/i) ||
                       body.match(/(\w+\s+\d{1,2},?\s*\d{4})/)
  const dueDate = dueDateMatch ? dueDateMatch[1] : undefined

  return {
    type: 'bill',
    vendor: 'Duke Energy',
    vendorType: 'UTILITY',
    icon: '⚡',
    amount,
    amountNum: amount ? parseAmount(amount) : undefined,
    dueDate,
    dueDateParsed: dueDate ? parseDate(dueDate) : undefined,
    subject: email.subject
  }
}

// Parse Chase Credit Card bill
export function parseChase(email: ParsedEmail): ParsedBill {
  const body = email.body || email.snippet

  const amountMatch = body.match(/(?:statement balance|amount due|minimum payment)[:\s]*\$?([\d,]+\.?\d*)/i) ||
                      body.match(/\$[\d,]+\.?\d*/)
  const amount = amountMatch ? (amountMatch[1] ? `$${amountMatch[1]}` : amountMatch[0]) : undefined

  const dueDateMatch = body.match(/(?:due date|payment due)[:\s]*(\w+\s+\d{1,2}(?:,?\s*\d{4})?)/i) ||
                       body.match(/due\s+(\w+\s+\d{1,2})/i)
  const dueDate = dueDateMatch ? dueDateMatch[1] : undefined

  return {
    type: 'bill',
    vendor: 'Chase',
    vendorType: 'CREDIT_CARD',
    icon: '💳',
    amount,
    amountNum: amount ? parseAmount(amount) : undefined,
    dueDate,
    dueDateParsed: dueDate ? parseDate(dueDate) : undefined,
    subject: email.subject
  }
}

// Parse American Express bill
export function parseAmex(email: ParsedEmail): ParsedBill {
  const body = email.body || email.snippet

  const amountMatch = body.match(/(?:new balance|statement balance|amount due)[:\s]*\$?([\d,]+\.?\d*)/i) ||
                      body.match(/\$[\d,]+\.?\d*/)
  const amount = amountMatch ? (amountMatch[1] ? `$${amountMatch[1]}` : amountMatch[0]) : undefined

  const dueDateMatch = body.match(/(?:due date|payment due|due by)[:\s]*(\w+\s+\d{1,2}(?:,?\s*\d{4})?)/i)
  const dueDate = dueDateMatch ? dueDateMatch[1] : undefined

  return {
    type: 'bill',
    vendor: 'American Express',
    vendorType: 'CREDIT_CARD',
    icon: '💳',
    amount,
    amountNum: amount ? parseAmount(amount) : undefined,
    dueDate,
    dueDateParsed: dueDate ? parseDate(dueDate) : undefined,
    subject: email.subject
  }
}

// Parse Tote Enterprises (Trash) bill
export function parseTrash(email: ParsedEmail): ParsedBill {
  const body = email.body || email.snippet

  const amountMatch = body.match(/\$[\d,]+\.?\d*/)
  const amount = amountMatch ? amountMatch[0] : undefined

  const dueDateMatch = body.match(/(?:due date|due by|due)[:\s]*(\w+\s+\d{1,2}(?:,?\s*\d{4})?)/i)
  const dueDate = dueDateMatch ? dueDateMatch[1] : undefined

  return {
    type: 'bill',
    vendor: 'Tote (Trash)',
    vendorType: 'UTILITY',
    icon: '🗑️',
    amount,
    amountNum: amount ? parseAmount(amount) : undefined,
    dueDate,
    dueDateParsed: dueDate ? parseDate(dueDate) : undefined,
    subject: email.subject
  }
}

// Parse Pinellas County Utilities (Water) bill
export function parseWater(email: ParsedEmail): ParsedBill {
  const body = email.body || email.snippet

  const amountMatch = body.match(/(?:amount due|total due|balance)[:\s]*\$?([\d,]+\.?\d*)/i) ||
                      body.match(/\$[\d,]+\.?\d*/)
  const amount = amountMatch ? (amountMatch[1] ? `$${amountMatch[1]}` : amountMatch[0]) : undefined

  const dueDateMatch = body.match(/(?:due date|due by|due)[:\s]*(\w+\s+\d{1,2}(?:,?\s*\d{4})?)/i)
  const dueDate = dueDateMatch ? dueDateMatch[1] : undefined

  return {
    type: 'bill',
    vendor: 'Pinellas County Water',
    vendorType: 'UTILITY',
    icon: '💧',
    amount,
    amountNum: amount ? parseAmount(amount) : undefined,
    dueDate,
    dueDateParsed: dueDate ? parseDate(dueDate) : undefined,
    subject: email.subject
  }
}

// Parse Bank of America balance alert
export function parseBoABalance(email: ParsedEmail): ParsedBill {
  const body = email.body || email.snippet

  const balanceMatch = body.match(/(?:available balance|current balance|balance)[:\s]*\$?([\d,]+\.?\d*)/i) ||
                       body.match(/\$[\d,]+\.?\d*/)
  const balance = balanceMatch ? (balanceMatch[1] ? `$${balanceMatch[1]}` : balanceMatch[0]) : undefined

  const accountMatch = body.match(/(checking|savings)/i)
  const accountType = accountMatch ? accountMatch[1].charAt(0).toUpperCase() + accountMatch[1].slice(1) : 'Account'

  return {
    type: 'balance',
    vendor: 'Bank of America',
    vendorType: 'BANK_ALERT',
    icon: '🏦',
    balance,
    amountNum: balance ? parseAmount(balance) : undefined,
    accountType,
    subject: email.subject
  }
}

// Main parse function - routes to appropriate parser
export function parseEmail(email: ParsedEmail): ParsedBill | null {
  const type = detectEmailType(email)

  if (!type) {
    return null
  }

  const parsers: Record<string, (email: ParsedEmail) => ParsedBill> = {
    'duke_energy': parseDukeEnergy,
    'chase_bill': parseChase,
    'amex_bill': parseAmex,
    'trash_bill': parseTrash,
    'water_bill': parseWater,
    'boa_balance': parseBoABalance
  }

  const parser = parsers[type]
  if (!parser) {
    return null
  }

  try {
    return parser(email)
  } catch (error: any) {
    console.error(`Error parsing ${type} email:`, error.message)
    return null
  }
}

// Process emails and save to database
export async function processAndSaveBills(emails: ParsedEmail[]) {
  const results: { created: number; skipped: number; errors: number } = {
    created: 0,
    skipped: 0,
    errors: 0
  }

  for (const email of emails) {
    try {
      const parsed = parseEmail(email)
      if (!parsed) {
        results.skipped++
        continue
      }

      // Skip balance alerts for now (they're not bills)
      if (parsed.type === 'balance') {
        // Mark as processed but don't create a bill
        await prisma.processedEmail.create({
          data: {
            emailId: email.id,
            vendor: parsed.vendor
          }
        })
        results.skipped++
        continue
      }

      // Create bill record
      await prisma.bill.create({
        data: {
          vendor: parsed.vendor,
          vendorType: parsed.vendorType,
          amount: parsed.amountNum || 0,
          dueDate: parsed.dueDateParsed,
          emailId: email.id,
          emailSubject: email.subject,
          emailFrom: email.from,
          emailDate: new Date(email.date),
          status: 'PENDING'
        }
      })

      // Mark email as processed
      await prisma.processedEmail.create({
        data: {
          emailId: email.id,
          vendor: parsed.vendor
        }
      })

      results.created++
    } catch (error: any) {
      console.error(`Error processing email ${email.id}:`, error.message)
      results.errors++
    }
  }

  return results
}

// Singleton instance
let gmailService: GmailBillService | null = null

export function getGmailBillService() {
  if (!gmailService) {
    gmailService = new GmailBillService()
  }
  return gmailService
}
