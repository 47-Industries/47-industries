import { Resend } from 'resend'

// Initialize Resend lazily to avoid build-time errors
let resendClient: Resend | null = null

function getResend(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@47industries.com'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@47industries.com'
const CONFIRMATIONS_EMAIL = 'confirmations@47industries.com'
const BCC_EMAIL = 'kylerivers4@gmail.com'

// BCC addresses for all confirmation emails
const CONFIRMATION_BCC = [CONFIRMATIONS_EMAIL, BCC_EMAIL]

// Available email addresses for sending
export const EMAIL_ADDRESSES = {
  noreply: 'noreply@47industries.com',
  info: 'info@47industries.com',
  support: 'support@47industries.com',
  contact: 'contact@47industries.com',
  press: 'press@47industries.com',
  admin: 'admin@47industries.com',
} as const

export type EmailAddress = keyof typeof EMAIL_ADDRESSES

// Unified email template with dark mode support
function getEmailTemplate(content: string, title: string = '47 Industries') {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://47industries.com'

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light">
      <meta name="supported-color-schemes" content="light">
      <title>${title}</title>
      <style>
        :root {
          color-scheme: light;
          supported-color-schemes: light;
        }

        * {
          margin: 0;
          padding: 0;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
          background-color: #ffffff !important;
          color: #18181b !important;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #000000 !important; background: #000000;">
        <tr>
          <td style="padding: 24px 32px; background-color: #000000 !important; background: #000000;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-right: 12px; vertical-align: middle;">
                  <img src="https://47industries.com/logo.png" alt="47 Industries" width="40" height="40" style="display: block; border: 0; border-radius: 8px; width: 40px; height: 40px;" />
                </td>
                <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 20px; font-weight: 700; color: #ffffff !important; letter-spacing: -0.5px; vertical-align: middle;">
                  47 Industries
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Body -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-body" style="background-color: #ffffff; background: #ffffff;">
        <tr>
          <td align="center" style="padding: 40px 20px; background-color: #ffffff; background: #ffffff;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%;">
              <tr>
                <td>
                  ${content}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Footer -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fafafa !important; background: #fafafa;">
        <tr>
          <td align="center" style="padding: 0 20px; background-color: #fafafa; background: #fafafa;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%;">
              <tr>
                <td style="padding: 32px 0;">
                  <div class="footer-divider" style="height: 1px; background-color: #e4e4e7; margin-bottom: 24px;"></div>
                  <p style="margin: 0 0 12px 0; color: #71717a !important; font-size: 13px; text-align: center;" class="text-muted">
                    47 Industries - Digital Solutions
                  </p>
                  <p style="margin: 0 0 20px 0; text-align: center;">
                    <a href="https://47industries.com" style="color: #3b82f6 !important; text-decoration: none; font-size: 14px; font-weight: 500;">47industries.com</a>
                  </p>
                  <p style="margin: 0; color: #a1a1aa !important; font-size: 12px; text-align: center; line-height: 1.6;" class="text-muted">
                    Have questions? Contact us at<br>
                    <a href="mailto:support@47industries.com" style="color: #3b82f6 !important; text-decoration: none;">support@47industries.com</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

// Accent box component for reference numbers, quotes, etc
function getAccentBox(title: string, value: string, subtitle?: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 24px; border-radius: 12px;">
          <p style="margin: 0 0 8px 0; color: rgba(255,255,255,0.9); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">${title}</p>
          <p style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; line-height: 1.2; letter-spacing: 0.3px;">${value}</p>
          ${subtitle ? `<p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${subtitle}</p>` : ''}
        </td>
      </tr>
    </table>
  `
}

// Signature component
export function getSignature(signature: { name: string; title?: string | null; email?: string | null; phone?: string | null }) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 32px 0 0 0; padding-top: 24px; border-top: 1px solid #e4e4e7;">
      <tr>
        <td>
          <p style="margin: 0 0 4px 0; color: #18181b; font-size: 15px; font-weight: 600; line-height: 1.4;">
            ${signature.name}
          </p>
          ${signature.title ? `
            <p style="margin: 0 0 12px 0; color: #71717a; font-size: 14px; line-height: 1.4;">
              ${signature.title}
            </p>
          ` : ''}
          <p style="margin: 0; color: #18181b; font-size: 14px; font-weight: 600; line-height: 1.8;">
            47 Industries
          </p>
          ${signature.email ? `
            <p style="margin: 0; color: #3b82f6; font-size: 14px; line-height: 1.8;">
              <a href="mailto:${signature.email}" style="color: #3b82f6; text-decoration: none;">${signature.email}</a>
            </p>
          ` : ''}
          ${signature.phone ? `
            <p style="margin: 0; color: #52525b; font-size: 14px; line-height: 1.8;">
              ${signature.phone}
            </p>
          ` : ''}
          <p style="margin: 8px 0 0 0; color: #3b82f6; font-size: 14px; line-height: 1.8;">
            <a href="https://47industries.com" style="color: #3b82f6; text-decoration: none;">47industries.com</a>
          </p>
        </td>
      </tr>
    </table>
  `
}

// Format a reply email with message content and signature
export function formatReplyEmail(options: {
  message: string
  signature?: { name: string; title?: string | null; email?: string | null; phone?: string | null }
  referenceNumber?: string
}) {
  const { message, signature, referenceNumber } = options

  const content = `
    ${getCard(`
      <div style="margin: 0; color: #18181b; font-size: 16px; line-height: 1.8; white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</div>
    `)}

    ${signature ? getSignature(signature) : ''}

    ${referenceNumber ? `
      <p style="margin: 32px 0 0 0; color: #71717a; font-size: 14px; text-align: center;" class="text-muted">
        Reference: <strong style="color: #52525b;" class="text-secondary">${referenceNumber}</strong>
      </p>
    ` : ''}
  `

  return getEmailTemplate(content, '47 Industries')
}

// Card component for details
function getCard(content: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;" class="card">
      <tr>
        <td style="background-color: #fafafa !important; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 16px; padding: 24px;">
          ${content}
        </td>
      </tr>
    </table>
  `
}

// Button component
function getButton(text: string, url: string, isPrimary: boolean = true) {
  const bgColor = isPrimary ? '#3b82f6' : '#18181b'

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 32px auto;">
      <tr>
        <td align="center" style="border-radius: 10px; background-color: ${bgColor};">
          <a href="${url}" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; letter-spacing: 0.3px;">${text}</a>
        </td>
      </tr>
    </table>
  `
}

// Detail row component
function getDetailRow(label: string, value: string, isLast: boolean = false) {
  const borderStyle = isLast ? '' : 'border-bottom: 1px solid #e4e4e7;'

  return `
    <tr>
      <td style="padding: 16px 0; ${borderStyle}" class="divider">
        <p style="margin: 0 0 6px 0; color: #71717a !important; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;" class="text-muted">${label}</p>
        <p style="margin: 0; color: #18181b !important; font-size: 16px; font-weight: 500; line-height: 1.4;" class="text-primary">${value}</p>
      </td>
    </tr>
  `
}

// Timeline/steps component
function getTimeline(steps: Array<{ number: number, title: string, description: string }>) {
  const stepsHtml = steps.map((step, index) => {
    const isLast = index === steps.length - 1
    const marginBottom = isLast ? '0' : '24px'

    return `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: ${marginBottom};">
        <tr>
          <td width="48" valign="top">
            <div style="width: 40px; height: 40px; background-color: #3b82f6; color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; text-align: center; line-height: 40px;">
              ${step.number}
            </div>
          </td>
          <td valign="top" style="padding-left: 20px;">
            <p style="margin: 0 0 6px 0; color: #18181b !important; font-size: 17px; font-weight: 600;" class="text-primary">${step.title}</p>
            <p style="margin: 0; color: #71717a !important; font-size: 15px; line-height: 1.5;" class="text-muted">${step.description}</p>
          </td>
        </tr>
      </table>
    `
  }).join('')

  return getCard(stepsHtml)
}

// Section heading
function getSectionHeading(text: string) {
  return `
    <h3 style="margin: 40px 0 20px 0; color: #18181b !important; font-size: 20px; font-weight: 700;" class="text-primary">
      ${text}
    </h3>
  `
}

// 1. Custom 3D Print Request Confirmation
export async function sendCustomRequestConfirmation(data: {
  to: string
  name: string
  requestNumber: string
  material?: string
  finish?: string
  color?: string
  quantity?: number
}) {
  const content = `
    <h1 style="margin: 0 0 12px 0; color: #18181b; font-size: 28px; font-weight: 700; line-height: 1.3;" class="text-primary">
      Hello ${data.name}!
    </h1>
    <p style="margin: 0 0 8px 0; color: #52525b; font-size: 16px; line-height: 1.6;" class="text-secondary">
      Thank you for submitting your 3D printing request. We've received your files and specifications and our team is reviewing them now.
    </p>

    ${getAccentBox('Request Number', data.requestNumber)}

    ${data.material ? getCard(`
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <p style="margin: 0; color: #18181b; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;" class="text-primary">Request Details</p>
          </td>
        </tr>
        ${getDetailRow('Material', data.material)}
        ${getDetailRow('Finish', data.finish || 'Standard')}
        ${getDetailRow('Color', data.color || 'Default')}
        ${getDetailRow('Quantity', String(data.quantity || 1), true)}
      </table>
    `) : ''}

    ${getSectionHeading('What Happens Next')}

    ${getTimeline([
      { number: 1, title: 'Review', description: 'Our team will review your 3D model and specifications' },
      { number: 2, title: 'Quote Preparation', description: 'We\'ll prepare a detailed quote within 24-48 hours' },
      { number: 3, title: 'Quote Delivery', description: 'You\'ll receive an email with pricing and estimated delivery time' },
    ])}

    <p style="margin: 32px 0 0 0; color: #52525b; font-size: 15px; text-align: center;" class="text-secondary">
      Expect to hear from us within <strong style="color: #18181b;" class="text-primary">24-48 hours</strong>
    </p>
  `

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      bcc: CONFIRMATION_BCC,
      subject: `3D Print Request Received - ${data.requestNumber}`,
      html: getEmailTemplate(content, '3D Print Request Received'),
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send custom request confirmation:', error)
    return { success: false, error }
  }
}

// 2. Contact Form Confirmation
export async function sendContactConfirmation(data: {
  to: string
  name: string
  inquiryNumber: string
  subject: string
}) {
  const content = `
    <h1 style="margin: 0 0 12px 0; color: #18181b; font-size: 28px; font-weight: 700; line-height: 1.3;" class="text-primary">
      Hello ${data.name}!
    </h1>
    <p style="margin: 0 0 8px 0; color: #52525b; font-size: 16px; line-height: 1.6;" class="text-secondary">
      Thank you for reaching out. We've received your message and will get back to you soon.
    </p>

    ${getCard(`
      <p style="margin: 0; padding: 20px; color: #18181b; font-size: 16px; font-weight: 500; border-left: 4px solid #3b82f6; background-color: #eff6ff; border-radius: 8px;" class="text-primary">
        ${data.subject}
      </p>
    `)}

    ${getAccentBox('Reference Number', data.inquiryNumber)}

    <p style="margin: 0; color: #52525b; font-size: 15px; line-height: 1.6; text-align: center;" class="text-secondary">
      One of our team members will review your message and respond within <strong style="color: #18181b;" class="text-primary">1-2 business days</strong>.
    </p>
  `

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      bcc: CONFIRMATION_BCC,
      subject: `We received your message - ${data.inquiryNumber}`,
      html: getEmailTemplate(content, 'Message Received'),
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send contact confirmation:', error)
    return { success: false, error }
  }
}

// 3. Service Inquiry Confirmation
export async function sendServiceInquiryConfirmation(data: {
  to: string
  name: string
  inquiryNumber: string
  serviceType: string
  projectName?: string
  services?: string[]
  budget?: string
  timeline?: string
  description?: string
}) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://47industries.com'
  const trackingUrl = `${APP_URL}/inquiry/${data.inquiryNumber}`

  const servicesHtml = data.services && data.services.length > 0
    ? data.services.map(s => `
        <span style="display: inline-block; background-color: #eff6ff; color: #3b82f6; padding: 8px 16px; border-radius: 24px; font-size: 14px; font-weight: 500; margin: 4px 6px 4px 0;">
          ${s}
        </span>
      `).join('')
    : `<span style="display: inline-block; background-color: #eff6ff; color: #3b82f6; padding: 8px 16px; border-radius: 24px; font-size: 14px; font-weight: 500;">${data.serviceType}</span>`

  const content = `
    <h1 style="margin: 0 0 12px 0; color: #18181b; font-size: 28px; font-weight: 700; line-height: 1.3;" class="text-primary">
      Hello ${data.name}!
    </h1>
    <p style="margin: 0 0 8px 0; color: #52525b; font-size: 16px; line-height: 1.6;" class="text-secondary">
      Thank you for your interest in working with us. We've received your project inquiry and our team is excited to review it.
    </p>

    ${getAccentBox('Reference Number', data.inquiryNumber)}

    ${getCard(`
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <p style="margin: 0; color: #18181b; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;" class="text-primary">Project Summary</p>
          </td>
        </tr>
        ${data.projectName ? getDetailRow('Project Name', data.projectName) : ''}
        <tr>
          <td style="padding: 16px 0; ${data.budget || data.timeline || data.description ? 'border-bottom: 1px solid #e4e4e7;' : ''}" class="divider">
            <p style="margin: 0 0 10px 0; color: #71717a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;" class="text-muted">Services Requested</p>
            <div style="margin: 0;">${servicesHtml}</div>
          </td>
        </tr>
        ${data.budget ? getDetailRow('Budget Range', data.budget, !data.timeline && !data.description) : ''}
        ${data.timeline ? getDetailRow('Timeline', data.timeline, !data.description) : ''}
        ${data.description ? `
          <tr>
            <td style="padding: 16px 0;">
              <p style="margin: 0 0 10px 0; color: #71717a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;" class="text-muted">Project Description</p>
              <p style="margin: 0; color: #52525b; font-size: 15px; line-height: 1.6;" class="text-secondary">${data.description.length > 250 ? data.description.substring(0, 250) + '...' : data.description}</p>
            </td>
          </tr>
        ` : ''}
      </table>
    `)}

    ${getButton('View Full Inquiry', trackingUrl)}

    ${getSectionHeading('What Happens Next')}

    ${getTimeline([
      { number: 1, title: 'Review', description: 'Our team will carefully review your project requirements' },
      { number: 2, title: 'Discovery Call', description: 'We\'ll schedule a call to discuss your vision in detail' },
      { number: 3, title: 'Proposal', description: 'You\'ll receive a detailed proposal with timeline and pricing' },
    ])}

    <p style="margin: 32px 0 0 0; color: #52525b; font-size: 15px; text-align: center;" class="text-secondary">
      Expect to hear from us within <strong style="color: #18181b;" class="text-primary">1-2 business days</strong>
    </p>
  `

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      bcc: CONFIRMATION_BCC,
      subject: `Project Inquiry Received - ${data.inquiryNumber}`,
      html: getEmailTemplate(content, 'Project Inquiry Received'),
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send service inquiry confirmation:', error)
    return { success: false, error }
  }
}

