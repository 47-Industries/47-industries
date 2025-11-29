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

export async function sendAdminNotification(data: {
  type: 'custom_request' | 'contact' | 'order'
  title: string
  details: string
  link: string
}) {
  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
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
                <p style="margin: 0; font-size: 32px;">📦</p>
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
