'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface Email {
  messageId: string
  subject: string
  fromAddress: string
  toAddress: string
  receivedTime: number | string
  summary: string
  isRead: boolean
  hasAttachment: boolean
}

const EMAIL_ADDRESSES = [
  { id: 'all', label: 'All Inboxes', email: null },
  { id: 'personal', label: 'Personal', email: 'kyle@47industries.com' },
  { id: 'support-47', label: '47 Support', email: 'support@47industries.com' },
  { id: 'info-47', label: '47 Info', email: 'info@47industries.com' },
  { id: 'contact-47', label: '47 Contact', email: 'contact@47industries.com' },
  { id: 'press-47', label: '47 Press', email: 'press@47industries.com' },
  { id: 'support-mr', label: 'MotoRev Support', email: 'support@motorevapp.com' },
  { id: 'press-mr', label: 'MotoRev Press', email: 'press@motorevapp.com' },
]

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

  async function checkConnectionAndFetchEmails() {
    setIsLoading(true)
    try {
      // Build query params
      const params = new URLSearchParams()
      params.append('folder', selectedFolder)

      // Get mailbox email address if not "all"
      if (selectedMailbox !== 'all') {
        const mailboxConfig = EMAIL_ADDRESSES.find(m => m.id === selectedMailbox)
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

  function handleSelectEmail(email: Email) {
    setSelectedEmail(email)
    fetchEmailContent(email.messageId)
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

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', gap: '0' }}>
      {/* Sidebar */}
      <div style={{
        width: '240px',
        background: '#0a0a0a',
        borderRight: '1px solid #27272a',
        padding: '16px',
        flexShrink: 0,
      }}>
        <button
          onClick={() => setIsComposing(true)}
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
              onClick={() => setSelectedFolder(folder.id)}
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
        <div>
          <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '8px', textTransform: 'uppercase' }}>
            Mailboxes
          </div>
          {EMAIL_ADDRESSES.map((mailbox) => (
            <button
              key={mailbox.id}
              onClick={() => setSelectedMailbox(mailbox.id)}
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
      </div>

      {/* Email List */}
      <div style={{
        width: '350px',
        borderRight: '1px solid #27272a',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* Search */}
        <div style={{ padding: '16px', borderBottom: '1px solid #27272a' }}>
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
              padding: '10px 14px',
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
                }}>
                  {email.subject || '(No Subject)'}
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {isComposing ? (
          // Compose View
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #27272a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>New Message</h2>
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
                ×
              </button>
            </div>

            <div style={{ flex: 1, padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ width: '60px', color: '#a1a1aa', fontSize: '14px' }}>From:</label>
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
                  {EMAIL_ADDRESSES.filter(e => e.email).map((addr) => (
                    <option key={addr.id} value={addr.email!}>{addr.email}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ width: '60px', color: '#a1a1aa', fontSize: '14px' }}>To:</label>
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ width: '60px', color: '#a1a1aa', fontSize: '14px' }}>CC:</label>
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ width: '60px', color: '#a1a1aa', fontSize: '14px' }}>Subject:</label>
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

              {/* Rich Text Toolbar */}
              <div style={{
                display: 'flex',
                gap: '4px',
                padding: '8px',
                background: '#27272a',
                borderRadius: '8px 8px 0 0',
                border: '1px solid #3f3f46',
                borderBottom: 'none',
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
                }}
                dangerouslySetInnerHTML={{ __html: composeData.content }}
              />

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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #27272a',
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
                {selectedEmail.subject || '(No Subject)'}
              </h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>{selectedEmail.fromAddress}</div>
                  <div style={{ fontSize: '13px', color: '#71717a' }}>To: {selectedEmail.toAddress}</div>
                </div>
                <div style={{ fontSize: '13px', color: '#71717a' }}>
                  {(() => {
                    const ts = typeof selectedEmail.receivedTime === 'string'
                      ? parseInt(selectedEmail.receivedTime, 10)
                      : selectedEmail.receivedTime
                    return ts && !isNaN(ts) ? new Date(ts).toLocaleString() : ''
                  })()}
                </div>
              </div>
            </div>

            <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
              {isLoadingContent ? (
                <p style={{ color: '#71717a' }}>Loading email content...</p>
              ) : emailContent ? (
                <div
                  className="email-content"
                  style={{
                    color: '#1a1a1a',
                    lineHeight: 1.6,
                    backgroundColor: '#ffffff',
                    padding: '20px',
                    borderRadius: '8px',
                  }}
                >
                  <style>{`
                    .email-content * {
                      color: #1a1a1a !important;
                    }
                    .email-content a {
                      color: #3b82f6 !important;
                    }
                  `}</style>
                  <div dangerouslySetInnerHTML={{ __html: emailContent }} />
                </div>
              ) : (
                <p style={{ color: '#d4d4d8', lineHeight: 1.6 }}>
                  {selectedEmail.summary}
                </p>
              )}
            </div>

            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #27272a',
              display: 'flex',
              gap: '12px',
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
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Reply
              </button>
              <button
                style={{
                  background: '#27272a',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Forward
              </button>
              <button
                style={{
                  background: '#27272a',
                  color: '#ef4444',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          // No email selected
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#71717a',
          }}>
            <p>Select an email to read</p>
          </div>
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