// 4. Admin Notification
export async function sendAdminNotification(data: {
  type: 'custom_request' | 'contact' | 'order' | 'service_inquiry'
  title: string
  details: string
  link: string
}) {
  const typeLabels: Record<string, string> = {
    custom_request: '3D Print Request',
    contact: 'Contact Message',
    order: 'Order',
    service_inquiry: 'Service Inquiry',
  }

  const content = `
    <h1 style="margin: 0 0 12px 0; color: #18181b; font-size: 28px; font-weight: 700; line-height: 1.3;" class="text-primary">
      New ${typeLabels[data.type]}
    </h1>

    <h2 style="margin: 0 0 32px 0; color: #3b82f6; font-size: 22px; font-weight: 600;">
      ${data.title}
    </h2>

    ${getCard(`
      <pre style="margin: 0; color: #52525b; font-size: 15px; line-height: 1.8; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Roboto', sans-serif;" class="text-secondary">${data.details}</pre>
    `)}

    ${getButton('View in Admin Panel', data.link)}
  `

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      bcc: CONFIRMATION_BCC,
      subject: `[47 Industries] New ${typeLabels[data.type]} - ${data.title}`,
      html: getEmailTemplate(content, `New ${typeLabels[data.type]}`),
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send admin notification:', error)
    return { success: false, error }
  }
}

