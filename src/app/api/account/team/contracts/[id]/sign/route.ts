import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToR2, isR2Configured } from '@/lib/r2'
import { sendTeamContractSignedNotification } from '@/lib/email'

// POST /api/account/team/contracts/[id]/sign - Team member signs their contract
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params

    // Get authenticated user
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get team member for this user
    const teamMember = await prisma.teamMember.findUnique({
      where: { userId: session.user.id },
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
    }

    // Get the contract and verify it belongs to this team member
    const contract = await prisma.teamMemberContract.findUnique({
      where: { id: contractId },
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    if (contract.teamMemberId !== teamMember.id) {
      return NextResponse.json({ error: 'Not your contract' }, { status: 403 })
    }

    if (contract.status === 'SIGNED' || contract.status === 'ACTIVE') {
      return NextResponse.json({ error: 'Contract is already signed' }, { status: 400 })
    }

    if (contract.status !== 'SENT') {
      return NextResponse.json({ error: 'Contract must be sent before signing' }, { status: 400 })
    }

    const body = await req.json()
    const { signedByName, signatureDataUrl } = body

    if (!signedByName || signedByName.trim().length < 2) {
      return NextResponse.json({ error: 'Legal name is required' }, { status: 400 })
    }

    if (!signatureDataUrl || !signatureDataUrl.startsWith('data:image/png;base64,')) {
      return NextResponse.json({ error: 'Valid signature is required' }, { status: 400 })
    }

    // Get client IP address
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown'

    // Upload signature image to R2
    let signatureUrl: string | null = null
    if (isR2Configured) {
      // Convert base64 to buffer
      const base64Data = signatureDataUrl.replace(/^data:image\/png;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')

      // Generate unique filename
      const timestamp = new Date().toISOString().split('T')[0]
      const sanitizedName = teamMember.name.replace(/[^a-zA-Z0-9]/g, '-')
      const fileName = `signature-${sanitizedName}-${timestamp}-${Date.now()}.png`
      const fileKey = `team/contracts/signatures/${teamMember.employeeNumber}/${fileName}`

      signatureUrl = await uploadToR2(fileKey, buffer, 'image/png')
    }

    // Update contract with signature info
    const updatedContract = await prisma.teamMemberContract.update({
      where: { id: contractId },
      data: {
        status: 'SIGNED',
        signedAt: new Date(),
        signatureUrl,
        signedByName: signedByName.trim(),
        signedByEmail: teamMember.email,
        signedByIp: ip,
        signedByUserId: session.user.id,
      },
    })

    // Send notification to admin
    try {
      await sendTeamContractSignedNotification({
        teamMemberName: teamMember.name,
        teamMemberEmail: teamMember.email,
        teamMemberId: teamMember.id,
        contractTitle: updatedContract.title,
        contractType: updatedContract.type,
        signedAt: updatedContract.signedAt!,
        signedByName: signedByName.trim(),
        signedByIp: ip,
      })
    } catch (emailError) {
      console.error('Failed to send team contract signed notification:', emailError)
      // Don't fail the signing if email fails
    }

    return NextResponse.json({
      success: true,
      contract: {
        id: updatedContract.id,
        status: updatedContract.status,
        signedAt: updatedContract.signedAt,
        signedByName: updatedContract.signedByName,
      },
      message: 'Contract signed successfully',
    })
  } catch (error) {
    console.error('Error signing team contract:', error)
    return NextResponse.json(
      { error: 'Failed to sign contract: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
