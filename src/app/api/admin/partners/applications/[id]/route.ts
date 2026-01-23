import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const application = await prisma.partnerApplication.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            userAffiliate: true,
          },
        },
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    return NextResponse.json({ application })
  } catch (error) {
    console.error('Error fetching application:', error)
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, name: true, email: true },
    })

    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action, reviewNotes } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Get the application
    const application = await prisma.partnerApplication.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            userAffiliate: true,
          },
        },
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (application.status !== 'PENDING') {
      return NextResponse.json({ error: 'Application already processed' }, { status: 400 })
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'

    // Update application
    const updatedApplication = await prisma.partnerApplication.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null,
      },
    })

    // If approved, create the partner or update user affiliate
    if (action === 'approve') {
      if (application.type === 'partner') {
        // Create a Partner record
        const partnerCount = await prisma.partner.count()
        const partnerNumber = `PTR-${String(partnerCount + 1).padStart(4, '0')}`

        await prisma.partner.create({
          data: {
            partnerNumber,
            userId: application.userId,
            name: application.name,
            email: application.email,
            company: application.company,
            website: application.website,
            partnerType: 'SERVICE_REFERRAL',
            status: 'ACTIVE',
            commissionType: 'PERCENTAGE',
            firstSaleRate: 15, // 15% on first sale
            recurringRate: 10, // 10% recurring
          },
        })

        // Update user affiliate to mark as partner if they have one
        if (application.user.userAffiliate) {
          await prisma.userAffiliate.update({
            where: { userId: application.userId },
            data: { isPartner: true },
          })
        }
      } else if (application.type === 'store-affiliate') {
        // Create a Partner record for store affiliate
        const partnerCount = await prisma.partner.count()
        const partnerNumber = `AFF-${String(partnerCount + 1).padStart(4, '0')}`

        await prisma.partner.create({
          data: {
            partnerNumber,
            userId: application.userId,
            name: application.name,
            email: application.email,
            company: application.company,
            website: application.website,
            partnerType: 'PRODUCT_AFFILIATE',
            status: 'ACTIVE',
            commissionType: 'PERCENTAGE',
            firstSaleRate: 10, // 10% on purchases
            recurringRate: 10,
          },
        })
      }
    }

    // Send email notification to applicant
    const programName = application.type === 'partner' ? 'Partner Program' : 'Store Affiliate Program'

    try {
      if (action === 'approve') {
        await sendEmail({
          to: application.email,
          subject: `You're Approved! - 47 Industries ${programName}`,
          html: `
            <h2>Congratulations, ${application.name}!</h2>
            <p>Your application to the 47 Industries ${programName} has been approved!</p>
            <p>You now have access to:</p>
            <ul>
              ${application.type === 'partner' ? `
                <li>15% commission on referred service contracts</li>
                <li>Partner dashboard to track leads and earnings</li>
                <li>Priority support</li>
              ` : `
                <li>10% commission on referred shop purchases</li>
                <li>Unique tracking links and discount codes</li>
                <li>Earnings dashboard</li>
              `}
            </ul>
            <p>Log in to your 47 Industries account to access your dashboard.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/account">Go to Dashboard</a></p>
            <br />
            <p>Welcome to the team!</p>
            <p>The 47 Industries Team</p>
          `,
        })
      } else {
        await sendEmail({
          to: application.email,
          subject: `Application Update - 47 Industries ${programName}`,
          html: `
            <h2>Hi ${application.name},</h2>
            <p>Thank you for your interest in the 47 Industries ${programName}.</p>
            <p>After reviewing your application, we've decided not to move forward at this time.</p>
            ${reviewNotes ? `<p><strong>Feedback:</strong> ${reviewNotes}</p>` : ''}
            <p>You're welcome to continue earning points through the MotoRev referral program, and you can reapply in the future.</p>
            <br />
            <p>Best regards,</p>
            <p>The 47 Industries Team</p>
          `,
        })
      }
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError)
    }

    return NextResponse.json({
      success: true,
      application: updatedApplication,
    })
  } catch (error) {
    console.error('Error processing application:', error)
    return NextResponse.json({ error: 'Failed to process application' }, { status: 500 })
  }
}