// 5. Reply Email
export async function sendReplyEmail(data: {
  to: string
  subject: string
  message: string
  referenceNumber?: string
  fromAddress?: string
  senderName?: string
  inReplyTo?: string  // Message-ID of the message being replied to
}) {
  const fromEmail = data.fromAddress || FROM_EMAIL
  const from = data.senderName ? `${data.senderName} <${fromEmail}>` : fromEmail

  // Generate unique Message-ID for this email
  const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@47industries.com>`

  const content = `
    <h1 style="margin: 0 0 32px 0; color: #18181b; font-size: 28px; font-weight: 700; line-height: 1.3;" class="text-primary">
      ${data.subject}
    </h1>

    ${getCard(`
      <div style="margin: 0; color: #18181b; font-size: 16px; line-height: 1.8; white-space: pre-wrap;" class="text-primary">${data.message.replace(/\n/g, '<br>')}</div>
    `)}

    ${data.referenceNumber ? `
      <p style="margin: 32px 0 0 0; color: #71717a; font-size: 14px; text-align: center;" class="text-muted">
        Reference: <strong style="color: #52525b;" class="text-secondary">${data.referenceNumber}</strong>
      </p>
    ` : ''}
  `

  try {
    const emailPayload: any = {
      from,
      to: data.to,
      bcc: CONFIRMATION_BCC,
      subject: data.referenceNumber ? `Re: ${data.subject} [${data.referenceNumber}]` : `Re: ${data.subject}`,
      html: getEmailTemplate(content, data.subject),
      headers: {
        'Message-ID': messageId,
      },
    }

    // Add threading headers if this is a reply
    if (data.inReplyTo) {
      emailPayload.headers['In-Reply-To'] = data.inReplyTo
      emailPayload.headers['References'] = data.inReplyTo
    }

    await getResend().emails.send(emailPayload)
    return { success: true, messageId }
  } catch (error) {
    console.error('Failed to send reply email:', error)
    return { success: false, error }
  }
}

// 6. Order Confirmation
export async function sendOrderConfirmation(data: {
  to: string
  name: string
  orderNumber: string
  items: Array<{ name: string; quantity: number; price: number }>
  subtotal: number
  shipping: number
  tax: number
  total: number
}) {
  const itemsHtml = data.items.map((item, index) => {
    const isLast = index === data.items.length - 1

    return `
      <tr>
        <td style="padding: 20px 0; ${isLast ? '' : 'border-bottom: 1px solid #e4e4e7;'}" class="divider">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="65%" style="padding-right: 20px;">
                <p style="margin: 0 0 4px 0; color: #18181b; font-size: 16px; font-weight: 600;" class="text-primary">${item.name}</p>
                <p style="margin: 0; color: #71717a; font-size: 14px;" class="text-muted">Quantity: ${item.quantity}</p>
              </td>
              <td width="35%" align="right">
                <p style="margin: 0; color: #18181b; font-size: 17px; font-weight: 600;" class="text-primary">$${item.price.toFixed(2)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
  }).join('')

  const content = `
    <h1 style="margin: 0 0 12px 0; color: #18181b; font-size: 28px; font-weight: 700; line-height: 1.3;" class="text-primary">
      Thank you, ${data.name}!
    </h1>
    <p style="margin: 0 0 8px 0; color: #52525b; font-size: 16px; line-height: 1.6;" class="text-secondary">
      Your order has been confirmed and is being processed.
    </p>

    ${getAccentBox('Order Number', data.orderNumber)}

    ${getCard(`
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding-bottom: 16px;">
            <p style="margin: 0; color: #18181b; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;" class="text-primary">Order Items</p>
          </td>
        </tr>
        ${itemsHtml}
      </table>
    `)}

    ${getCard(`
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding: 12px 0;">
            <p style="margin: 0; color: #52525b; font-size: 15px;" class="text-secondary">Subtotal</p>
          </td>
          <td align="right" style="padding: 12px 0;">
            <p style="margin: 0; color: #18181b; font-size: 15px; font-weight: 500;" class="text-primary">$${data.subtotal.toFixed(2)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0;">
            <p style="margin: 0; color: #52525b; font-size: 15px;" class="text-secondary">Shipping</p>
          </td>
          <td align="right" style="padding: 12px 0;">
            <p style="margin: 0; color: #18181b; font-size: 15px; font-weight: 500;" class="text-primary">$${data.shipping.toFixed(2)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0;">
            <p style="margin: 0; color: #52525b; font-size: 15px;" class="text-secondary">Tax</p>
          </td>
          <td align="right" style="padding: 12px 0;">
            <p style="margin: 0; color: #18181b; font-size: 15px; font-weight: 500;" class="text-primary">$${data.tax.toFixed(2)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 0 0 0; border-top: 2px solid #e4e4e7;" class="divider">
            <p style="margin: 0; color: #18181b; font-size: 18px; font-weight: 700;" class="text-primary">Total</p>
          </td>
          <td align="right" style="padding: 20px 0 0 0; border-top: 2px solid #e4e4e7;" class="divider">
            <p style="margin: 0; color: #18181b; font-size: 20px; font-weight: 700;" class="text-primary">$${data.total.toFixed(2)}</p>
          </td>
        </tr>
      </table>
    `)}

    <p style="margin: 32px 0 0 0; color: #52525b; font-size: 15px; text-align: center;" class="text-secondary">
      We'll send you tracking information once your order ships.
    </p>
  `

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      bcc: CONFIRMATION_BCC,
      subject: `Order Confirmed - ${data.orderNumber}`,
      html: getEmailTemplate(content, 'Order Confirmed'),
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send order confirmation:', error)
    return { success: false, error }
  }
}

// 7. Shipping Notification
export async function sendShippingNotification(data: {
  to: string
  name: string
  orderNumber: string
  trackingNumber: string
  carrier: string
}) {
  const trackingUrl = getCarrierTrackingUrl(data.carrier, data.trackingNumber)

  const content = `
    <div style="text-align: center; margin: 0 0 32px 0;">
      <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; border-radius: 20px;">
        <p style="margin: 0 0 16px 0; color: #ffffff; font-size: 48px; line-height: 1;">📦</p>
        <p style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 1px;">SHIPPED</p>
      </div>
    </div>

    <h1 style="margin: 0 0 16px 0; color: #18181b; font-size: 32px; font-weight: 700; text-align: center; line-height: 1.2;" class="text-primary">
      Your Order is On Its Way!
    </h1>
    <p style="margin: 0 0 8px 0; color: #52525b; font-size: 16px; line-height: 1.6; text-align: center;" class="text-secondary">
      Hello ${data.name}! Great news - your order has been shipped.
    </p>

    ${getCard(`
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${getDetailRow('Order Number', data.orderNumber)}
        ${getDetailRow('Carrier', data.carrier)}
        ${getDetailRow('Tracking Number', data.trackingNumber, true)}
      </table>
    `)}

    ${getButton('Track Your Package', trackingUrl)}

    <p style="margin: 32px 0 0 0; color: #71717a; font-size: 14px; text-align: center; line-height: 1.6;" class="text-muted">
      Delivery times vary based on your location and shipping method.<br>
      Most orders arrive within 5-10 business days.
    </p>
  `

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      bcc: CONFIRMATION_BCC,
      subject: `Your Order Has Shipped - ${data.orderNumber}`,
      html: getEmailTemplate(content, 'Order Shipped'),
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send shipping notification:', error)
    return { success: false, error }
  }
}

