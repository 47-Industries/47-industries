// Zoho Mail API Integration

const ZOHO_ACCOUNTS_URL = 'https://accounts.zoho.com'
const ZOHO_MAIL_API_URL = 'https://mail.zoho.com/api'

export const ZOHO_CONFIG = {
  clientId: process.env.ZOHO_CLIENT_ID!,
  clientSecret: process.env.ZOHO_CLIENT_SECRET!,
  redirectUri: process.env.ZOHO_REDIRECT_URI || 'https://admin.47industries.com/api/auth/zoho/callback',
  scopes: [
    'ZohoMail.messages.READ',
    'ZohoMail.messages.CREATE',
    'ZohoMail.folders.READ',
    'ZohoMail.accounts.READ',
  ],
}

// Generate OAuth authorization URL
export function getZohoAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: ZOHO_CONFIG.clientId,
    response_type: 'code',
    redirect_uri: ZOHO_CONFIG.redirectUri,
    scope: ZOHO_CONFIG.scopes.join(','),
    access_type: 'offline',
    prompt: 'consent',
  })

  if (state) {
    params.append('state', state)
  }

  return `${ZOHO_ACCOUNTS_URL}/oauth/v2/auth?${params.toString()}`
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}> {
  const response = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: ZOHO_CONFIG.clientId,
      client_secret: ZOHO_CONFIG.clientSecret,
      redirect_uri: ZOHO_CONFIG.redirectUri,
      code,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code: ${error}`)
  }

  return response.json()
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string
  expires_in: number
  token_type: string
}> {
  const response = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: ZOHO_CONFIG.clientId,
      client_secret: ZOHO_CONFIG.clientSecret,
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to refresh token: ${error}`)
  }

  return response.json()
}

// Zoho Mail API client
export class ZohoMailClient {
  private accessToken: string
  private accountId: string | null = null

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${ZOHO_MAIL_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Zoho API error: ${error}`)
    }

    return response.json()
  }

  // Get all accounts (mailboxes)
  async getAccounts(): Promise<any[]> {
    const data = await this.request('/accounts')
    return data.data || []
  }

  // Get account ID (use first account by default)
  async getAccountId(): Promise<string> {
    if (this.accountId) return this.accountId

    const accounts = await this.getAccounts()
    if (accounts.length === 0) {
      throw new Error('No Zoho Mail accounts found')
    }

    this.accountId = accounts[0].accountId
    return this.accountId!
  }

  // Get all folders for an account
  async getFolders(accountId?: string): Promise<any[]> {
    const accId = accountId || await this.getAccountId()
    const data = await this.request(`/accounts/${accId}/folders`)
    return data.data || []
  }

  // Get emails from a folder
  async getEmails(options: {
    accountId?: string
    folderId?: string
    limit?: number
    start?: number
  } = {}): Promise<any[]> {
    const accId = options.accountId || await this.getAccountId()

    // First get all folders to find the folder ID
    const folders = await this.getFolders(accId)

    // Find folder by name (inbox, sent, drafts, trash, etc)
    let targetFolderId: string | null = null
    if (options.folderId) {
      const folder = folders.find((f: any) =>
        f.folderName?.toLowerCase() === options.folderId?.toLowerCase() ||
        f.path?.toLowerCase() === options.folderId?.toLowerCase()
      )
      targetFolderId = folder?.folderId
    }

    // If no folder found, use inbox by default
    if (!targetFolderId) {
      const inboxFolder = folders.find((f: any) =>
        f.folderName?.toLowerCase() === 'inbox'
      )
      targetFolderId = inboxFolder?.folderId
    }

    if (!targetFolderId) {
      return []
    }

    const params = new URLSearchParams()
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.start) params.append('start', options.start.toString())

    const endpoint = `/accounts/${accId}/folders/${targetFolderId}/messages?${params.toString()}`
    const data = await this.request(endpoint)
    return data.data || []
  }

  // Get a single email by ID
  async getEmail(messageId: string, accountId?: string): Promise<any> {
    const accId = accountId || await this.getAccountId()
    const data = await this.request(`/accounts/${accId}/messages/${messageId}`)
    return data.data
  }

  // Get email content/body
  async getEmailContent(messageId: string, accountId?: string): Promise<any> {
    const accId = accountId || await this.getAccountId()
    const data = await this.request(`/accounts/${accId}/messages/${messageId}/content`)
    return data.data
  }

  // Search emails
  async searchEmails(query: string, options: {
    accountId?: string
    limit?: number
    start?: number
  } = {}): Promise<any[]> {
    const accId = options.accountId || await this.getAccountId()

    const params = new URLSearchParams({
      searchKey: query,
    })
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.start) params.append('start', options.start.toString())

    const data = await this.request(`/accounts/${accId}/messages/search?${params.toString()}`)
    return data.data || []
  }

  // Send an email
  async sendEmail(options: {
    accountId?: string
    fromAddress: string
    toAddress: string
    ccAddress?: string
    bccAddress?: string
    subject: string
    content: string
    isHtml?: boolean
  }): Promise<any> {
    const accId = options.accountId || await this.getAccountId()

    const data = await this.request(`/accounts/${accId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        fromAddress: options.fromAddress,
        toAddress: options.toAddress,
        ccAddress: options.ccAddress,
        bccAddress: options.bccAddress,
        subject: options.subject,
        content: options.content,
        mailFormat: options.isHtml ? 'html' : 'plaintext',
      }),
    })

    return data.data
  }

  // Reply to an email
  async replyToEmail(messageId: string, options: {
    accountId?: string
    fromAddress: string
    toAddress: string
    ccAddress?: string
    subject: string
    content: string
    isHtml?: boolean
    replyAll?: boolean
  }): Promise<any> {
    const accId = options.accountId || await this.getAccountId()

    const data = await this.request(`/accounts/${accId}/messages/${messageId}`, {
      method: 'POST',
      body: JSON.stringify({
        fromAddress: options.fromAddress,
        toAddress: options.toAddress,
        ccAddress: options.ccAddress,
        subject: options.subject,
        content: options.content,
        mailFormat: options.isHtml ? 'html' : 'plaintext',
        action: options.replyAll ? 'replyall' : 'reply',
      }),
    })

    return data.data
  }

  // Mark email as read/unread
  async markAsRead(messageId: string, read: boolean = true, accountId?: string): Promise<void> {
    const accId = accountId || await this.getAccountId()

    await this.request(`/accounts/${accId}/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({
        mode: read ? 'markAsRead' : 'markAsUnread',
      }),
    })
  }

  // Move email to folder
  async moveToFolder(messageId: string, folderId: string, accountId?: string): Promise<void> {
    const accId = accountId || await this.getAccountId()

    await this.request(`/accounts/${accId}/messages/${messageId}/move`, {
      method: 'PUT',
      body: JSON.stringify({
        destfolderId: folderId,
      }),
    })
  }

  // Delete email (move to trash)
  async deleteEmail(messageId: string, accountId?: string): Promise<void> {
    const accId = accountId || await this.getAccountId()
    await this.request(`/accounts/${accId}/messages/${messageId}/trash`, {
      method: 'PUT',
    })
  }
}
