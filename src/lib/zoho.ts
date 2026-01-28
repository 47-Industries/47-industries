// Zoho Mail API Integration

const ZOHO_ACCOUNTS_URL = 'https://accounts.zoho.com'
const ZOHO_MAIL_API_URL = 'https://mail.zoho.com/api'

export const ZOHO_CONFIG = {
  clientId: process.env.ZOHO_CLIENT_ID!,
  clientSecret: process.env.ZOHO_CLIENT_SECRET!,
  redirectUri: process.env.ZOHO_REDIRECT_URI || 'https://admin.47industries.com/api/auth/zoho/callback',
  scopes: [
    'ZohoMail.messages.ALL',
    'ZohoMail.folders.ALL',
    'ZohoMail.accounts.READ',
    'ZohoMail.organization.accounts.READ',
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

  // Get all "from" addresses (includes group emails/aliases)
  async getFromAddresses(accountId?: string): Promise<any[]> {
    const accId = accountId || await this.getAccountId()
    try {
      const data = await this.request(`/accounts/${accId}/sendmaildetails`)
      return data.data?.sendMailDetails || []
    } catch (e) {
      console.error('[ZOHO] Error getting from addresses')
      return []
    }
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

    const params = new URLSearchParams()
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.start) params.append('start', options.start.toString())

    // If folder specified, get the folder ID first
    if (options.folderId && options.folderId !== 'all') {
      try {
        const folders = await this.getFolders(accId)
        const folder = folders.find((f: any) =>
          f.folderName?.toLowerCase() === options.folderId?.toLowerCase() ||
          f.path?.toLowerCase() === options.folderId?.toLowerCase()
        )
        if (folder?.folderId) {
          params.append('folderId', folder.folderId)
        }
      } catch (e) {
        console.error('[ZOHO] Error getting folders')
        // Continue without folder filter
      }
    }

    const endpoint = `/accounts/${accId}/messages/view?${params.toString()}`
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
  async getEmailContent(messageId: string, folderId?: string, accountId?: string): Promise<any> {
    const accId = accountId || await this.getAccountId()

    // If no folderId provided, try to get it from inbox
    let folderIdToUse = folderId
    if (!folderIdToUse) {
      try {
        const folders = await this.getFolders(accId)
        const inbox = folders.find((f: any) => f.folderName?.toLowerCase() === 'inbox')
        folderIdToUse = inbox?.folderId
      } catch (e) {
        console.error('[ZOHO] Error getting folders for content')
      }
    }

    // Try with folderId first, fall back to without
    try {
      if (folderIdToUse) {
        const data = await this.request(`/accounts/${accId}/folders/${folderIdToUse}/messages/${messageId}/content`)
        return data.data
      }
    } catch (e) {
      console.error('[ZOHO] Error with folder path, trying direct')
    }

    // Fallback to direct message content endpoint
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
    headers?: Record<string, string>  // Custom email headers for threading
  }): Promise<any> {
    const accId = options.accountId || await this.getAccountId()

    const requestBody: any = {
      fromAddress: options.fromAddress,
      toAddress: options.toAddress,
      ccAddress: options.ccAddress,
      bccAddress: options.bccAddress,
      subject: options.subject,
      content: options.content,
      mailFormat: options.isHtml ? 'html' : 'plaintext',
    }

    // Add custom headers if provided (for email threading)
    if (options.headers && Object.keys(options.headers).length > 0) {
      requestBody.customHeaders = options.headers
    }

    const data = await this.request(`/accounts/${accId}/messages`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
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

  // ==================== ATTACHMENTS ====================

  // Get attachments for an email
  async getAttachments(messageId: string, folderId: string, accountId?: string): Promise<any[]> {
    const accId = accountId || await this.getAccountId()
    try {
      const data = await this.request(`/accounts/${accId}/folders/${folderId}/messages/${messageId}/attachmentinfo`)
      return data.data?.attachments || []
    } catch (e) {
      console.error('[ZOHO] Error getting attachments')
      return []
    }
  }

  // Download attachment - returns the download URL
  getAttachmentDownloadUrl(messageId: string, attachmentId: string, attachmentName: string, folderId: string, accountId: string): string {
    return `${ZOHO_MAIL_API_URL}/accounts/${accountId}/folders/${folderId}/messages/${messageId}/attachments/${attachmentId}?name=${encodeURIComponent(attachmentName)}`
  }

  // Upload attachment for sending
  async uploadAttachment(file: Buffer, fileName: string, accountId?: string): Promise<{ storeName: string }> {
    const accId = accountId || await this.getAccountId()

    const formData = new FormData()
    const blob = new Blob([new Uint8Array(file)])
    formData.append('attach', blob, fileName)

    const response = await fetch(`${ZOHO_MAIL_API_URL}/accounts/${accId}/messages/attachments?fileName=${encodeURIComponent(fileName)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to upload attachment: ${error}`)
    }

    const data = await response.json()
    return data.data
  }

  // Send email with attachments
  async sendEmailWithAttachments(options: {
    accountId?: string
    fromAddress: string
    toAddress: string
    ccAddress?: string
    bccAddress?: string
    subject: string
    content: string
    isHtml?: boolean
    attachments?: { storeName: string }[]
  }): Promise<any> {
    const accId = options.accountId || await this.getAccountId()

    const body: any = {
      fromAddress: options.fromAddress,
      toAddress: options.toAddress,
      subject: options.subject,
      content: options.content,
      mailFormat: options.isHtml ? 'html' : 'plaintext',
    }

    if (options.ccAddress) body.ccAddress = options.ccAddress
    if (options.bccAddress) body.bccAddress = options.bccAddress
    if (options.attachments && options.attachments.length > 0) {
      body.attachments = options.attachments
    }

    const data = await this.request(`/accounts/${accId}/messages`, {
      method: 'POST',
      body: JSON.stringify(body),
    })

    return data.data
  }

  // ==================== LABELS ====================

  // Get all labels/tags
  async getLabels(accountId?: string): Promise<any[]> {
    const accId = accountId || await this.getAccountId()
    try {
      const data = await this.request(`/accounts/${accId}/tags`)
      return data.data || []
    } catch (e) {
      console.error('[ZOHO] Error getting labels')
      return []
    }
  }

  // Create a new label
  async createLabel(name: string, color?: string, accountId?: string): Promise<any> {
    const accId = accountId || await this.getAccountId()
    const body: any = { tagName: name }
    if (color) body.color = color

    const data = await this.request(`/accounts/${accId}/tags`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return data.data
  }

  // Update a label
  async updateLabel(labelId: string, name: string, color?: string, accountId?: string): Promise<any> {
    const accId = accountId || await this.getAccountId()
    const body: any = { tagName: name }
    if (color) body.color = color

    const data = await this.request(`/accounts/${accId}/tags/${labelId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
    return data.data
  }

  // Delete a label
  async deleteLabel(labelId: string, accountId?: string): Promise<void> {
    const accId = accountId || await this.getAccountId()
    await this.request(`/accounts/${accId}/tags/${labelId}`, {
      method: 'DELETE',
    })
  }

  // Apply label to message
  async applyLabel(messageId: string, labelId: string, accountId?: string): Promise<void> {
    const accId = accountId || await this.getAccountId()
    await this.request(`/accounts/${accId}/updatemessage`, {
      method: 'PUT',
      body: JSON.stringify({
        mode: 'addTag',
        messageId: [messageId],
        tagId: labelId,
      }),
    })
  }

  // Remove label from message
  async removeLabel(messageId: string, labelId: string, accountId?: string): Promise<void> {
    const accId = accountId || await this.getAccountId()
    await this.request(`/accounts/${accId}/updatemessage`, {
      method: 'PUT',
      body: JSON.stringify({
        mode: 'removeTag',
        messageId: [messageId],
        tagId: labelId,
      }),
    })
  }

  // ==================== FOLDERS ====================

  // Create a new folder
  async createFolder(name: string, parentFolderId?: string, accountId?: string): Promise<any> {
    const accId = accountId || await this.getAccountId()
    const body: any = { folderName: name }
    if (parentFolderId) body.parentFolderId = parentFolderId

    const data = await this.request(`/accounts/${accId}/folders`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return data.data
  }

  // Rename a folder
  async renameFolder(folderId: string, name: string, accountId?: string): Promise<any> {
    const accId = accountId || await this.getAccountId()
    const data = await this.request(`/accounts/${accId}/folders/${folderId}`, {
      method: 'PUT',
      body: JSON.stringify({
        mode: 'rename',
        folderName: name,
      }),
    })
    return data.data
  }

  // Delete a folder
  async deleteFolder(folderId: string, accountId?: string): Promise<void> {
    const accId = accountId || await this.getAccountId()
    await this.request(`/accounts/${accId}/folders/${folderId}`, {
      method: 'DELETE',
    })
  }

  // ==================== EMAIL ACTIONS ====================

  // Mark as spam
  async markAsSpam(messageId: string, accountId?: string): Promise<void> {
    const accId = accountId || await this.getAccountId()
    await this.request(`/accounts/${accId}/updatemessage`, {
      method: 'PUT',
      body: JSON.stringify({
        mode: 'markSpam',
        messageId: [messageId],
      }),
    })
  }

  // Mark as not spam
  async markAsNotSpam(messageId: string, accountId?: string): Promise<void> {
    const accId = accountId || await this.getAccountId()
    await this.request(`/accounts/${accId}/updatemessage`, {
      method: 'PUT',
      body: JSON.stringify({
        mode: 'unmarkSpam',
        messageId: [messageId],
      }),
    })
  }

  // Flag/star email
  async flagEmail(messageId: string, flagged: boolean = true, accountId?: string): Promise<void> {
    const accId = accountId || await this.getAccountId()
    await this.request(`/accounts/${accId}/updatemessage`, {
      method: 'PUT',
      body: JSON.stringify({
        mode: flagged ? 'flagMail' : 'unflagMail',
        messageId: [messageId],
      }),
    })
  }

  // Archive email
  async archiveEmail(messageId: string, accountId?: string): Promise<void> {
    const accId = accountId || await this.getAccountId()
    await this.request(`/accounts/${accId}/updatemessage`, {
      method: 'PUT',
      body: JSON.stringify({
        mode: 'archive',
        messageId: [messageId],
      }),
    })
  }
}