// 8. Digital Product Delivery
export async function sendDigitalProductDelivery(data: {
  to: string
  name: string
  orderNumber: string
  items: Array<{
    name: string
    downloadUrl: string
    downloadToken: string
    expiresAt: Date
    downloadLimit: number
  }>
  total: number
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://47industries.com'

  const itemsHtml = data.items.map(item => {
    const downloadLink = `${appUrl}/api/download/${item.downloadToken}`
    const expiryDate = new Date(item.expiresAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return getCard(`
      <h3 style="margin: 0 0 12px 0; color: #18181b; font-size: 18px; font-weight: 700;" class="text-primary">${item.name}</h3>
      <p style="margin: 0 0 20px 0; color: #71717a; font-size: 14px;" class="text-muted">
        Downloads remaining: <strong>${item.downloadLimit}</strong> • Expires: <strong>${expiryDate}</strong>
      </p>
      ${getButton('Download File', downloadLink, false)}
    `)
  }).join('')

  const content = `
    <div style="text-align: center; margin: 0 0 32px 0;">
      <div style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 32px; border-radius: 20px;">
        <p style="margin: 0 0 16px 0; color: #ffffff; font-size: 48px; line-height: 1;">⬇</p>
        <p style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 1px;">READY</p>
      </div>
    </div>

    <h1 style="margin: 0 0 16px 0; color: #18181b; font-size: 32px; font-weight: 700; text-align: center; line-height: 1.2;" class="text-primary">
      Your Downloads Are Ready!
    </h1>
    <p style="margin: 0 0 8px 0; color: #52525b; font-size: 16px; line-height: 1.6; text-align: center;" class="text-secondary">
      Hello ${data.name || 'there'}! Your digital products are ready for download.
    </p>

    ${getAccentBox('Order Number', data.orderNumber)}

    ${getSectionHeading('Your Downloads')}

    ${itemsHtml}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 32px 0;">
      <tr>
        <td style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px;">
          <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.6;">
            <strong>Important:</strong> Download links are unique to your order and have limited downloads. Please save your files after downloading.
          </p>
        </td>
      </tr>
    </table>
  `

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      bcc: CONFIRMATION_BCC,
      subject: `Your Digital Downloads Are Ready - ${data.orderNumber}`,
      html: getEmailTemplate(content, 'Downloads Ready'),
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send digital product delivery email:', error)
    return { success: false, error }
  }
}

// 9. Payment Failure Notification
export async function sendPaymentFailureNotification(data: {
  to: string
  name: string
  orderNumber?: string
  amount: number
  reason?: string
}) {
  const content = `
    <div style="text-align: center; margin: 0 0 32px 0;">
      <div style="display: inline-block; background-color: #fef2f2; border: 3px solid #dc2626; padding: 32px; border-radius: 20px;">
        <p style="margin: 0 0 16px 0; color: #dc2626; font-size: 48px; line-height: 1;">⚠</p>
        <p style="margin: 0; color: #dc2626; font-size: 24px; font-weight: 700; letter-spacing: 1px;">PAYMENT FAILED</p>
      </div>
    </div>

    <h1 style="margin: 0 0 12px 0; color: #18181b; font-size: 28px; font-weight: 700; line-height: 1.3;" class="text-primary">
      Hello ${data.name || 'there'},
    </h1>
    <p style="margin: 0 0 8px 0; color: #52525b; font-size: 16px; line-height: 1.6;" class="text-secondary">
      Unfortunately, we were unable to process your payment of <strong style="color: #18181b;" class="text-primary">$${data.amount.toFixed(2)}</strong>.
    </p>

    ${data.reason ? getCard(`
      <p style="margin: 0 0 8px 0; color: #dc2626; font-size: 15px; font-weight: 600;">Reason</p>
      <p style="margin: 0; color: #52525b; font-size: 15px;" class="text-secondary">${data.reason}</p>
    `) : ''}

    ${getSectionHeading('What You Can Do')}

    ${getCard(`
      <ul style="margin: 0; padding: 0 0 0 20px; color: #52525b; font-size: 15px; line-height: 2;" class="text-secondary">
        <li>Check that your card details are correct</li>
        <li>Ensure your card has sufficient funds</li>
        <li>Contact your bank if the issue persists</li>
        <li>Try a different payment method</li>
      </ul>
    `)}

    ${getButton('Try Again', 'https://47industries.com/shop')}
  `

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      bcc: CONFIRMATION_BCC,
      subject: `Payment Failed${data.orderNumber ? ` - ${data.orderNumber}` : ''}`,
      html: getEmailTemplate(content, 'Payment Failed'),
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send payment failure notification:', error)
    return { success: false, error }
  }
}

