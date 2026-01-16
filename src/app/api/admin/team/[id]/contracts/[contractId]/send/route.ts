import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'
import { sendTeamContractReadyToSign } from '@/lib/email'

// POST /api/admin/team/[id]/contracts/[contractId]/send - Send contract for signature
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: teamMemberId, contractId } = await params

    // Get team member
    const teamMember = await prisma.teamMember.findUnique({
      where: { id: teamMemberId },
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Get contract
    const contract = await prisma.teamMemberContract.findUnique({
      where: { id: contractId },
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    if (contract.teamMemberId !== teamMemberId) {
      return NextResponse.json({ error: 'Contract does not belong to this team member' }, { status: 400 })
    }

    if (!contract.fileUrl) {
      return NextResponse.json({ error: 'Contract PDF must be uploaded before sending' }, { status: 400 })
    }

    if (contract.status === 'SIGNED' || contract.status === 'ACTIVE') {
      return NextResponse.json({ error: 'Contract is already signed' }, { status: 400 })
    }

    // Update contract status to SENT
    const updatedContract = await prisma.teamMemberContract.update({
      where: { id: contractId },
      data: {
        status: 'SENT',
      },
    })

    // Send email to team member
    try {
      await sendTeamContractReadyToSign({
        to: teamMember.email,
        name: teamMember.name,
        contractTitle: updatedContract.title,
        contractType: updatedContract.type,
      })
    } catch (emailError) {
      console.error('Failed to send team contract ready email:', emailError)
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
    console.error('Error sending team contract for signature:', error)
    return NextResponse.json(
      { error: 'Failed to send contract: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
