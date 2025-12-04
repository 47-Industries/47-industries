import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { InquiryStatus } from '@prisma/client'

// Initialize Resend lazily
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

// BCC addresses for all confirmation emails
const CONFIRMATION_BCC = ['confirmations@47industries.com', 'kylerivers4@gmail.com']

// POST /api/admin/inquiries/send-quote - Send project quote to customer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.to || !body.name || !body.inquiryNumber) {
      return NextResponse.json(
        { error: 'To, name, and inquiry number are required' },
        { status: 400 }
      )
    }

    if (!body.oneTimeAmount && !body.monthlyAmount) {
      return NextResponse.json(
        { error: 'At least one quote amount is required' },
        { status: 400 }
      )
    }

    const validDays = body.validDays || 14
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + validDays)
    const formattedExpiry = expiryDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    // Build pricing section
    let pricingHtml = ''
    if (body.oneTimeAmount) {
      pricingHtml += `
        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
          <span style="color: #666;">Project Total</span>
          <span style="font-size: 24px; font-weight: bold; color: #10b981;">$${body.oneTimeAmount.toLocaleString()}</span>
        </div>
      `
    }
    if (body.monthlyAmount) {
      pricingHtml += `
        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
          <span style="color: #666;">Monthly Fee</span>
          <span style="font-size: 20px; font-weight: bold; color: #3b82f6;">$${body.monthlyAmount.toLocaleString()}/month</span>
        </div>
      `
    }

    await getResend().emails.send({
      from: 'contact@47industries.com',
      to: body.to,
      bcc: CONFIRMATION_BCC,
      subject: `Your Project Quote - ${body.inquiryNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #000 0%, #1a1a1a 100%); color: #fff; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }
            .content { background: #fff; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e5e5; border-top: none; }
            .quote-box { background: #f9f9f9; padding: 25px; border-radius: 12px; margin: 25px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .button { display: inline-block; background: #3b82f6; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
            .expiry { background: #fef3c7; border: 1px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Your Project Quote</h1>
              <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 16px;">47 Industries</p>
            </div>
            <div class="content">
              <h2 style="margin-top: 0;">Hello ${body.name}!</h2>
              <p>Thank you for your interest in working with us. Based on your project requirements, we've prepared the following quote for you:</p>

              <div class="quote-box">
                <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">Reference: ${body.inquiryNumber}</p>
                ${pricingHtml}
              </div>

              ${body.notes ? `
                <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                  <p style="margin: 0 0 8px 0; font-weight: 600; color: #1e40af;">Additional Details</p>
                  <p style="margin: 0; color: #555;">${body.notes.replace(/\n/g, '<br>')}</p>
                </div>
              ` : ''}

              <div class="expiry">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>Quote Valid Until:</strong> ${formattedExpiry}
                </p>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <p style="margin-bottom: 15px;">Ready to move forward? Simply reply to this email or click the button below:</p>
                <a href="mailto:contact@47industries.com?subject=Re: Quote ${body.inquiryNumber} - Ready to Proceed" class="button">
                  Accept Quote
                </a>
              </div>

              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Have questions? Reply to this email or give us a call. We're happy to discuss your project in more detail.
              </p>

              <div class="footer">
                <p style="margin: 0;">47 Industries</p>
                <p style="margin: 5px 0;"><a href="https://47industries.com" style="color: #3b82f6;">47industries.com</a></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    // Save the quote as a message in the database if inquiryId is provided
    if (body.inquiryId) {
      // Build quote message
      let quoteMessage = 'We have prepared a quote for your project.'
      if (body.notes) {
        quoteMessage += `\n\n${body.notes}`
      }

      await prisma.inquiryMessage.create({
        data: {
          inquiryId: body.inquiryId,
          message: quoteMessage,
          isFromAdmin: true,
          senderName: '47 Industries',
          isQuote: true,
          quoteAmount: body.oneTimeAmount || null,
          quoteMonthly: body.monthlyAmount || null,
          quoteValidDays: validDays,
        },
      })

      // Update inquiry status to QUOTED
      await prisma.serviceInquiry.update({
        where: { id: body.inquiryId },
        data: { status: InquiryStatus.QUOTED },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending quote email:', error)
    return NextResponse.json(
      { error: 'Failed to send quote email' },
      { status: 500 }
    )
  }
}
