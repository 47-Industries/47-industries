import { prisma } from '@/lib/prisma'
import { ZohoMailClient, refreshAccessToken } from '@/lib/zoho'
import { billParser } from '@/lib/bill-parser'

interface EmailData {
  id: string
  from: string
  subject: string
  body: string
  snippet: string
  date: string
}

/**
 * Zoho Bill Scanner - Scans Zoho email accounts for bill-related emails
 */
export class ZohoBillScanner {
  // Search keywords for bill-related emails
  private billKeywords = [
    'bill is ready',
    'payment due',
    'statement ready',
    'amount due',
    'autopay',
    'payment confirmation',
    'payment received',
    'transfer complete',
    'you sent',
    'sent money'
  ]

  // Known bill senders
  private billSenders = [
    'duke-energy', 'duke energy',
    'chase', 'americanexpress', 'amex',
    'bankofamerica', 'bank of america',
    'wells fargo', 'verizon', 'spectrum',
    'comcast', 'xfinity', 'zelle', 'venmo', 'paypal',
    'tote', 'netcomm', 'pinellas', 'pcumail'
  ]

  /**
   * Scan a specific Zoho email account for bills
   */
  async scanAccount(accountId: string, daysBack: number = 7): Promise<{
    emails: EmailData[]
    error?: string
  }> {
    try {
      // Get email account from database
      const emailAccount = await prisma.emailAccount.findUnique({
        where: { id: accountId }
      })

      if (!emailAccount) {
        return { emails: [], error: 'Email account not found' }
      }

      if (emailAccount.provider !== 'ZOHO') {
        return { emails: [], error: 'Not a Zoho account' }
      }

      if (!emailAccount.isActive || !emailAccount.scanForBills) {
        return { emails: [], error: 'Account not active or not configured for bill scanning' }
      }

      // Check if token needs refresh
      let accessToken = emailAccount.accessToken
      if (!accessToken) {
        return { emails: [], error: 'No access token' }
      }

      // Refresh token if expired
      if (emailAccount.tokenExpiry && new Date() > emailAccount.tokenExpiry) {
        if (!emailAccount.refreshToken) {
          return { emails: [], error: 'Token expired and no refresh token available' }
        }

        try {
          const newTokens = await refreshAccessToken(emailAccount.refreshToken)
          accessToken = newTokens.access_token

          await prisma.emailAccount.update({
            where: { id: accountId },
            data: {
              accessToken: newTokens.access_token,
              tokenExpiry: new Date(Date.now() + newTokens.expires_in * 1000)
            }
          })
        } catch (err: any) {
          console.error(`[ZOHO_SCANNER] Failed to refresh token for ${emailAccount.email}:`, err.message)
          await prisma.emailAccount.update({
            where: { id: accountId },
            data: { lastSyncError: `Token refresh failed: ${err.message}` }
          })
          return { emails: [], error: `Token refresh failed: ${err.message}` }
        }
      }

      // Create Zoho client
      const zoho = new ZohoMailClient(accessToken)

      // Get Zoho account ID if not stored
      let zohoAccountId = emailAccount.zohoAccountId
      if (!zohoAccountId) {
        try {
          zohoAccountId = await zoho.getAccountId()
          await prisma.emailAccount.update({
            where: { id: accountId },
            data: { zohoAccountId }
          })
        } catch (err: any) {
          console.error(`[ZOHO_SCANNER] Failed to get Zoho account ID:`, err.message)
          return { emails: [], error: `Failed to get Zoho account ID: ${err.message}` }
        }
      }

      // Search for bill-related emails
      const emails: EmailData[] = []
      const searchQuery = this.buildSearchQuery()

      try {
        // Search for emails matching our criteria
        const messages = await zoho.searchEmails(searchQuery, {
          accountId: zohoAccountId,
          limit: 50
        })

        console.log(`[ZOHO_SCANNER] Found ${messages.length} potential bill emails for ${emailAccount.email}`)

        // Fetch full details for each message
        for (const msg of messages) {
          try {
            // Check if already processed
            const existing = await prisma.processedEmail.findUnique({
              where: { emailId: msg.messageId || msg.mid }
            })

            if (existing) continue

            // Check email date
            const emailDate = new Date(msg.receivedTime || msg.date || Date.now())
            const cutoffDate = new Date()
            cutoffDate.setDate(cutoffDate.getDate() - daysBack)

            if (emailDate < cutoffDate) continue

            // Get email content
            const content = await zoho.getEmailContent(msg.messageId || msg.mid, undefined, zohoAccountId)

            emails.push({
              id: msg.messageId || msg.mid,
              from: msg.fromAddress || msg.from || '',
              subject: msg.subject || '',
              body: content?.content || msg.summary || '',
              snippet: msg.summary || '',
              date: new Date(msg.receivedTime || msg.date || Date.now()).toISOString()
            })
          } catch (err: any) {
            console.error(`[ZOHO_SCANNER] Error fetching email ${msg.messageId}:`, err.message)
          }
        }

        // Update last sync time
        await prisma.emailAccount.update({
          where: { id: accountId },
          data: {
            lastSyncAt: new Date(),
            lastSyncError: null
          }
        })

        return { emails }
      } catch (err: any) {
        console.error(`[ZOHO_SCANNER] Search error for ${emailAccount.email}:`, err.message)
        await prisma.emailAccount.update({
          where: { id: accountId },
          data: { lastSyncError: err.message }
        })
        return { emails: [], error: err.message }
      }
    } catch (err: any) {
      console.error(`[ZOHO_SCANNER] Error scanning account ${accountId}:`, err.message)
      return { emails: [], error: err.message }
    }
  }

  /**
   * Scan all active Zoho accounts for bills
   */
  async scanAllAccounts(daysBack: number = 7): Promise<{
    totalEmails: number
    proposedBills: number
    errors: string[]
  }> {
    const results = {
      totalEmails: 0,
      proposedBills: 0,
      errors: [] as string[]
    }

    // Get all active Zoho accounts
    const accounts = await prisma.emailAccount.findMany({
      where: {
        provider: 'ZOHO',
        isActive: true,
        scanForBills: true
      }
    })

    console.log(`[ZOHO_SCANNER] Scanning ${accounts.length} Zoho accounts`)

    for (const account of accounts) {
      try {
        const { emails, error } = await this.scanAccount(account.id, daysBack)

        if (error) {
          results.errors.push(`${account.email}: ${error}`)
          continue
        }

        results.totalEmails += emails.length

        // Process each email to create proposed bills
        for (const email of emails) {
          const result = await billParser.processEmailToProposed(email, 'ZOHO', account.id)
          if (result.created) {
            results.proposedBills++
          }
        }
      } catch (err: any) {
        results.errors.push(`${account.email}: ${err.message}`)
      }
    }

    console.log(`[ZOHO_SCANNER] Scan complete: ${results.totalEmails} emails, ${results.proposedBills} proposed bills`)
    return results
  }

  /**
   * Build search query for bill-related emails
   */
  private buildSearchQuery(): string {
    // Zoho search uses different syntax than Gmail
    // Combine keywords and senders
    const keywordParts = this.billKeywords.map(k => `subject:"${k}"`).join(' OR ')
    const senderParts = this.billSenders.map(s => `from:${s}`).join(' OR ')

    return `(${keywordParts}) OR (${senderParts})`
  }
}

export const zohoBillScanner = new ZohoBillScanner()
