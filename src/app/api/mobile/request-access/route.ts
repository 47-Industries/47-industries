import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      type,
      name,
      email,
      company,
      website,
      socialMedia,
      audience,
      reason,
    } = body

    if (!type || !name || !email || !audience || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already has a pending application
    const existingApplication = await prisma.partnerApplication.findFirst({
      where: {
        userId: session.user.id,
        type: type,
        status: 'PENDING',
      },
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You already have a pending application for this program' },
        { status: 400 }
      )
    }

    // Create the application
    const application = await prisma.partnerApplication.create({
      data: {
        userId: session.user.id,
        type: type, // 'partner' or 'store-affiliate'
        name,
        email,
        company: company || null,
        website: website || null,
        socialMedia: socialMedia || null,
        audience,
        reason,
        status: 'PENDING',
      },
    })

    // Send notification email to admin
    const programName = type === 'partner' ? 'Partner Program' : 'Store Affiliate Program'

    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@47industries.com',
        subject: `New ${programName} Application - ${name}`,
        html: `
          <h2>New ${programName} Application</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Company:</strong> ${company || 'N/A'}</p>
          <p><strong>Website:</strong> ${website || 'N/A'}</p>
          <p><strong>Social Media:</strong> ${socialMedia || 'N/A'}</p>
          <h3>How they plan to promote:</h3>
          <p>${audience}</p>
          <h3>Why they want to join:</h3>
          <p>${reason}</p>
          <hr />
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/partners">View in Admin</a></p>
        `,
      })
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError)
      // Don't fail the request if email fails
    }

    // Send confirmation email to applicant
    try {
      await sendEmail({
        to: email,
        subject: `Your ${programName} Application - 47 Industries`,
        html: `
          <h2>Application Received</h2>
          <p>Hi ${name},</p>
          <p>Thank you for applying to the 47 Industries ${programName}!</p>
          <p>We've received your application and will review it within 2-3 business days. We'll reach out via email once a decision has been made.</p>
          <p>In the meantime, you can continue earning points through the MotoRev referral program.</p>
          <br />
          <p>Best regards,</p>
          <p>The 47 Industries Team</p>
        `,
      })
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
    }

    return NextResponse.json({
      success: true,
      applicationId: application.id,
    })
  } catch (error) {
    console.error('Error submitting application:', error)
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    )
  }
}
