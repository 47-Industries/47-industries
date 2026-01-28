import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'
import { sendAmendmentReadyToSign } from '@/lib/email'

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

    // Get recipient info
    let recipientEmail: string | null = null
    let recipientName: string | null = null
    let originalContractNumber: string | null = null
    let signUrl: string | null = null

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://47industries.com'

    if (amendment.clientContract?.client) {
      recipientEmail = amendment.clientContract.client.user?.email || amendment.clientContract.client.email
      recipientName = amendment.clientContract.client.name
      originalContractNumber = amendment.clientContract.contractNumber
      signUrl = `${APP_URL}/contracts/${amendment.amendmentNumber}/sign`
    } else if (amendment.partnerContract?.partner) {
      recipientEmail = amendment.partnerContract.partner.user?.email || amendment.partnerContract.partner.email
      recipientName = amendment.partnerContract.partner.name
      originalContractNumber = amendment.partnerContract.contractNumber
      signUrl = `${APP_URL}/contracts/${amendment.amendmentNumber}/sign`
    }

    // Send email notification to client/partner
    let emailSent = false
    if (recipientEmail && recipientName && originalContractNumber && signUrl) {
      const emailResult = await sendAmendmentReadyToSign({
        to: recipientEmail,
        recipientName,
        amendmentNumber: amendment.amendmentNumber,
        amendmentTitle: amendment.title || `Amendment to Contract ${originalContractNumber}`,
        originalContractNumber,
        signUrl,
      })

      if (emailResult.success) {
        emailSent = true
        console.log(`Amendment ${amendment.amendmentNumber} email sent to ${recipientName} (${recipientEmail})`)
      } else {
        console.error(`Failed to send amendment email to ${recipientName} (${recipientEmail})`)
      }
    } else {
      console.warn(`Amendment ${amendment.amendmentNumber} sent but no valid recipient email found`)
    }

    return NextResponse.json({
      success: true,
      amendment: updatedAmendment,
      sentTo: { name: recipientName, email: recipientEmail },
      emailSent,
    })
  } catch (error) {
    console.error('Error sending amendment:', error)
    return NextResponse.json({ error: 'Failed to send amendment' }, { status: 500 })
  }
}
