import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

// GET /api/admin/clients/[id]/link-user?search=email
// Search for users to link
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')

    if (!search || search.length < 2) {
      return NextResponse.json({ users: [] })
    }

    // Search users by email or name
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: search.toLowerCase() } },
          { name: { contains: search } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        client: {
          select: { id: true, name: true },
        },
      },
      take: 10,
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 })
  }
}

// POST /api/admin/clients/[id]/link-user
// Link a user account to a client OR send invitation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { userId, email, sendInvite } = body

    // Find the client first
    const client = await prisma.client.findUnique({
      where: { id },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // If linking by userId (selected from search)
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Check if user is already linked to a different client
      const existingLink = await prisma.client.findUnique({
        where: { userId: user.id },
      })

      if (existingLink && existingLink.id !== id) {
        return NextResponse.json(
          { error: `This user is already linked to ${existingLink.name}` },
          { status: 400 }
        )
      }

      // Link the user
      await prisma.client.update({
        where: { id },
        data: { userId: user.id },
      })

      // Log activity
      await prisma.clientActivity.create({
        data: {
          clientId: id,
          type: 'PORTAL_ACCESS',
          description: `User account ${user.email} linked for portal access`,
          metadata: {
            userId: user.id,
            userEmail: user.email,
            linkedBy: session.user.email,
          },
        },
      })

      return NextResponse.json({
        success: true,
        message: 'User linked successfully',
        user: { id: user.id, email: user.email, name: user.name },
      })
    }

    // If sending invitation to new user
    if (sendInvite && email) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this email already exists. Please select them from the search.' },
          { status: 400 }
        )
      }

      // Generate invitation token
      const token = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      // Store invitation in client metadata or a separate table
      // For now, we'll use ClientActivity to track the invitation
      await prisma.clientActivity.create({
        data: {
          clientId: id,
          type: 'INVITATION_SENT',
          description: `Portal invitation sent to ${email}`,
          metadata: {
            invitedEmail: email,
            invitationToken: token,
            expiresAt: expiresAt.toISOString(),
            sentBy: session.user.email,
          },
        },
      })

      // Send invitation email
      const resend = getResendClient()
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://47industries.com'
      const registerUrl = `${appUrl}/register?invite=${token}&email=${encodeURIComponent(email)}&client=${id}`

      if (resend) {
        try {
          await resend.emails.send({
            from: process.env.EMAIL_FROM || 'noreply@47industries.com',
            to: email,
            subject: `You've been invited to the ${client.name} Client Portal`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Client Portal Invitation</h2>
                <p>Hello,</p>
                <p>You've been invited to access the <strong>${client.name}</strong> client portal at 47 Industries.</p>
                <p>The client portal allows you to:</p>
                <ul>
                  <li>View and pay invoices</li>
                  <li>Access and sign contracts</li>
                  <li>Manage your billing and payment methods</li>
                  <li>View project updates</li>
                </ul>
                <p style="margin: 30px 0;">
                  <a href="${registerUrl}" style="display: inline-block; padding: 14px 28px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
                    Create Your Account
                  </a>
                </p>
                <p style="color: #666; font-size: 14px;">
                  This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #666; font-size: 12px;">
                  47 Industries LLC<br>
                  <a href="https://47industries.com" style="color: #3b82f6;">47industries.com</a>
                </p>
              </div>
            `,
          })
        } catch (emailError) {
          console.error('Failed to send invitation email:', emailError)
          return NextResponse.json(
            { error: 'Failed to send invitation email. Please try again.' },
            { status: 500 }
          )
        }
      }

      return NextResponse.json({
        success: true,
        invited: true,
        message: `Invitation sent to ${email}`,
      })
    }

    return NextResponse.json(
      { error: 'Please select a user or provide an email to invite' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error linking user:', error)
    return NextResponse.json(
      { error: 'Failed to link user. Please try again.' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/clients/[id]/link-user
// Unlink a user account from a client
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const client = await prisma.client.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (!client.userId) {
      return NextResponse.json({ error: 'No user is linked to this client' }, { status: 400 })
    }

    const previousEmail = client.user?.email

    await prisma.client.update({
      where: { id },
      data: { userId: null },
    })

    await prisma.clientActivity.create({
      data: {
        clientId: id,
        type: 'PORTAL_ACCESS',
        description: `User account ${previousEmail} unlinked from portal access`,
        metadata: {
          previousEmail,
          unlinkedBy: session.user.email,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'User unlinked successfully',
    })
  } catch (error) {
    console.error('Error unlinking user:', error)
    return NextResponse.json(
      { error: 'Failed to unlink user' },
      { status: 500 }
    )
  }
}
