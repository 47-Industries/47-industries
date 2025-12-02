'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Email {
  messageId: string
  subject: string
  fromAddress: string
  toAddress: string
  receivedTime: number | string
  summary: string
  isRead: boolean
  hasAttachment: boolean
  folderId?: string
  threadId?: string
}

interface Signature {
  id: string
  name: string
  content: string
  isDefault: boolean
  forAddress: string | null
}

interface Label {
  tagId: string
  tagName: string
  color?: string
}

interface Attachment {
  attachmentId: string
  attachmentName: string
  attachmentSize: number
  downloadUrl: string
}

interface UploadedAttachment {
  storeName: string
  fileName: string
  fileSize: number
}

interface EmailLog {
  id: string
  userName: string
  fromAddress: string
  toAddress: string
  subject: string
  createdAt: string
  status: string
}

interface Mailbox {
  id: string
  label: string
  email: string | null
}

const FOLDERS = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'sent', label: 'Sent' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'trash', label: 'Trash' },
]

function EmailPageContent() {
  const searchParams = useSearchParams()
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [emailContent, setEmailContent] = useState<string>('')
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [selectedMailbox, setSelectedMailbox] = useState('all')
  const [selectedFolder, setSelectedFolder] = useState('inbox')
  const [searchQuery, setSearchQuery] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const [composeData, setComposeData] = useState({
    from: 'support@47industries.com',
    to: '',
    cc: '',
    subject: '',
    content: '',
  })
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [selectedSignature, setSelectedSignature] = useState<string>('')
  const [labels, setLabels] = useState<Label[]>([])
  const [isLoadingLabels, setIsLoadingLabels] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false)
  const [uploadedAttachments, setUploadedAttachments] = useState<UploadedAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [sentByAdmin, setSentByAdmin] = useState<string | null>(null)
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([{ id: 'all', label: 'All Inboxes', email: null }])
  const [showExternalImages, setShowExternalImages] = useState(false)

  // Mobile state
  const [isMobile, setIsMobile] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list')

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Check for success message from OAuth callback
  useEffect(() => {
    if (searchParams.get('success') === 'connected') {
      setIsConnected(true)
    }
  }, [searchParams])

  // Check connection status and fetch emails
  useEffect(() => {
    checkConnectionAndFetchEmails()
  }, [selectedFolder, selectedMailbox])

  // Auto-refresh emails every 30 seconds
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      // Silent refresh - don't show loading state
      fetchEmailsSilent()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [isConnected, selectedFolder, selectedMailbox])

  // Fetch signatures, labels, and mailboxes on mount
  useEffect(() => {
    fetchSignatures()
    fetchLabels()
    fetchMailboxes()
  }, [])

  async function checkConnectionAndFetchEmails() {
    setIsLoading(true)
    try {
      // Build query params
      const params = new URLSearchParams()
      params.append('folder', selectedFolder)

      // Get mailbox email address if not "all"
      if (selectedMailbox !== 'all') {
        const mailboxConfig = mailboxes.find(m => m.id === selectedMailbox)
        if (mailboxConfig?.email) {
          params.append('mailbox', mailboxConfig.email)
        }
      }

      const response = await fetch(`/api/admin/email/inbox?${params.toString()}`)
      const data = await response.json()

      if (data.needsAuth) {
        setIsConnected(false)
      } else if (data.emails) {
        setIsConnected(true)
        setEmails(data.emails)
      }
    } catch (error) {
      console.error('Error fetching emails:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Silent fetch for auto-refresh (no loading spinner)
  async function fetchEmailsSilent() {
    try {
      const params = new URLSearchParams()
      params.append('folder', selectedFolder)

      if (selectedMailbox !== 'all') {
        const mailboxConfig = mailboxes.find(m => m.id === selectedMailbox)
        if (mailboxConfig?.email) {
          params.append('mailbox', mailboxConfig.email)
        }
      }

      const response = await fetch(`/api/admin/email/inbox?${params.toString()}`)
      const data = await response.json()

      if (data.emails) {
        // Check if there are new emails
        const currentIds = new Set(emails.map(e => e.messageId))
        const newEmails = data.emails.filter((e: Email) => !currentIds.has(e.messageId))

        if (newEmails.length > 0) {
          // Update the list with new emails
          setEmails(data.emails)
        }
      }
    } catch (error) {
      console.error('Error in silent fetch:', error)
    }
  }

  async function fetchMailboxes() {
    try {
      const response = await fetch('/api/admin/email/accounts')
      const data = await response.json()
      if (data.mailboxes) {
        // Add "All Inboxes" option at the start
        setMailboxes([
          { id: 'all', label: 'All Inboxes', email: null },
          ...data.mailboxes,
        ])
        // Set default "from" address to first actual mailbox
        if (data.mailboxes.length > 0 && data.mailboxes[0].email) {
          setComposeData(prev => ({ ...prev, from: data.mailboxes[0].email }))
        }
      }
    } catch (error) {
      console.error('Error fetching mailboxes:', error)
    }
  }

  async function connectZoho() {
    try {
      const response = await fetch('/api/admin/email/connect')
      const data = await response.json()

      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Error connecting to Zoho:', error)
    }
  }

  async function fetchSignatures() {
    try {
      const response = await fetch('/api/admin/email/signatures')
      const data = await response.json()
      if (data.signatures) {
        setSignatures(data.signatures)
        // Auto-select default signature
        const defaultSig = data.signatures.find((s: Signature) => s.isDefault)
        if (defaultSig) {
          setSelectedSignature(defaultSig.id)
        }
      }
    } catch (error) {
      console.error('Error fetching signatures:', error)
    }
  }

  async function fetchLabels() {
    setIsLoadingLabels(true)
    try {
      const response = await fetch('/api/admin/email/labels')
      const data = await response.json()
      if (data.labels) {
        setLabels(data.labels)
      }
    } catch (error) {
      console.error('Error fetching labels:', error)
    } finally {
      setIsLoadingLabels(false)
    }
  }

  function getSignatureForEmail(emailAddress: string): Signature | undefined {
    // First try to find signature specific to this email address
    const specificSig = signatures.find(s => s.forAddress === emailAddress)
    if (specificSig) return specificSig
    // Fall back to default signature
    return signatures.find(s => s.isDefault)
  }

  function applySignature(signatureId: string) {
    const sig = signatures.find(s => s.id === signatureId)
    if (sig) {
      setSelectedSignature(signatureId)
      // Append signature to content with separator
      const separator = '<br><br>--<br>'
      setComposeData(prev => ({
        ...prev,
        content: prev.content.replace(/(<br><br>--<br>)[\s\S]*$/, '') + separator + sig.content
      }))
    }
  }

  async function fetchEmailContent(messageId: string) {
    setIsLoadingContent(true)
    setEmailContent('')
    try {
      const response = await fetch(`/api/admin/email/${messageId}`)
      const data = await response.json()
      if (data.content?.content) {
        setEmailContent(data.content.content)
      } else if (typeof data.content === 'string') {
        setEmailContent(data.content)
      }
    } catch (error) {
      console.error('Error fetching email content:', error)
    } finally {
      setIsLoadingContent(false)
    }
  }

  async function fetchAttachments(messageId: string) {
    setIsLoadingAttachments(true)
    setAttachments([])
    try {
      const response = await fetch(`/api/admin/email/${messageId}/attachments`)
      const data = await response.json()
      if (data.attachments) {
        setAttachments(data.attachments)
      }
    } catch (error) {
      console.error('Error fetching attachments:', error)
    } finally {
      setIsLoadingAttachments(false)
    }
  }

  async function uploadAttachment(file: File) {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/email/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setUploadedAttachments(prev => [...prev, {
          storeName: data.storeName,
          fileName: data.fileName,
          fileSize: data.fileSize,
        }])
      } else {
        alert('Failed to upload attachment: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error uploading attachment:', error)
      alert('Failed to upload attachment')
    } finally {
      setIsUploading(false)
    }
  }

  function removeUploadedAttachment(index: number) {
    setUploadedAttachments(prev => prev.filter((_, i) => i !== index))
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  async function fetchSentByAdmin(email: Email) {
    // For sent emails, look up who actually sent it from our logs
    setSentByAdmin(null)
    try {
      const params = new URLSearchParams({
        subject: email.subject,
        to: email.toAddress?.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/[<>]/g, '').trim() || '',
      })
      const response = await fetch(`/api/admin/email/logs?${params.toString()}`)
      const data = await response.json()
      if (data.logs && data.logs.length > 0) {
        // Find matching log entry
        const log = data.logs[0]
        setSentByAdmin(log.userName)
      }
    } catch (error) {
      console.error('Error fetching sent by info:', error)
    }
  }

  function handleSelectEmail(email: Email) {
    setSelectedEmail(email)
    setShowExternalImages(false)
    fetchEmailContent(email.messageId)
    if (email.hasAttachment) {
      fetchAttachments(email.messageId)
    } else {
      setAttachments([])
    }
    // For sent folder, fetch who sent it
    if (selectedFolder === 'sent') {
      fetchSentByAdmin(email)
    } else {
      setSentByAdmin(null)
    }
    // On mobile, switch to detail view
    if (isMobile) {
      setMobileView('detail')
    }
  }

  function handleBackToList() {
    setMobileView('list')
    setSelectedEmail(null)
  }

  async function sendEmail() {
    try {
      const response = await fetch('/api/admin/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: composeData.from,
          to: composeData.to,
          cc: composeData.cc || undefined,
          subject: composeData.subject,
          content: composeData.content,
          isHtml: true,
          attachments: uploadedAttachments.map(a => ({ storeName: a.storeName })),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setIsComposing(false)
        setComposeData({
          from: 'support@47industries.com',
          to: '',
          cc: '',
          subject: '',
          content: '',
        })
        setUploadedAttachments([])
        alert('Email sent successfully!')
      } else {
        alert('Failed to send email: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Failed to send email')
    }
  }

  function formatDate(timestamp: number | string) {
    // Zoho returns timestamp as string in milliseconds
    const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp
    if (!ts || isNaN(ts)) return ''

    const date = new Date(ts)
    if (isNaN(date.getTime())) return ''

    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Not connected state
  if (!isConnected && !isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{
          background: '#18181b',
          borderRadius: '16px',
          padding: '60px 40px',
          maxWidth: '500px',
          margin: '0 auto',
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>
            Connect Your Email
          </h2>
          <p style={{ color: '#a1a1aa', marginBottom: '30px' }}>
            Connect your Zoho Mail account to send and receive emails directly from the admin console.
          </p>
          <button
            onClick={connectZoho}
            style={{
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Connect Zoho Mail
          </button>
        </div>
      </div>
    )
  }

  // Sidebar content component to avoid repetition
  const SidebarContent = () => (
    <>
      <button
        onClick={() => {
          setIsComposing(true)
          if (isMobile) setShowSidebar(false)
        }}
        style={{
          width: '100%',
          background: '#3b82f6',
          color: '#fff',
          border: 'none',
          padding: '12px 20px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '24px',
        }}
      >
        + Compose
      </button>

      {/* Folders */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '8px', textTransform: 'uppercase' }}>
          Folders
        </div>
        {FOLDERS.map((folder) => (
          <button
            key={folder.id}
            onClick={() => {
              setSelectedFolder(folder.id)
              if (isMobile) setShowSidebar(false)
            }}
            style={{
              width: '100%',
              textAlign: 'left',
              background: selectedFolder === folder.id ? '#27272a' : 'transparent',
              color: selectedFolder === folder.id ? '#fff' : '#a1a1aa',
              border: 'none',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {folder.label}
          </button>
        ))}
      </div>

      {/* Mailboxes */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '8px', textTransform: 'uppercase' }}>
          Mailboxes
        </div>
        {mailboxes.map((mailbox) => (
          <button
            key={mailbox.id}
            onClick={() => {
              setSelectedMailbox(mailbox.id)
              if (isMobile) setShowSidebar(false)
            }}
            style={{
              width: '100%',
              textAlign: 'left',
              background: selectedMailbox === mailbox.id ? '#27272a' : 'transparent',
              color: selectedMailbox === mailbox.id ? '#fff' : '#a1a1aa',
              border: 'none',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              marginBottom: '4px',
            }}
          >
            {mailbox.label}
          </button>
        ))}
      </div>

      {/* Labels */}
      {labels.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '8px', textTransform: 'uppercase' }}>
            Labels
          </div>
          {labels.map((label) => (
            <button
              key={label.tagId}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                color: '#a1a1aa',
                border: 'none',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                cursor: 'pointer',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: label.color || '#3b82f6',
              }} />
              {label.tagName}
            </button>
          ))}
        </div>
      )}

      {/* Settings Link */}
      <div style={{ borderTop: '1px solid #27272a', paddingTop: '16px', marginTop: 'auto' }}>
        <Link
          href="/admin/email/settings"
          onClick={() => isMobile && setShowSidebar(false)}
          style={{
            display: 'block',
            textAlign: 'left',
            background: 'transparent',
            color: '#a1a1aa',
            border: 'none',
            padding: '10px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            textDecoration: 'none',
          }}
        >
          Settings
        </Link>
      </div>
    </>
  )

  return (
    <div style={{
      display: 'flex',
      height: isMobile ? 'calc(100vh - 80px)' : 'calc(100vh - 120px)',
      gap: '0',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Mobile Sidebar Overlay */}
      {isMobile && showSidebar && (
        <div
          onClick={() => setShowSidebar(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
        />
      )}

      {/* Sidebar - Desktop: always visible, Mobile: slide-in drawer */}
      <div style={{
        width: isMobile ? '280px' : '240px',
        background: '#0a0a0a',
        borderRight: '1px solid #27272a',
        padding: '16px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        ...(isMobile ? {
          position: 'fixed',
          top: 0,
          left: showSidebar ? 0 : '-300px',
          bottom: 0,
          zIndex: 50,
          transition: 'left 0.3s ease',
          paddingTop: '60px',
        } : {}),
      }}>
        {isMobile && (
          <button
            onClick={() => setShowSidebar(false)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'transparent',
              border: 'none',
              color: '#a1a1aa',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            x
          </button>
        )}
        <SidebarContent />
      </div>

      {/* Email List - Full width on mobile when in list view */}
      <div style={{
        width: isMobile ? '100%' : '350px',
        borderRight: isMobile ? 'none' : '1px solid #27272a',
        display: isMobile && mobileView !== 'list' ? 'none' : 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* Mobile Header */}
        {isMobile && (
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #27272a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#0a0a0a',
          }}>
            <button
              onClick={() => setShowSidebar(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span style={{ fontWeight: 600, fontSize: '16px' }}>
              {FOLDERS.find(f => f.id === selectedFolder)?.label || 'Email'}
            </span>
            <button
              onClick={() => setIsComposing(true)}
              style={{
                background: '#3b82f6',
                border: 'none',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '8px',
              }}
            >
              +
            </button>
          </div>
        )}

        {/* Search */}
        <div style={{ padding: isMobile ? '12px' : '16px', borderBottom: '1px solid #27272a' }}>
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              padding: isMobile ? '10px 12px' : '10px 14px',
              color: '#fff',
              fontSize: '14px',
            }}
          />
        </div>

        {/* Email List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#71717a' }}>
              Loading emails...
            </div>
          ) : emails.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#71717a' }}>
              No emails found
            </div>
          ) : (
            emails.map((email) => (
              <div
                key={email.messageId}
                onClick={() => handleSelectEmail(email)}
                style={{
                  padding: '16px',
                  borderBottom: '1px solid #27272a',
                  cursor: 'pointer',
                  background: selectedEmail?.messageId === email.messageId ? '#18181b' : 'transparent',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '4px',
                }}>
                  <div style={{
                    fontWeight: email.isRead ? 400 : 600,
                    fontSize: '14px',
                    color: email.isRead ? '#a1a1aa' : '#fff',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '200px',
                  }}>
                    {email.fromAddress}
                  </div>
                  <div style={{ fontSize: '12px', color: '#71717a', flexShrink: 0 }}>
                    {formatDate(email.receivedTime)}
                  </div>
                </div>
                <div style={{
                  fontWeight: email.isRead ? 400 : 600,
                  fontSize: '13px',
                  color: email.isRead ? '#a1a1aa' : '#fff',
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  {email.hasAttachment && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  )}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {email.subject || '(No Subject)'}
                  </span>
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#71717a',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {email.summary}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Email Content / Compose */}
      <div style={{
        flex: 1,
        display: isMobile && mobileView === 'list' && !isComposing ? 'none' : 'flex',
        flexDirection: 'column',
        width: isMobile ? '100%' : 'auto',
        position: isMobile ? 'absolute' : 'relative',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#09090b',
        zIndex: isMobile ? 30 : 'auto',
      }}>
        {isComposing ? (
          // Compose View
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
              padding: isMobile ? '12px 16px' : '16px 24px',
              borderBottom: '1px solid #27272a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isMobile && (
                  <button
                    onClick={() => setIsComposing(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#a1a1aa',
                      fontSize: '14px',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, margin: 0 }}>New Message</h2>
              </div>
              {!isMobile && (
                <button
                  onClick={() => setIsComposing(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#a1a1aa',
                    fontSize: '20px',
                    cursor: 'pointer',
                  }}
                >
                  x
                </button>
              )}
            </div>

            <div style={{
              flex: 1,
              padding: isMobile ? '12px 16px' : '16px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '4px' : '12px' }}>
                <label style={{ width: isMobile ? 'auto' : '60px', color: '#a1a1aa', fontSize: '14px' }}>From:</label>
                <select
                  value={composeData.from}
                  onChange={(e) => setComposeData({ ...composeData, from: e.target.value })}
                  style={{
                    flex: 1,
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                >
                  {mailboxes.filter(m => m.email).map((mailbox) => (
                    <option key={mailbox.id} value={mailbox.email!}>{mailbox.label} ({mailbox.email})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '4px' : '12px' }}>
                <label style={{ width: isMobile ? 'auto' : '60px', color: '#a1a1aa', fontSize: '14px' }}>To:</label>
                <input
                  type="email"
                  value={composeData.to}
                  onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                  placeholder="recipient@example.com"
                  style={{
                    flex: 1,
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '4px' : '12px' }}>
                <label style={{ width: isMobile ? 'auto' : '60px', color: '#a1a1aa', fontSize: '14px' }}>CC:</label>
                <input
                  type="email"
                  value={composeData.cc}
                  onChange={(e) => setComposeData({ ...composeData, cc: e.target.value })}
                  placeholder="cc@example.com (optional)"
                  style={{
                    flex: 1,
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '4px' : '12px' }}>
                <label style={{ width: isMobile ? 'auto' : '60px', color: '#a1a1aa', fontSize: '14px' }}>Subject:</label>
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  placeholder="Email subject"
                  style={{
                    flex: 1,
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                />
              </div>

              {/* Signature Selector */}
              {signatures.length > 0 && (
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '4px' : '12px' }}>
                  <label style={{ width: isMobile ? 'auto' : '60px', color: '#a1a1aa', fontSize: '14px' }}>Signature:</label>
                  <select
                    value={selectedSignature}
                    onChange={(e) => applySignature(e.target.value)}
                    style={{
                      flex: 1,
                      background: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">No signature</option>
                    {signatures.map((sig) => (
                      <option key={sig.id} value={sig.id}>
                        {sig.name} {sig.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Rich Text Toolbar */}
              <div style={{
                display: 'flex',
                gap: '4px',
                padding: '8px',
                background: '#27272a',
                borderRadius: '8px 8px 0 0',
                border: '1px solid #3f3f46',
                borderBottom: 'none',
                flexWrap: 'wrap',
              }}>
                <button
                  type="button"
                  onClick={() => document.execCommand('bold')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                  title="Bold"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => document.execCommand('italic')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontStyle: 'italic',
                  }}
                  title="Italic"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => document.execCommand('underline')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                  title="Underline"
                >
                  U
                </button>
                <div style={{ width: '1px', background: '#3f3f46', margin: '0 8px' }} />
                <button
                  type="button"
                  onClick={() => document.execCommand('insertUnorderedList')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  title="Bullet List"
                >
                  * List
                </button>
                <button
                  type="button"
                  onClick={() => document.execCommand('insertOrderedList')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  title="Numbered List"
                >
                  1. List
                </button>
                <div style={{ width: '1px', background: '#3f3f46', margin: '0 8px' }} />
                <button
                  type="button"
                  onClick={() => {
                    const url = prompt('Enter link URL:')
                    if (url) document.execCommand('createLink', false, url)
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  title="Insert Link"
                >
                  Link
                </button>
              </div>
              {/* Rich Text Editor */}
              <div
                id="email-editor"
                contentEditable
                dir="ltr"
                onInput={(e) => setComposeData({ ...composeData, content: (e.target as HTMLDivElement).innerHTML })}
                style={{
                  flex: 1,
                  background: '#fff',
                  border: '1px solid #3f3f46',
                  borderRadius: '0 0 8px 8px',
                  padding: '14px',
                  color: '#000',
                  fontSize: '14px',
                  minHeight: '200px',
                  overflowY: 'auto',
                  outline: 'none',
                  direction: 'ltr',
                  textAlign: 'left',
                  unicodeBidi: 'plaintext',
                }}
                dangerouslySetInnerHTML={{ __html: composeData.content }}
              />

              {/* Attachments Section */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '12px',
                background: '#18181b',
                borderRadius: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      background: '#27272a',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: '#a1a1aa',
                    }}
                  >
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        const files = e.target.files
                        if (files) {
                          Array.from(files).forEach(file => uploadAttachment(file))
                        }
                        e.target.value = ''
                      }}
                      style={{ display: 'none' }}
                    />
                    {isUploading ? 'Uploading...' : 'Attach Files'}
                  </label>
                  {uploadedAttachments.length > 0 && (
                    <span style={{ fontSize: '12px', color: '#71717a' }}>
                      {uploadedAttachments.length} file(s) attached
                    </span>
                  )}
                </div>

                {/* Uploaded Attachments List */}
                {uploadedAttachments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {uploadedAttachments.map((att, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 12px',
                          background: '#27272a',
                          borderRadius: '6px',
                          fontSize: '13px',
                        }}
                      >
                        <span>{att.fileName}</span>
                        <span style={{ color: '#71717a', fontSize: '11px' }}>
                          ({formatFileSize(att.fileSize)})
                        </span>
                        <button
                          onClick={() => removeUploadedAttachment(index)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '0 4px',
                            fontSize: '16px',
                          }}
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => setIsComposing(false)}
                  style={{
                    background: '#27272a',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Discard
                </button>
                <button
                  onClick={sendEmail}
                  style={{
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        ) : selectedEmail ? (
          // Email View
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Mobile back button header */}
            {isMobile && (
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #27272a',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#0a0a0a',
              }}>
                <button
                  onClick={handleBackToList}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#a1a1aa',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
                <span style={{ fontWeight: 600, fontSize: '16px' }}>Back</span>
              </div>
            )}
            <div style={{
              padding: isMobile ? '16px' : '24px',
              borderBottom: '1px solid #27272a',
            }}>
              <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 600, marginBottom: '16px', wordBreak: 'break-word' }}>
                {selectedEmail.subject || '(No Subject)'}
              </h2>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-start', gap: isMobile ? '8px' : '0' }}>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '4px', wordBreak: 'break-all' }}>{selectedEmail.fromAddress}</div>
                  <div style={{ fontSize: '13px', color: '#71717a', wordBreak: 'break-all' }}>
                    To: {selectedEmail.toAddress
                      ?.replace(/&lt;/g, '<')
                      .replace(/&gt;/g, '>')
                      .replace(/[<>]/g, '')
                      .trim()}
                  </div>
                  {/* Show who sent this email (for sent folder) */}
                  {sentByAdmin && (
                    <div style={{
                      fontSize: '12px',
                      color: '#3b82f6',
                      marginTop: '6px',
                      padding: '4px 8px',
                      background: '#3b82f620',
                      borderRadius: '4px',
                      display: 'inline-block',
                    }}>
                      Sent by {sentByAdmin}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: '#71717a', flexShrink: 0 }}>
                  {(() => {
                    const ts = typeof selectedEmail.receivedTime === 'string'
                      ? parseInt(selectedEmail.receivedTime, 10)
                      : selectedEmail.receivedTime
                    return ts && !isNaN(ts) ? new Date(ts).toLocaleString() : ''
                  })()}
                </div>
              </div>
            </div>

            <div style={{ flex: 1, padding: isMobile ? '16px' : '24px', overflowY: 'auto' }}>
              {/* External Images Banner */}
              {emailContent && !showExternalImages && emailContent.includes('<img') && (
                <div style={{
                  padding: '12px 16px',
                  background: '#27272a',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}>
                  <span style={{ fontSize: '13px', color: '#a1a1aa' }}>
                    External images are not displayed
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setShowExternalImages(true)}
                      style={{
                        background: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Display Now
                    </button>
                  </div>
                </div>
              )}

              {/* Attachments Display - Show at top like Zoho */}
              {(attachments.length > 0 || (selectedEmail?.hasAttachment && isLoadingAttachments)) && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px 16px',
                  background: '#18181b',
                  borderRadius: '8px',
                  border: '1px solid #27272a',
                }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#a1a1aa',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                    {attachments.length} Attachment{attachments.length !== 1 ? 's' : ''}
                  </div>
                  {isLoadingAttachments ? (
                    <p style={{ color: '#71717a', fontSize: '13px' }}>Loading attachments...</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {attachments.map((att) => (
                        <a
                          key={att.attachmentId}
                          href={att.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 14px',
                            background: '#27272a',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: '#fff',
                            fontSize: '13px',
                            border: '1px solid #3f3f46',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#3f3f46'
                            e.currentTarget.style.borderColor = '#52525b'
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = '#27272a'
                            e.currentTarget.style.borderColor = '#3f3f46'
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14,2 14,8 20,8" />
                          </svg>
                          <div>
                            <div style={{ fontWeight: 500 }}>{att.attachmentName}</div>
                            <div style={{ color: '#71717a', fontSize: '11px' }}>
                              {formatFileSize(att.attachmentSize)}
                            </div>
                          </div>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" style={{ marginLeft: '4px' }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7,10 12,15 17,10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Email Content */}
              {isLoadingContent ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#71717a',
                  background: '#18181b',
                  borderRadius: '8px',
                }}>
                  Loading email content...
                </div>
              ) : emailContent ? (
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #27272a',
                  }}
                >
                  <div
                    className="email-body-content"
                    style={{
                      padding: '24px',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: '#1a1a1a',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: showExternalImages
                        ? emailContent
                        : emailContent.replace(/<img[^>]*src=["']https?:\/\/[^"']*["'][^>]*>/gi, '<div style="padding:8px 12px;background:#f5f5f5;border:1px dashed #ccc;border-radius:4px;color:#666;font-size:12px;display:inline-block;margin:4px 0;">[Image blocked]</div>')
                    }}
                  />
                  <style>{`
                    .email-body-content {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                    }
                    .email-body-content img {
                      max-width: 100%;
                      height: auto;
                    }
                    .email-body-content a {
                      color: #3b82f6;
                    }
                    .email-body-content table {
                      max-width: 100%;
                    }
                    .email-body-content pre, .email-body-content code {
                      background: #f5f5f5;
                      border-radius: 4px;
                      padding: 2px 6px;
                      font-size: 13px;
                    }
                    .email-body-content blockquote {
                      border-left: 3px solid #ddd;
                      margin: 12px 0;
                      padding-left: 12px;
                      color: #666;
                    }
                  `}</style>
                </div>
              ) : (
                <div style={{
                  background: '#ffffff',
                  borderRadius: '8px',
                  padding: '24px',
                  border: '1px solid #27272a',
                  color: '#1a1a1a',
                  lineHeight: 1.6,
                }}>
                  {selectedEmail.summary || 'No content available'}
                </div>
              )}
            </div>

            <div style={{
              padding: isMobile ? '12px 16px' : '16px 24px',
              borderTop: '1px solid #27272a',
              display: 'flex',
              gap: isMobile ? '8px' : '12px',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={() => {
                  setIsComposing(true)
                  setComposeData({
                    ...composeData,
                    to: selectedEmail.fromAddress,
                    subject: `Re: ${selectedEmail.subject}`,
                  })
                }}
                style={{
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  padding: isMobile ? '10px 16px' : '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  flex: isMobile ? 1 : 'none',
                }}
              >
                Reply
              </button>
              <button
                style={{
                  background: '#27272a',
                  color: '#fff',
                  border: 'none',
                  padding: isMobile ? '10px 16px' : '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  flex: isMobile ? 1 : 'none',
                }}
              >
                Forward
              </button>
              <button
                style={{
                  background: '#27272a',
                  color: '#ef4444',
                  border: 'none',
                  padding: isMobile ? '10px 16px' : '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  flex: isMobile ? 1 : 'none',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          // No email selected - only show on desktop
          !isMobile && (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#71717a',
            }}>
              <p>Select an email to read</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default function AdminEmailPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '40px', textAlign: 'center', color: '#71717a' }}>
        Loading email...
      </div>
    }>
      <EmailPageContent />
    </Suspense>
  )
}