// 10. 3D Print Quote Email
export async function sendQuoteEmail(data: {
  to: string
  name: string
  requestNumber: string
  estimatedPrice: number
  estimatedDays: number
  notes?: string
}) {
  const content = `
    <h1 style="margin: 0 0 12px 0; color: #18181b; font-size: 28px; font-weight: 700; line-height: 1.3;" class="text-primary">
      Hello ${data.name}!
    </h1>
    <p style="margin: 0 0 8px 0; color: #52525b; font-size: 16px; line-height: 1.6;" class="text-secondary">
      Great news! We've reviewed your 3D printing request and prepared a quote for you.
    </p>

    ${getCard(`
      <div style="text-align: center; padding: 8px 0;">
        <p style="margin: 0 0 12px 0; color: #71717a; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;" class="text-muted">Request #${data.requestNumber}</p>
        <p style="margin: 0 0 20px 0; color: #10b981; font-size: 36px; font-weight: 700; line-height: 1;">$${data.estimatedPrice.toFixed(2)}</p>
        <p style="margin: 0; color: #52525b; font-size: 16px;" class="text-secondary">Estimated delivery: <strong style="color: #18181b;" class="text-primary">${data.estimatedDays} business days</strong></p>
      </div>
    `)}

    ${data.notes ? getCard(`
      <p style="margin: 0 0 12px 0; color: #18181b; font-size: 15px; font-weight: 700;" class="text-primary">Notes from our team:</p>
      <p style="margin: 0; color: #52525b; font-size: 15px; line-height: 1.6;" class="text-secondary">${data.notes}</p>
    `) : ''}

    <p style="margin: 32px 0 0 0; color: #52525b; font-size: 15px; line-height: 1.6; text-align: center;" class="text-secondary">
      <strong style="color: #18181b;" class="text-primary">Ready to proceed?</strong> Contact us at <a href="mailto:support@47industries.com" style="color: #3b82f6; text-decoration: none;">support@47industries.com</a> to confirm your order.
    </p>

    <p style="margin: 24px 0 0 0; color: #71717a; font-size: 13px; text-align: center;" class="text-muted">
      This quote is valid for 14 days
    </p>
  `

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      bcc: CONFIRMATION_BCC,
      subject: `Your 3D Print Quote is Ready - ${data.requestNumber}`,
      html: getEmailTemplate(content, 'Quote Ready'),
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send quote email:', error)
    return { success: false, error }
  }
}

