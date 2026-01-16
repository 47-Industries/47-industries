import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// POST /api/admin/amendments/[id]/send - Send amendment for signature
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if amendment exists
    const amendment = await prisma.contractAmendment.findUnique({
      where: { id },
      include: {
        clientContract: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                user: {
                  select: { email: true },
                },
              },
            },
          },
        },
        partnerContract: {
          include: {
            partner: {
              select: {
                id: true,
                name: true,
                email: true,
                user: {
                  select: { email: true },
                },
              },
            },
          },
        },
      },
    })

    if (!amendment) {
      return NextResponse.json({ error: 'Amendment not found' }, { status: 404 })
    }

    // Only allow sending if in DRAFT status
    if (amendment.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Amendment has already been sent' },
        { status: 400 }
      )
    }

    // Must have a PDF uploaded
    if (!amendment.fileUrl) {
      return NextResponse.json(
        { error: 'Please upload a PDF before sending for signature' },
        { status: 400 }
      )
    }

    // Update status to SENT
    const updatedAmendment = await prisma.contractAmendment.update({
      where: { id },
      data: {
        status: 'SENT',
      },
    })

    // TODO: Send email notification to client/partner
    // Get recipient info
    let recipientEmail: string | null = null
    let recipientName: string | null = null

    if (amendment.clientContract?.client) {
      recipientEmail = amendment.clientContract.client.user?.email || amendment.clientContract.client.email
      recipientName = amendment.clientContract.client.name
    } else if (amendment.partnerContract?.partner) {
      recipientEmail = amendment.partnerContract.partner.user?.email || amendment.partnerContract.partner.email
      recipientName = amendment.partnerContract.partner.name
    }

    // Email sending would go here - for now just log
    console.log(`Amendment ${amendment.amendmentNumber} sent to ${recipientName} (${recipientEmail})`)

    return NextResponse.json({
      success: true,
      amendment: updatedAmendment,
      sentTo: { name: recipientName, email: recipientEmail },
    })
  } catch (error) {
    console.error('Error sending amendment:', error)
    return NextResponse.json({ error: 'Failed to send amendment' }, { status: 500 })
  }
}
