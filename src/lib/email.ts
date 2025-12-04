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

// Email templates
export async function sendCustomRequestConfirmation(data: {
  to: string
  name: string
  requestNumber: string
  material?: string
  finish?: string
  color?: string
  quantity?: number
}) {
  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      bcc: CONFIRMATION_BCC,
      subject: `3D Print Request Received - ${data.requestNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: #fff; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .highlight { background: #3b82f6; color: #fff; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .details { background: #fff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e5e5; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">47 Industries</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.8;">Custom 3D Printing</p>
            </div>
            <div class="content">
              <h2>Hello ${data.name}!</h2>
              <p>Thank you for submitting your 3D printing request. We've received your files and specifications.</p>

              <div class="highlight">
                <p style="margin: 0; font-size: 14px;">Your Request Number</p>
                <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">${data.requestNumber}</p>
              </div>

              ${data.material ? `
              <div class="details">
                <p style="margin: 0 0 10px 0; font-weight: bold;">Your Request Details:</p>
                <p style="margin: 5px 0;"><strong>Material:</strong> ${data.material}</p>
                <p style="margin: 5px 0;"><strong>Finish:</strong> ${data.finish || 'Standard'}</p>
                <p style="margin: 5px 0;"><strong>Color:</strong> ${data.color || 'Default'}</p>
                <p style="margin: 5px 0;"><strong>Quantity:</strong> ${data.quantity || 1}</p>
              </div>
              ` : ''}

              <p><strong>What happens next?</strong></p>
              <ol>
                <li>Our team will review your 3D model and specifications</li>
                <li>We'll prepare a detailed quote within 24-48 hours</li>
                <li>You'll receive an email with pricing and estimated delivery time</li>
              </ol>

              <p>If you have any questions, simply reply to this email or contact us at support@47industries.com</p>

              <div class="footer">
                <p>47 Industries - Innovation in 3D Printing</p>
                <p><a href="https://47industries.com">47industries.com</a></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send custom request confirmation:', error)
    return { success: false, error }
  }
}

export async function sendContactConfirmation(data: {
  to: string
  name: string
  inquiryNumber: string
  subject: string
}) {
  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      bcc: CONFIRMATION_BCC,
      subject: `We received your message - ${data.inquiryNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: #fff; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .highlight { background: #3b82f6; color: #fff; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">47 Industries</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.8;">Web & App Development</p>
            </div>
            <div class="content">
              <h2>Hello ${data.name}!</h2>
              <p>Thank you for reaching out to us. We've received your inquiry about:</p>

              <blockquote style="border-left: 4px solid #3b82f6; padding-left: 15px; margin: 20px 0; color: #555;">
                ${data.subject}
              </blockquote>

              <div class="highlight">
                <p style="margin: 0; font-size: 14px;">Reference Number</p>
                <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">${data.inquiryNumber}</p>
              </div>

              <p>One of our team members will review your message and get back to you within 1-2 business days.</p>

              <p>In the meantime, feel free to check out our services at <a href="https://47industries.com">47industries.com</a></p>

              <div class="footer">
                <p>47 Industries - Digital Solutions</p>
                <p><a href="https://47industries.com">47industries.com</a></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send contact confirmation:', error)
    return { success: false, error }
  }
}

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

  // Build services list HTML
  const servicesHtml = data.services && data.services.length > 0
    ? data.services.map(s => `<span style="display: inline-block; background: #3b82f6; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 13px; margin: 3px 4px 3px 0;">${s}</span>`).join('')
    : `<span style="display: inline-block; background: #3b82f6; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 13px;">${data.serviceType}</span>`

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      bcc: CONFIRMATION_BCC,
      subject: `Project Inquiry Received - ${data.inquiryNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="color-scheme" content="light dark">
          <meta name="supported-color-schemes" content="light dark">
          <style>
            :root { color-scheme: light dark; }
            @media (prefers-color-scheme: dark) {
              .email-body { background-color: #0a0a0a !important; }
              .email-container { background-color: #0a0a0a !important; }
              .content-box { background-color: #1a1a1a !important; border-color: #27272a !important; }
              .text-primary { color: #ffffff !important; }
              .text-secondary { color: #a1a1aa !important; }
              .details-box { background-color: #0a0a0a !important; border-color: #27272a !important; }
              .timeline-box { background-color: #0a0a0a !important; border-color: #27272a !important; }
              .footer-text { color: #71717a !important; }
            }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif; line-height: 1.6; margin: 0; padding: 0; }
          </style>
        </head>
        <body class="email-body" style="background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #f4f4f5;">

            <!-- Header with Logo -->
            <div style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <img src="${APP_URL}/logo.png" alt="47 Industries" style="height: 48px; margin-bottom: 16px;" />
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Project Inquiry Received</h1>
            </div>

            <!-- Main Content -->
            <div class="content-box" style="background-color: #ffffff; padding: 32px; border: 1px solid #e4e4e7; border-top: none;">

              <p class="text-primary" style="color: #18181b; font-size: 16px; margin: 0 0 20px 0;">
                Hello <strong>${data.name}</strong>,
              </p>

              <p class="text-secondary" style="color: #52525b; font-size: 15px; margin: 0 0 24px 0;">
                Thank you for your interest in working with us. We've received your project inquiry and our team is excited to review it.
              </p>

              <!-- Reference Number Box -->
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; color: rgba(255,255,255,0.8); font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Reference Number</p>
                <p style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 1px;">${data.inquiryNumber}</p>
              </div>

              <!-- Project Details -->
              <div class="details-box" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h3 class="text-primary" style="color: #18181b; font-size: 14px; font-weight: 600; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">Project Summary</h3>

                ${data.projectName ? `
                <div style="margin-bottom: 12px;">
                  <span class="text-secondary" style="color: #71717a; font-size: 13px;">Project Name</span>
                  <p class="text-primary" style="color: #18181b; font-size: 15px; margin: 4px 0 0 0; font-weight: 500;">${data.projectName}</p>
                </div>
                ` : ''}

                <div style="margin-bottom: 12px;">
                  <span class="text-secondary" style="color: #71717a; font-size: 13px;">Services Requested</span>
                  <div style="margin-top: 8px;">${servicesHtml}</div>
                </div>

                ${data.budget ? `
                <div style="margin-bottom: 12px;">
                  <span class="text-secondary" style="color: #71717a; font-size: 13px;">Budget Range</span>
                  <p class="text-primary" style="color: #18181b; font-size: 15px; margin: 4px 0 0 0; font-weight: 500;">${data.budget}</p>
                </div>
                ` : ''}

                ${data.timeline ? `
                <div style="margin-bottom: 12px;">
                  <span class="text-secondary" style="color: #71717a; font-size: 13px;">Timeline</span>
                  <p class="text-primary" style="color: #18181b; font-size: 15px; margin: 4px 0 0 0; font-weight: 500;">${data.timeline}</p>
                </div>
                ` : ''}

                ${data.description ? `
                <div style="margin-bottom: 0;">
                  <span class="text-secondary" style="color: #71717a; font-size: 13px;">Project Description</span>
                  <p class="text-primary" style="color: #18181b; font-size: 14px; margin: 4px 0 0 0; line-height: 1.6;">${data.description.length > 200 ? data.description.substring(0, 200) + '...' : data.description}</p>
                </div>
                ` : ''}
              </div>

              <!-- View Full Details Button -->
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${trackingUrl}" style="display: inline-block; background: #18181b; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                  View Full Inquiry & Updates
                </a>
              </div>

              <!-- What's Next Timeline -->
              <div class="timeline-box" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 20px;">
                <h3 class="text-primary" style="color: #18181b; font-size: 14px; font-weight: 600; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">What Happens Next</h3>

                <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                  <div style="width: 28px; height: 28px; background: #3b82f6; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px; margin-right: 14px; flex-shrink: 0;">1</div>
                  <div>
                    <p class="text-primary" style="color: #18181b; font-size: 14px; font-weight: 600; margin: 0;">Review</p>
                    <p class="text-secondary" style="color: #71717a; font-size: 13px; margin: 2px 0 0 0;">Our team will carefully review your project requirements</p>
                  </div>
                </div>

                <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                  <div style="width: 28px; height: 28px; background: #3b82f6; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px; margin-right: 14px; flex-shrink: 0;">2</div>
                  <div>
                    <p class="text-primary" style="color: #18181b; font-size: 14px; font-weight: 600; margin: 0;">Discovery Call</p>
                    <p class="text-secondary" style="color: #71717a; font-size: 13px; margin: 2px 0 0 0;">We'll schedule a call to discuss your vision in detail</p>
                  </div>
                </div>

                <div style="display: flex; align-items: flex-start;">
                  <div style="width: 28px; height: 28px; background: #3b82f6; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px; margin-right: 14px; flex-shrink: 0;">3</div>
                  <div>
                    <p class="text-primary" style="color: #18181b; font-size: 14px; font-weight: 600; margin: 0;">Proposal</p>
                    <p class="text-secondary" style="color: #71717a; font-size: 13px; margin: 2px 0 0 0;">You'll receive a detailed proposal with timeline and pricing</p>
                  </div>
                </div>
              </div>

              <p class="text-secondary" style="color: #52525b; font-size: 14px; margin: 24px 0 0 0; text-align: center;">
                Expect to hear from us within <strong style="color: #18181b;">1-2 business days</strong>.
              </p>

            </div>

            <!-- Footer -->
            <div style="padding: 24px 32px; text-align: center; border-radius: 0 0 12px 12px; background-color: #fafafa; border: 1px solid #e4e4e7; border-top: none;">
              <p class="footer-text" style="color: #71717a; font-size: 13px; margin: 0 0 8px 0;">
                47 Industries - Digital Solutions
              </p>
              <p style="margin: 0;">
                <a href="https://47industries.com" style="color: #3b82f6; text-decoration: none; font-size: 13px;">47industries.com</a>
              </p>
              <p class="footer-text" style="color: #a1a1aa; font-size: 11px; margin: 16px 0 0 0;">
                Questions? Reply to this email or visit your <a href="${trackingUrl}" style="color: #3b82f6; text-decoration: none;">inquiry page</a>.
              </p>
            </div>

          </div>
        </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send service inquiry confirmation:', error)
    return { success: false, error }
  }
}

export async function sendAdminNotification(data: {
  type: 'custom_request' | 'contact' | 'order' | 'service_inquiry'
  title: string
  details: string
  link: string
}) {
  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      bcc: CONFIRMATION_BCC,
      subject: `[47 Industries] New ${data.type.replace('_', ' ')} - ${data.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a1a; color: #fff; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">New ${data.type.replace('_', ' ').toUpperCase()}</h2>
            </div>
            <div class="content">
              <h3>${data.title}</h3>
              <div style="white-space: pre-wrap;">${data.details}</div>
              <a href="${data.link}" class="button">View in Admin Panel</a>
            </div>
          </div>
        </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send admin notification:', error)
    return { success: false, error }
  }
}