// 11. Invoice Email (send invoice to customer with payment link)
export async function sendInvoice(data: {
  to: string
  name: string
  invoiceNumber: string
  items: Array<{ description: string; quantity: number; total: number }>
  subtotal: number
  taxAmount: number
  total: number
  dueDate?: Date | null
  paymentLink: string
  notes?: string | null
}) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://47industries.com'
  const invoiceUrl = `${APP_URL}/invoice/${data.invoiceNumber}`

  const itemsHtml = data.items.map((item, index) => {
    const isLast = index === data.items.length - 1

    return `
      <tr>
        <td style="padding: 16px 0; ${isLast ? '' : 'border-bottom: 1px solid #e4e4e7;'}" class="divider">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="70%" style="padding-right: 20px;">
                <p style="margin: 0 0 4px 0; color: #18181b; font-size: 15px; font-weight: 500;" class="text-primary">${item.description}</p>
                <p style="margin: 0; color: #71717a; font-size: 13px;" class="text-muted">Qty: ${item.quantity}</p>
              </td>
              <td width="30%" align="right">
                <p style="margin: 0; color: #18181b; font-size: 16px; font-weight: 600;" class="text-primary">$${item.total.toFixed(2)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
  }).join('')

  const dueDateStr = data.dueDate
    ? new Date(data.dueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const content = `
    <h1 style="margin: 0 0 12px 0; color: #18181b; font-size: 28px; font-weight: 700; line-height: 1.3;" class="text-primary">
      Hello ${data.name}!
    </h1>
    <p style="margin: 0 0 8px 0; color: #52525b; font-size: 16px; line-height: 1.6;" class="text-secondary">
      We've prepared an invoice for you. Please review the details below and click the button to complete your payment.
    </p>

    ${getAccentBox('Invoice Number', data.invoiceNumber, dueDateStr ? `Due: ${dueDateStr}` : undefined)}

    ${getCard(`
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding-bottom: 16px;">
            <p style="margin: 0; color: #18181b; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;" class="text-primary">Invoice Details</p>
          </td>
        </tr>
        ${itemsHtml}
      </table>
    `)}

    ${getCard(`
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding: 12px 0;">
            <p style="margin: 0; color: #52525b; font-size: 15px;" class="text-secondary">Subtotal</p>
          </td>
          <td align="right" style="padding: 12px 0;">
            <p style="margin: 0; color: #18181b; font-size: 15px; font-weight: 500;" class="text-primary">$${data.subtotal.toFixed(2)}</p>
          </td>
        </tr>
        ${data.taxAmount > 0 ? `
          <tr>
            <td style="padding: 12px 0;">
              <p style="margin: 0; color: #52525b; font-size: 15px;" class="text-secondary">Tax</p>
            </td>
            <td align="right" style="padding: 12px 0;">
              <p style="margin: 0; color: #18181b; font-size: 15px; font-weight: 500;" class="text-primary">$${data.taxAmount.toFixed(2)}</p>
            </td>
          </tr>
        ` : ''}
        <tr>
          <td style="padding: 20px 0 0 0; border-top: 2px solid #e4e4e7;" class="divider">
            <p style="margin: 0; color: #18181b; font-size: 18px; font-weight: 700;" class="text-primary">Amount Due</p>
          </td>
          <td align="right" style="padding: 20px 0 0 0; border-top: 2px solid #e4e4e7;" class="divider">
            <p style="margin: 0; color: #3b82f6; font-size: 24px; font-weight: 700;">$${data.total.toFixed(2)}</p>
          </td>
        </tr>
      </table>
    `)}

    ${data.notes ? getCard(`
      <p style="margin: 0 0 8px 0; color: #71717a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;" class="text-muted">Notes</p>
      <p style="margin: 0; color: #52525b; font-size: 15px; line-height: 1.6;" class="text-secondary">${data.notes}</p>
    `) : ''}

    ${getButton('Pay Now - $' + data.total.toFixed(2), data.paymentLink)}

    <p style="margin: 24px 0 0 0; color: #71717a; font-size: 14px; text-align: center;" class="text-muted">
      <a href="${invoiceUrl}" style="color: #3b82f6; text-decoration: none;">View invoice online</a>
    </p>

    <p style="margin: 32px 0 0 0; color: #71717a; font-size: 13px; text-align: center; line-height: 1.6;" class="text-muted">
      Secure payment powered by Stripe. All major credit cards accepted.
    </p>
  `

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      bcc: CONFIRMATION_BCC,
      subject: `Invoice ${data.invoiceNumber} from 47 Industries`,
      html: getEmailTemplate(content, 'Invoice'),
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send invoice email:', error)
    return { success: false, error }
  }
}

// 12. Invoice Payment Confirmation
export async function sendInvoicePaymentConfirmation(data: {
  to: string
  name: string
  invoiceNumber: string
  total: number
  items: Array<{ description: string; quantity: number; total: number }>
}) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://47industries.com'
  const invoiceUrl = `${APP_URL}/invoice/${data.invoiceNumber}`

  const itemsHtml = data.items.map((item, index) => {
    const isLast = index === data.items.length - 1

    return `
      <tr>
        <td style="padding: 12px 0; ${isLast ? '' : 'border-bottom: 1px solid #e4e4e7;'}" class="divider">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="70%" style="padding-right: 16px;">
                <p style="margin: 0; color: #18181b; font-size: 14px;" class="text-primary">${item.description}</p>
              </td>
              <td width="30%" align="right">
                <p style="margin: 0; color: #18181b; font-size: 14px;" class="text-primary">$${item.total.toFixed(2)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
  }).join('')

  const content = `
    <div style="text-align: center; margin: 0 0 32px 0;">
      <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; border-radius: 20px;">
        <p style="margin: 0 0 12px 0; font-size: 48px; line-height: 1;">
          <span style="display: inline-block; width: 56px; height: 56px; background-color: rgba(255,255,255,0.2); border-radius: 50%; line-height: 56px; font-size: 28px;">&#10003;</span>
        </p>
        <p style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 1px;">PAID</p>
      </div>
    </div>

    <h1 style="margin: 0 0 16px 0; color: #18181b; font-size: 32px; font-weight: 700; text-align: center; line-height: 1.2;" class="text-primary">
      Payment Received!
    </h1>
    <p style="margin: 0 0 8px 0; color: #52525b; font-size: 16px; line-height: 1.6; text-align: center;" class="text-secondary">
      Thank you, ${data.name}! We've received your payment.
    </p>

    ${getAccentBox('Invoice Number', data.invoiceNumber)}

    ${getCard(`
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${itemsHtml}
        <tr>
          <td colspan="2" style="padding-top: 16px; border-top: 2px solid #e4e4e7;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="70%">
                  <p style="margin: 0; color: #18181b; font-size: 16px; font-weight: 700;" class="text-primary">Total Paid</p>
                </td>
                <td width="30%" align="right">
                  <p style="margin: 0; color: #10b981; font-size: 18px; font-weight: 700;">$${data.total.toFixed(2)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `)}

    <p style="margin: 24px 0 0 0; color: #52525b; font-size: 15px; text-align: center;" class="text-secondary">
      This email serves as your payment receipt.
    </p>

    <p style="margin: 16px 0 0 0; color: #71717a; font-size: 14px; text-align: center;" class="text-muted">
      <a href="${invoiceUrl}" style="color: #3b82f6; text-decoration: none;">View invoice</a>
    </p>
  `

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      bcc: CONFIRMATION_BCC,
      subject: `Payment Received - Invoice ${data.invoiceNumber}`,
      html: getEmailTemplate(content, 'Payment Received'),
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send invoice payment confirmation:', error)
    return { success: false, error }
  }
}

