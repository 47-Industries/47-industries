import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'
import { sendContractReadyToSign } from '@/lib/email'

// POST /api/admin/partners/[id]/contract/send - Send contract for signature
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

    // Get partner with contract
    const partner = await prisma.partner.findUnique({
      where: { id },
      include: {
        contract: true,
      },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    if (!partner.contract) {
      return NextResponse.json({ error: 'No contract found for this partner' }, { status: 404 })
    }

    if (!partner.contract.fileUrl) {
      return NextResponse.json({ error: 'Contract PDF must be uploaded before sending' }, { status: 400 })
    }

    if (partner.contract.status === 'SIGNED' || partner.contract.status === 'ACTIVE') {
      return NextResponse.json({ error: 'Contract is already signed' }, { status: 400 })
    }

    // Update contract status to SENT
    const updatedContract = await prisma.partnerContract.update({
      where: { id: partner.contract.id },
      data: {
        status: 'SENT',
      },
    })

    // Send email to partner
    try {
      await sendContractReadyToSign({
        to: partner.email,
        name: partner.name,
        contractTitle: updatedContract.title,
      })
    } catch (emailError) {
      console.error('Failed to send contract ready email:', emailError)
      // Don't fail if email fails, contract status is already updated
    }

    return NextResponse.json({
      success: true,
      contract: {
        id: updatedContract.id,
        status: updatedContract.status,
      },
      message: 'Contract sent for signature',
    })
  } catch (error) {
    console.error('Error sending contract for signature:', error)
    return NextResponse.json(
      { error: 'Failed to send contract: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
