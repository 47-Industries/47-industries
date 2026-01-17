import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth, getAdminAuthInfo } from '@/lib/auth-helper'
import { sendContractReadyToSign } from '@/lib/email'

// POST /api/admin/contracts/[id]/send - Send contract to client for signature
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
    const auth = await getAdminAuthInfo(req)

    // Get contract with client
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        client: true,
      },
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    if (!contract.client) {
      return NextResponse.json({ error: 'No client associated with this contract' }, { status: 400 })
    }

    if (!contract.fileUrl) {
      return NextResponse.json({ error: 'Contract PDF must be uploaded before sending' }, { status: 400 })
    }

    if (contract.status === 'SIGNED' || contract.status === 'ACTIVE') {
      return NextResponse.json({ error: 'Contract is already signed' }, { status: 400 })
    }

    // Update contract status to SENT
    const updatedContract = await prisma.contract.update({
      where: { id },
      data: {
        status: 'SENT',
      },
    })

    // Log activity
    await prisma.clientActivity.create({
      data: {
        clientId: contract.clientId,
        type: 'CONTRACT_SENT',
        description: `Contract "${contract.title}" sent for signature`,
        performedBy: auth.userId,
      },
    })

    // Send email to client
    try {
      await sendContractReadyToSign({
        to: contract.client.email,
        name: contract.client.name,
        contractTitle: contract.title,
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