// 13. Partner Invite Email
export async function sendPartnerInvite(data: {
  to: string
  name: string
  partnerNumber: string
  inviteToken: string
  firstSaleRate: number
  recurringRate: number
}) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://47industries.com'
  const inviteUrl = `${APP_URL}/invite/partner?token=${data.inviteToken}`

  const content = `
    <h1 style="margin: 0 0 12px 0; color: #18181b; font-size: 28px; font-weight: 700; line-height: 1.3;" class="text-primary">
      Welcome to 47 Industries, ${data.name}!
    </h1>
    <p style="margin: 0 0 8px 0; color: #52525b; font-size: 16px; line-height: 1.6;" class="text-secondary">
      You've been added as a partner. Set up your password to access your partner dashboard.
    </p>

    ${getAccentBox('Partner Number', data.partnerNumber)}

    ${getCard(`
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <p style="margin: 0; color: #18181b; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;" class="text-primary">Your Commission Rates</p>
          </td>
        </tr>
        ${getDetailRow('First Sale', data.firstSaleRate + '% commission')}
        ${getDetailRow('Recurring Sales', data.recurringRate + '% commission', true)}
      </table>
    `)}

    ${getButton('Set Up Your Account', inviteUrl)}

    ${getSectionHeading('What You Can Do')}

    ${getCard(`
      <ul style="margin: 0; padding: 0 0 0 20px; color: #52525b; font-size: 15px; line-height: 2;" class="text-secondary">
        <li>Submit leads through your partner portal</li>
        <li>Track your commissions in real-time</li>
        <li>View your payout history</li>
        <li>Access your partner contract</li>
      </ul>
    `)}

    <p style="margin: 32px 0 0 0; color: #71717a; font-size: 13px; text-align: center; line-height: 1.6;" class="text-muted">
      This invite link expires in 7 days. If you have any questions, contact us at support@47industries.com
    </p>
  `

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      bcc: CONFIRMATION_BCC,
      subject: `You're Invited as a Partner - 47 Industries`,
      html: getEmailTemplate(content, 'Partner Invitation'),
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send partner invite:', error)
    return { success: false, error }
  }
}

