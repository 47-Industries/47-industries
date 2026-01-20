import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI || 'https://47industries.com/api/oauth/gmail/callback'
)

interface EmailMessage {
  id: string
  from: string
  subject: string
  body: string
  snippet: string
  date: string
}

interface EmailAccountInfo {
  id: string
  email: string
  refreshToken: string
  accessToken?: string
  tokenExpiry?: Date | null
}

export class GmailScanner {
  private processedEmailIds: Set<string> = new Set()

  /**
   * Get refresh tokens from environment variables (legacy support)
   */
  async getRefreshTokens(): Promise<string[]> {
    // Support multiple Gmail accounts
    const tokens: string[] = []
    if (process.env.GMAIL_REFRESH_TOKEN) tokens.push(process.env.GMAIL_REFRESH_TOKEN)
    if (process.env.GMAIL_REFRESH_TOKEN_2) tokens.push(process.env.GMAIL_REFRESH_TOKEN_2)
    if (process.env.GMAIL_REFRESH_TOKEN_3) tokens.push(process.env.GMAIL_REFRESH_TOKEN_3)
    return tokens
  }

  /**
   * Get Gmail accounts from the EmailAccount database table
   */
  async getEmailAccountsFromDb(): Promise<EmailAccountInfo[]> {
    const accounts = await prisma.emailAccount.findMany({
      where: {
        provider: 'GMAIL',
        isActive: true,
        scanForBills: true,
        refreshToken: { not: null }
      },
      select: {
        id: true,
        email: true,
        refreshToken: true,
        accessToken: true,
        tokenExpiry: true
      }
    })

    return accounts
      .filter(a => a.refreshToken)
      .map(a => ({
        id: a.id,
        email: a.email,
        refreshToken: a.refreshToken!,
        accessToken: a.accessToken || undefined,
        tokenExpiry: a.tokenExpiry
      }))
  }

  buildSearchQuery(): string {
    // Search for bill-related emails
    const senders = [
      'duke-energy.com', 'duke energy',
      'chase.com', 'chase',
      'americanexpress.com', 'amex',
      'tote', 'netcomm',
      'pinellas', 'pcumail', 'water',
      'bankofamerica', 'boa', 'bank of america',
      'discover', 'capital one', 'citi',
      'spectrum', 'frontier', 'xfinity', 'comcast',
      'verizon', 't-mobile', 'att.com',
      'zelle', 'venmo', 'paypal'
    ]

    const subjectKeywords = [
      'bill is ready', 'e-bill', 'payment due', 'statement ready',
      'amount due', 'autopay', 'scheduled payment', 'payment confirmation',
      'payment received', 'transfer', 'sent money', 'you sent'
    ]

    const senderQuery = senders.map(s => `from:${s}`).join(' OR ')
    const subjectQuery = subjectKeywords.map(k => `subject:"${k}"`).join(' OR ')

    return `(${senderQuery}) OR (${subjectQuery})`
  }

  async fetchRecentEmails(refreshToken: string, daysBack: number = 1): Promise<EmailMessage[]> {
    oauth2Client.setCredentials({ refresh_token: refreshToken })

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    const afterDate = new Date()
    afterDate.setDate(afterDate.getDate() - daysBack)
    const afterTimestamp = Math.floor(afterDate.getTime() / 1000)

    const query = `${this.buildSearchQuery()} after:${afterTimestamp}`
    console.log(`[GMAIL] Search query: ${query.substring(0, 200)}...`)

    try {
      // First try to get tokens to verify auth works
      const tokens = await oauth2Client.getAccessToken()
      if (!tokens.token) {
        console.error('[GMAIL] Failed to get access token')
        return []
      }
      console.log('[GMAIL] OAuth token obtained successfully')

      const response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 50 // Increased from 20
      })

      console.log(`[GMAIL] API returned ${response.data.messages?.length || 0} messages`)

      const messages = response.data.messages || []
      const emails: EmailMessage[] = []

      for (const msg of messages) {
        if (!msg.id || this.processedEmailIds.has(msg.id)) continue

        try {
          const detail = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'full'
          })

          const headers = detail.data.payload?.headers || []
          const from = headers.find(h => h.name?.toLowerCase() === 'from')?.value || ''
          const subject = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || ''
          const date = headers.find(h => h.name?.toLowerCase() === 'date')?.value || ''

          const body = this.extractBody(detail.data.payload)

          emails.push({
            id: msg.id,
            from,
            subject,
            body,
            snippet: detail.data.snippet || '',
            date
          })

