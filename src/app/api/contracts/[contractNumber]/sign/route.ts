import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadToR2 } from '@/lib/r2'
import { sendContractSignedConfirmation, sendContractSignedAdminNotification } from '@/lib/email'

// Helper to get client IP
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return req.headers.get('x-real-ip') || 'unknown'
}

// POST /api/contracts/[contractNumber]/sign
// Sign a contract
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contractNumber: string }> }
) {
  try {
    const { contractNumber } = await params
    const { signerName, signerEmail, signatureData, annotations } = await req.json()

    // Validate required fields
    if (!signerName || !signerEmail || !signatureData) {
      return NextResponse.json(
        { error: 'Name, email, and signature are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(signerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Find the contract
    const contract = await prisma.contract.findUnique({
      where: { contractNumber },
      include: {
        client: true,
      },
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Only allow signing on SENT contracts
    if (contract.status !== 'SENT') {
      return NextResponse.json(
        { error: 'This contract has already been signed or is not available for signing' },
        { status: 403 }
      )
    }

    // Upload signature image to R2
    let signatureUrl: string | null = null
    try {
      // Convert base64 data URL to buffer
      const base64Data = signatureData.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')

      const fileKey = `signatures/${contractNumber}-${Date.now()}.png`
      signatureUrl = await uploadToR2(fileKey, buffer, 'image/png')
    } catch (uploadError) {
      console.error('Failed to upload signature:', uploadError)
      // Continue without R2 upload - store base64 directly as fallback
      signatureUrl = signatureData
    }

    // Get client IP
    const clientIp = getClientIp(req)
    const now = new Date()

    // Update contract with signature
    const updatedContract = await prisma.contract.update({
      where: { contractNumber },
      data: {
        status: 'SIGNED',
        signedAt: now,
        signedBy: signerName, // Legacy field
        signedByName: signerName,
        signedByEmail: signerEmail,
        signedByIp: clientIp,
        signatureUrl: signatureUrl,
        annotations: annotations || contract.annotations,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Log activity
    await prisma.clientActivity.create({
      data: {
        clientId: contract.clientId,
        type: 'CONTRACT_SIGNED',
        description: `Contract ${contractNumber} signed by ${signerName}`,
        metadata: {
          contractId: contract.id,
          contractNumber,
          signerName,
          signerEmail,
          signedAt: now.toISOString(),
        },
      },
    })

    // Send confirmation email to signer
    const signerEmailResult = await sendContractSignedConfirmation({
      to: signerEmail,
      signerName,
      contractNumber,
      contractTitle: contract.title || `Contract ${contractNumber}`,
      signedAt: now,
    })

    if (!signerEmailResult.success) {
      console.error('Failed to send contract signed confirmation email to signer')
    }

    // Send notification email to admin
    const adminEmailResult = await sendContractSignedAdminNotification({
      contractNumber,
      contractTitle: contract.title || `Contract ${contractNumber}`,
      signerName,
      signerEmail,
      signerIp: clientIp,
      signedAt: now,
      clientName: updatedContract.client?.name || 'Unknown Client',
      clientId: contract.clientId,
    })

    if (!adminEmailResult.success) {
      console.error('Failed to send contract signed notification email to admin')
    }

    return NextResponse.json({
      success: true,
      message: 'Contract signed successfully',
      contract: {
        id: updatedContract.id,
        contractNumber: updatedContract.contractNumber,
        status: updatedContract.status,
        signedAt: updatedContract.signedAt,
        signedByName: updatedContract.signedByName,
      },
    })
  } catch (error) {
    console.error('Error signing contract:', error)
    return NextResponse.json(
      { error: 'Failed to sign contract' },
      { status: 500 }
    )
  }
}
