import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import Stripe from 'stripe'

// Verify cron secret for Railway/Vercel cron jobs
const verifyCronAuth = (req: NextRequest): boolean => {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    // If no secret configured, allow (for development)
    return true
  }
  const authHeader = req.headers.get('authorization')
  return authHeader === `Bearer ${cronSecret}`
}

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    return null
  }
  return new Resend(process.env.RESEND_API_KEY)
}

const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' })
}

// GET /api/cron/monthly-invoices
// Run on 1st of each month to generate recurring invoices
export async function GET(req: NextRequest) {
  try {
    // Verify authorization
    if (!verifyCronAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting monthly invoice generation...')

    // Get all active clients with projects that have monthly recurring fees
    const clientsWithRecurring = await prisma.client.findMany({
      where: {
        type: 'ACTIVE',
        projects: {
          some: {
            status: 'ACTIVE',
            monthlyRecurring: { gt: 0 },
          },
        },
      },
      include: {
        projects: {
          where: {
            status: 'ACTIVE',
            monthlyRecurring: { gt: 0 },
          },
        },
        contacts: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    })

    console.log(`Found ${clientsWithRecurring.length} clients with recurring fees`)

    const results = {
      invoicesCreated: 0,
      invoicesSent: 0,
      autopayCharged: 0,
      autopayFailed: 0,
      errors: [] as string[],
    }

    const now = new Date()
    const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    for (const client of clientsWithRecurring) {
      try {
        // Calculate total monthly recurring for this client
        const totalMonthly = client.projects.reduce(
          (sum, project) => sum + Number(project.monthlyRecurring || 0),
          0
        )

        if (totalMonthly <= 0) continue

        // Generate invoice number
        const timestamp = now.getFullYear().toString() +
          (now.getMonth() + 1).toString().padStart(2, '0') +
          now.getDate().toString().padStart(2, '0')
        const count = await prisma.invoice.count()
        const invoiceNumber = `INV-${timestamp}-${(count + 1).toString().padStart(4, '0')}`

        // Determine recipient
        const recipientEmail = client.contacts[0]?.email || client.email
        const recipientName = client.contacts[0]?.name || client.name

        // Create invoice items from projects
        const items = client.projects.map((project) => ({
          description: `${project.name} - Monthly Service Fee (${monthYear})`,
          quantity: 1,
          unitPrice: Number(project.monthlyRecurring),
          total: Number(project.monthlyRecurring),
        }))

        // Create invoice
        const invoice = await prisma.invoice.create({
          data: {
            invoiceNumber,
            clientId: client.id,
            customerName: client.name,
            customerEmail: recipientEmail,
            customerCompany: client.name,
            customerPhone: client.phone || null,
            subtotal: totalMonthly,
            taxRate: 0,
            taxAmount: 0,
            total: totalMonthly,
            dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // Due in 30 days
            notes: `Monthly service fee for ${monthYear}. Thank you for your continued partnership!`,
            internalNotes: `Auto-generated monthly invoice for ${client.clientNumber}`,
            status: 'SENT',
            sentAt: now,
            items: {
              create: items,
            },
          },
          include: { items: true },
        })

        results.invoicesCreated++

        // Check if autopay is enabled and has payment method
        const stripe = getStripeClient()
        let autopaySuccess = false

        if (stripe && client.autopayEnabled && client.stripeCustomerId && client.defaultPaymentMethod) {
          try {
            // Create payment intent and charge immediately
            const paymentIntent = await stripe.paymentIntents.create({
              amount: Math.round(totalMonthly * 100), // Convert to cents
              currency: 'usd',
              customer: client.stripeCustomerId,
              payment_method: client.defaultPaymentMethod,
              off_session: true,
              confirm: true,
              metadata: {
                invoiceId: invoice.id,
                invoiceNumber,
                clientId: client.id,
              },
            })

            if (paymentIntent.status === 'succeeded') {
              // Mark invoice as paid
              await prisma.invoice.update({
                where: { id: invoice.id },
                data: {
                  status: 'PAID',
                  paidAt: now,
                  stripePaymentId: paymentIntent.id,
                },
              })

              // Update client revenue
              const paidSum = await prisma.invoice.aggregate({
                where: {
                  clientId: client.id,
                  status: 'PAID',
                },
                _sum: { total: true },
              })

              await prisma.client.update({
                where: { id: client.id },
                data: { totalRevenue: paidSum._sum.total || 0 },
              })

              autopaySuccess = true
              results.autopayCharged++

              console.log(`  + Auto-charged ${invoiceNumber} for ${client.name} ($${totalMonthly.toFixed(2)})`)
            }
          } catch (stripeError: any) {
            console.error(`  ! Autopay failed for ${invoiceNumber}:`, stripeError.message)
            results.autopayFailed++
            results.errors.push(`Autopay failed for ${invoiceNumber}: ${stripeError.message}`)
          }
        }

        // Log activity
        await prisma.clientActivity.create({
          data: {
            clientId: client.id,
            type: autopaySuccess ? 'INVOICE_PAID' : 'INVOICE_SENT',
            description: autopaySuccess
              ? `Monthly invoice ${invoiceNumber} auto-charged ($${totalMonthly.toFixed(2)})`
              : `Monthly invoice ${invoiceNumber} generated and sent ($${totalMonthly.toFixed(2)})`,
            metadata: {
              invoiceId: invoice.id,
              invoiceNumber,
              amount: totalMonthly,
              autopay: autopaySuccess,
            },
          },
        })

        // Update client outstanding balance
        const outstandingSum = await prisma.invoice.aggregate({
          where: {
            clientId: client.id,
            status: { in: ['SENT', 'VIEWED', 'OVERDUE'] },
          },
          _sum: { total: true },
        })

        await prisma.client.update({
          where: { id: client.id },
          data: { totalOutstanding: outstandingSum._sum.total || 0 },
        })

        // Send email notification
        const resend = getResendClient()
        if (resend && recipientEmail) {
          try {
            const invoiceUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://47industries.com'}/invoice/${invoiceNumber}`

            if (autopaySuccess) {
              // Send payment receipt
              await resend.emails.send({
                from: process.env.EMAIL_FROM || 'noreply@47industries.com',
                to: recipientEmail,
                subject: `Payment Receipt - ${invoiceNumber}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Payment Receipt from 47 Industries</h2>
                    <p>Hello ${recipientName},</p>
                    <p>Your monthly service payment for ${monthYear} has been processed successfully.</p>

                    <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #c3e6cb;">
                      <p style="margin: 0 0 8px 0; color: #155724;"><strong>Payment Confirmed</strong></p>
                      <p style="margin: 0 0 8px 0;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                      <p style="margin: 0 0 8px 0;"><strong>Amount Charged:</strong> $${totalMonthly.toFixed(2)}</p>
                      <p style="margin: 0;"><strong>Payment Date:</strong> ${now.toLocaleDateString()}</p>
                    </div>

                    <p>
                      <a href="${invoiceUrl}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
                        View Receipt
                      </a>
                    </p>

                    <p>Thank you for your continued partnership!</p>
                    <p>Best regards,<br>47 Industries Team</p>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">
                      47 Industries LLC<br>
                      <a href="https://47industries.com" style="color: #3b82f6;">47industries.com</a>
                    </p>
                  </div>
                `,
              })
            } else {
              // Send invoice for manual payment
              await resend.emails.send({
                from: process.env.EMAIL_FROM || 'noreply@47industries.com',
                to: recipientEmail,
                subject: `Invoice ${invoiceNumber} - ${monthYear} Monthly Service`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Monthly Invoice from 47 Industries</h2>
                    <p>Hello ${recipientName},</p>
                    <p>Your monthly service invoice for ${monthYear} is ready.</p>

                    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 0 0 8px 0;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                      <p style="margin: 0 0 8px 0;"><strong>Amount Due:</strong> $${totalMonthly.toFixed(2)}</p>
                      <p style="margin: 0;"><strong>Due Date:</strong> ${invoice.dueDate?.toLocaleDateString()}</p>
                    </div>

                    <p>
                      <a href="${invoiceUrl}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
                        View & Pay Invoice
                      </a>
                    </p>

                    <p>Thank you for your continued partnership!</p>
                    <p>Best regards,<br>47 Industries Team</p>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">
                      47 Industries LLC<br>
                      <a href="https://47industries.com" style="color: #3b82f6;">47industries.com</a>
                    </p>
                  </div>
                `,
              })
            }

            results.invoicesSent++
            console.log(`  - Sent ${autopaySuccess ? 'receipt' : 'invoice'} ${invoiceNumber} to ${recipientEmail}`)
          } catch (emailError) {
            console.error(`  - Failed to send email for ${invoiceNumber}:`, emailError)
            results.errors.push(`Failed to send email for ${invoiceNumber}: ${emailError}`)
          }
        }

        console.log(`+ ${autopaySuccess ? 'Auto-charged' : 'Created'} invoice ${invoiceNumber} for ${client.name} ($${totalMonthly.toFixed(2)})`)
      } catch (clientError) {
        console.error(`Error processing client ${client.clientNumber}:`, clientError)
        results.errors.push(`Error processing ${client.clientNumber}: ${clientError}`)
      }
    }

    console.log('')
    console.log('=== Monthly Invoice Generation Complete ===')
    console.log(`Invoices created: ${results.invoicesCreated}`)
    console.log(`Autopay charged: ${results.autopayCharged}`)
    console.log(`Autopay failed: ${results.autopayFailed}`)
    console.log(`Emails sent: ${results.invoicesSent}`)
    console.log(`Errors: ${results.errors.length}`)

    return NextResponse.json({
      success: true,
      message: `Generated ${results.invoicesCreated} invoices (${results.autopayCharged} auto-charged)`,
      results,
    })
  } catch (error) {
    console.error('Monthly invoice generation failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate monthly invoices', details: String(error) },
      { status: 500 }
    )
  }
}

// POST endpoint for manual triggering
export async function POST(req: NextRequest) {
  return GET(req)
}