          this.processedEmailIds.add(msg.id)

          // Keep set size manageable
          if (this.processedEmailIds.size > 1000) {
            const arr = Array.from(this.processedEmailIds)
            this.processedEmailIds = new Set(arr.slice(-500))
          }
        } catch (err) {
          console.error(`Error fetching email ${msg.id}:`, err)
        }
      }

      return emails
    } catch (error: any) {
      console.error('[GMAIL] Error fetching emails:', error.message)
      if (error.response?.data) {
        console.error('[GMAIL] API error details:', JSON.stringify(error.response.data))
      }
      return []
    }
  }

  private extractBody(payload: any): string {
    if (!payload) return ''

    // Check for plain text body
    if (payload.mimeType === 'text/plain' && payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8')
    }

    // Check parts recursively
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8')
        }
        if (part.parts) {
          const nested = this.extractBody(part)
          if (nested) return nested
        }
      }

      // Fallback to HTML if no plain text
      for (const part of payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          const html = Buffer.from(part.body.data, 'base64').toString('utf-8')
          // Strip HTML tags for basic text extraction
          return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        }
      }
    }

    return ''
  }

  async fetchFromAllAccounts(daysBack: number = 1): Promise<EmailMessage[]> {
    const allEmails: EmailMessage[] = []

    // First try database accounts
    const dbAccounts = await this.getEmailAccountsFromDb()
    if (dbAccounts.length > 0) {
      console.log(`[GMAIL] Fetching from ${dbAccounts.length} database accounts`)
      for (const account of dbAccounts) {
        try {
          const emails = await this.fetchRecentEmails(account.refreshToken, daysBack)
          allEmails.push(...emails)

          // Update last sync time
          await prisma.emailAccount.update({
            where: { id: account.id },
            data: { lastSyncAt: new Date(), lastSyncError: null }
          })
        } catch (error: any) {
          console.error(`[GMAIL] Error fetching from ${account.email}:`, error.message)
          await prisma.emailAccount.update({
            where: { id: account.id },
            data: { lastSyncError: error.message }
          })
        }
      }
    }

    // Fall back to env var tokens if no database accounts
    if (dbAccounts.length === 0) {
      const tokens = await this.getRefreshTokens()
      console.log(`[GMAIL] Fetching from ${tokens.length} env var accounts`)
      for (const token of tokens) {
        try {
          const emails = await this.fetchRecentEmails(token, daysBack)
          allEmails.push(...emails)
        } catch (error: any) {
          console.error('[GMAIL] Error fetching from env account:', error.message)
        }
      }
    }

    return allEmails
  }

  /**
   * Fetch from all accounts and return with account info for proposed bills
   */
  async fetchFromAllAccountsWithInfo(daysBack: number = 1): Promise<{
    emails: EmailMessage[]
    accountId?: string
    source: 'GMAIL'
  }[]> {
    const results: { emails: EmailMessage[]; accountId?: string; source: 'GMAIL' }[] = []

    // First try database accounts
    const dbAccounts = await this.getEmailAccountsFromDb()
    for (const account of dbAccounts) {
      try {
        const emails = await this.fetchRecentEmails(account.refreshToken, daysBack)
        results.push({ emails, accountId: account.id, source: 'GMAIL' })

        // Update last sync time
        await prisma.emailAccount.update({
          where: { id: account.id },
          data: { lastSyncAt: new Date(), lastSyncError: null }
        })
      } catch (error: any) {
        console.error(`[GMAIL] Error fetching from ${account.email}:`, error.message)
        await prisma.emailAccount.update({
          where: { id: account.id },
          data: { lastSyncError: error.message }
        })
      }
    }

    // Fall back to env var tokens if no database accounts
    if (dbAccounts.length === 0) {
      const tokens = await this.getRefreshTokens()
      for (const token of tokens) {
        try {
          const emails = await this.fetchRecentEmails(token, daysBack)
          results.push({ emails, source: 'GMAIL' })
        } catch (error: any) {
          console.error('[GMAIL] Error fetching from env account:', error.message)
        }
      }
    }

    return results
  }

  async isEmailProcessed(emailId: string): Promise<boolean> {
    const existing = await prisma.processedEmail.findUnique({
      where: { emailId }
    })
    return !!existing
  }

  async markEmailProcessed(emailId: string, vendor?: string, billId?: string): Promise<void> {
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
}

export const gmailScanner = new GmailScanner()