export async function sendReplyEmail(data: {
  to: string
  subject: string
  message: string
  referenceNumber?: string
  fromAddress?: string
  senderName?: string
}) {
  try {
    const fromEmail = data.fromAddress || FROM_EMAIL
    const from = data.senderName ? `${data.senderName} <${fromEmail}>` : fromEmail

    await getResend().emails.send({
      from,
      to: data.to,
      bcc: CONFIRMATION_BCC,
      subject: data.referenceNumber ? `Re: ${data.subject} [${data.referenceNumber}]` : `Re: ${data.subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: #fff; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .message { background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e5e5; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">47 Industries</h1>
            </div>
            <div class="content">
              <div class="message">
                ${data.message.replace(/\n/g, '<br>')}
              </div>

              ${data.referenceNumber ? `<p style="margin-top: 20px; color: #666; font-size: 14px;">Reference: ${data.referenceNumber}</p>` : ''}

              <div class="footer">
                <p>47 Industries</p>
                <p><a href="https://47industries.com">47industries.com</a></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send reply email:', error)
    return { success: false, error }
  }
}

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
  try {
    const itemsHtml = data.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
      </tr>
    `).join('')

    await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      bcc: CONFIRMATION_BCC,
      subject: `Order Confirmed - ${data.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: #fff; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .highlight { background: #10b981; color: #fff; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { text-align: left; padding: 10px; border-bottom: 2px solid #ddd; }
            .totals { background: #fff; padding: 15px; border-radius: 8px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">47 Industries</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.8;">Order Confirmation</p>
            </div>
            <div class="content">
              <h2>Thank you, ${data.name}!</h2>
              <p>Your order has been confirmed and is being processed.</p>

              <div class="highlight">
                <p style="margin: 0; font-size: 14px;">Order Number</p>
                <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">${data.orderNumber}</p>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <div class="totals">
                <p style="margin: 5px 0; display: flex; justify-content: space-between;">
                  <span>Subtotal:</span> <span>$${data.subtotal.toFixed(2)}</span>
                </p>
                <p style="margin: 5px 0; display: flex; justify-content: space-between;">
                  <span>Shipping:</span> <span>$${data.shipping.toFixed(2)}</span>
                </p>
                <p style="margin: 5px 0; display: flex; justify-content: space-between;">
                  <span>Tax:</span> <span>$${data.tax.toFixed(2)}</span>
                </p>
                <p style="margin: 15px 0 0 0; padding-top: 10px; border-top: 2px solid #ddd; display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
                  <span>Total:</span> <span>$${data.total.toFixed(2)}</span>
                </p>
              </div>

              <p style="margin-top: 20px;">We'll send you another email with tracking information once your order ships.</p>

              <div class="footer">
                <p>47 Industries</p>
                <p><a href="https://47industries.com">47industries.com</a></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send order confirmation:', error)
    return { success: false, error }
  }
}

export async function sendShippingNotification(data: {
  to: string
  name: string
  orderNumber: string
  trackingNumber: string
  carrier: string
}) {
  try {
    const trackingUrl = getCarrierTrackingUrl(data.carrier, data.trackingNumber)

    await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      bcc: CONFIRMATION_BCC,
      subject: `Your Order Has Shipped - ${data.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: #fff; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .highlight { background: #10b981; color: #fff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .tracking-box { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e5e5; }
            .button { display: inline-block; background: #3b82f6; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">47 Industries</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.8;">Shipping Notification</p>
            </div>
            <div class="content">
              <div class="highlight">
                <p style="margin: 0; font-size: 24px; font-weight: bold;">SHIPPED</p>
                <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: bold;">Your Order is On Its Way!</p>
              </div>

              <h2>Hello ${data.name}!</h2>
              <p>Great news! Your order has been shipped and is on its way to you.</p>

              <div class="tracking-box">
                <p style="margin: 0 0 10px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
                <p style="margin: 0 0 10px 0;"><strong>Carrier:</strong> ${data.carrier}</p>
                <p style="margin: 0;"><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${trackingUrl}" class="button">Track Your Package</a>
              </div>

              <p style="color: #666; font-size: 14px;">Delivery times vary based on your location and shipping method selected. Most orders arrive within 5-10 business days.</p>

              <div class="footer">
                <p>47 Industries</p>
                <p><a href="https://47industries.com">47industries.com</a></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send shipping notification:', error)
    return { success: false, error }
  }
}

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
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://47industries.com'

    const itemsHtml = data.items.map(item => {
      const downloadLink = `${appUrl}/api/download/${item.downloadToken}`
      const expiryDate = new Date(item.expiresAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      return `
        <div style="background: #fff; padding: 20px; border-radius: 12px; margin: 15px 0; border: 1px solid #e5e5e5;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <h3 style="margin: 0 0 8px 0; color: #1a1a1a;">${item.name}</h3>
              <p style="margin: 0; color: #666; font-size: 14px;">
                Downloads remaining: ${item.downloadLimit} • Expires: ${expiryDate}
              </p>
            </div>
          </div>
          <a href="${downloadLink}"
             style="display: inline-block; margin-top: 15px; background: #8b5cf6; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Download File
          </a>
        </div>
      `
    }).join('')

    await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      bcc: CONFIRMATION_BCC,
      subject: `Your Digital Downloads Are Ready - ${data.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: #fff; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; }
            .highlight { background: #8b5cf6; color: #fff; padding: 15px 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .icon { font-size: 48px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon" style="font-size: 48px; margin-bottom: 10px;">&#8595;</div>
              <h1 style="margin: 0;">Your Downloads Are Ready!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">47 Industries Digital Products</p>
            </div>
            <div class="content">
              <h2>Hello ${data.name || 'there'}!</h2>
              <p>Thank you for your purchase! Your digital products are ready for download.</p>

              <div class="highlight">
                <p style="margin: 0; font-size: 14px;">Order Number</p>
                <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">${data.orderNumber}</p>
              </div>

              <h3 style="margin-top: 30px;">Your Downloads</h3>
              ${itemsHtml}

              <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin-top: 25px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>Important:</strong> Download links are unique to your order and have limited downloads.
                  Please save your files after downloading.
                </p>
              </div>

              <p style="margin-top: 25px;">If you have any issues with your downloads, please contact us at support@47industries.com</p>

              <div class="footer">
                <p>47 Industries - Digital Products</p>
                <p><a href="https://47industries.com" style="color: #8b5cf6;">47industries.com</a></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send digital product delivery email:', error)
    return { success: false, error }
  }
}

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

export async function sendQuoteEmail(data: {
  to: string
  name: string
  requestNumber: string
  estimatedPrice: number
  estimatedDays: number
  notes?: string
}) {
  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      bcc: CONFIRMATION_BCC,
      subject: `Your 3D Print Quote is Ready - ${data.requestNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: #fff; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .quote-box { background: #fff; padding: 25px; border-radius: 8px; border: 2px solid #3b82f6; margin: 20px 0; }
            .price { font-size: 36px; font-weight: bold; color: #10b981; }
            .button { display: inline-block; background: #3b82f6; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">47 Industries</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.8;">Custom 3D Printing</p>
            </div>
            <div class="content">
              <h2>Hello ${data.name}!</h2>
              <p>Great news! We've reviewed your 3D printing request and prepared a quote for you.</p>

              <div class="quote-box">
                <p style="margin: 0 0 10px 0; color: #666;">Request #${data.requestNumber}</p>
                <p class="price">$${data.estimatedPrice.toFixed(2)}</p>
                <p style="margin: 10px 0 0 0; color: #666;">Estimated delivery: ${data.estimatedDays} business days</p>
              </div>

              ${data.notes ? `
                <div style="background: #fff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0; font-weight: bold;">Notes from our team:</p>
                  <p style="margin: 0; color: #555;">${data.notes}</p>
                </div>
              ` : ''}

              <p><strong>Ready to proceed?</strong> Simply reply to this email to confirm your order, or let us know if you have any questions.</p>

              <p style="color: #666; font-size: 14px;">This quote is valid for 14 days.</p>

              <div class="footer">
                <p>47 Industries - Innovation in 3D Printing</p>
                <p><a href="https://47industries.com">47industries.com</a></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send quote email:', error)
    return { success: false, error }
  }
}