// Send email to partner when contract is ready to sign
export async function sendContractReadyToSign(data: {
  to: string
  name: string
  contractTitle: string
}) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://47industries.com'
  const signUrl = `${APP_URL}/account/partner/contract`

  const content = `
    <h1 style="margin: 0 0 12px 0; color: #18181b; font-size: 28px; font-weight: 700; line-height: 1.3;" class="text-primary">
      Your Agreement is Ready to Sign
    </h1>
    <p style="margin: 0 0 24px 0; color: #52525b; font-size: 16px; line-height: 1.6;" class="text-secondary">
      Hi ${data.name}, your partner agreement with 47 Industries is ready for your electronic signature.
    </p>

    ${getCard(`
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${getDetailRow('Document', data.contractTitle, true)}
      </table>
    `)}

    ${getButton('Review & Sign Contract', signUrl)}

    <p style="margin: 32px 0 0 0; color: #52525b; font-size: 14px; line-height: 1.6;" class="text-secondary">
      Please review the agreement carefully before signing. Once signed, you'll receive a confirmation email and can access your signed contract anytime from your partner portal.
    </p>

    <p style="margin: 16px 0 0 0; color: #71717a; font-size: 13px; line-height: 1.6;" class="text-muted">
      If you have any questions about the agreement, please contact us at support@47industries.com
    </p>
  `

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      bcc: CONFIRMATION_BCC,
      subject: `Your Partner Agreement is Ready to Sign - 47 Industries`,
      html: getEmailTemplate(content, 'Contract Ready to Sign'),
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send contract ready to sign email:', error)
    return { success: false, error }
  }
}

// Send notification to admin when contract is signed
export async function sendContractSignedNotification(data: {
  partnerName: string
  partnerEmail: string
  partnerId: string
  contractTitle: string
  signedAt: Date
  signedByName: string
  signedByIp: string
}) {
  const ADMIN_URL = process.env.ADMIN_URL || 'https://admin.47industries.com'
  const partnerUrl = `${ADMIN_URL}/admin/partners/${data.partnerId}`

  const signedDate = data.signedAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  const content = `
    <h1 style="margin: 0 0 12px 0; color: #18181b; font-size: 28px; font-weight: 700; line-height: 1.3;" class="text-primary">
      Contract Signed
    </h1>
    <p style="margin: 0 0 24px 0; color: #52525b; font-size: 16px; line-height: 1.6;" class="text-secondary">
      ${data.partnerName} has signed their partner agreement.
    </p>

    ${getCard(`
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${getDetailRow('Partner', data.partnerName)}
        ${getDetailRow('Email', data.partnerEmail)}
        ${getDetailRow('Document', data.contractTitle)}
        ${getDetailRow('Signed As', data.signedByName)}
        ${getDetailRow('Signed At', signedDate)}
        ${getDetailRow('IP Address', data.signedByIp, true)}
      </table>
    `)}

    ${getButton('View Partner Details', partnerUrl)}
  `

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      bcc: BCC_EMAIL,
      subject: `Partner Agreement Signed - ${data.partnerName}`,
      html: getEmailTemplate(content, 'Contract Signed'),
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send contract signed notification:', error)
    return { success: false, error }
  }
}

// Helper function for carrier tracking URLs
function getCarrierTrackingUrl(carrier: string, trackingNumber: string): string {
  const carrierLower = carrier.toLowerCase()

  if (carrierLower.includes('usps')) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`
  }
  if (carrierLower.includes('ups')) {
    return `https://www.ups.com/track?tracknum=${trackingNumber}`
  }
  if (carrierLower.includes('fedex')) {
    return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`
  }
  if (carrierLower.includes('dhl')) {
    return `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${trackingNumber}`
  }

  return `https://www.google.com/search?q=${carrier}+tracking+${trackingNumber}`
}
