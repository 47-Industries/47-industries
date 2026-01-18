import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToR2, isR2Configured } from '@/lib/r2'
import { sendClientContractSignedNotification, sendContractFullyExecutedToClient } from '@/lib/email'

// GET /api/account/client/contracts/[id]/sign - Get signature fields for this contract
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { client: true },
    })

    if (!user?.client) {
      return NextResponse.json({ error: 'No client account linked' }, { status: 403 })
    }

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        signatureFields: {
          orderBy: [{ pageNumber: 'asc' }, { yPercent: 'asc' }],
        },
      },
    })

    if (!contract || contract.clientId !== user.client.id) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    return NextResponse.json({
      signatureFields: contract.signatureFields,
    })
  } catch (error) {
    console.error('Error fetching signature fields:', error)
    return NextResponse.json({ error: 'Failed to fetch signature fields' }, { status: 500 })
  }
}

// POST /api/account/client/contracts/[id]/sign - Client signs their contract
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

    // Get user and their linked client
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        client: true,
      },
    })

    if (!user?.client) {
      return NextResponse.json({ error: 'No client account linked' }, { status: 403 })
    }

    // Get the contract with signature fields
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        client: true,
        signatureFields: true,
      },
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Verify contract belongs to this client
    if (contract.clientId !== user.client.id) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    if (contract.status === 'SIGNED' || contract.status === 'ACTIVE') {
      return NextResponse.json({ error: 'Contract is already signed' }, { status: 400 })
    }

    if (contract.status !== 'SENT') {
      return NextResponse.json({ error: 'Contract must be sent before signing' }, { status: 400 })
    }

    const body = await req.json()
    const {
      signedByName,
      signedByTitle,
      signedByCompany,
      signedByEmail,
      signatureDataUrl,
      signedFields, // Array of { fieldId, signatureDataUrl, value? }
    } = body

    if (!signedByName || signedByName.trim().length < 2) {
      return NextResponse.json({ error: 'Legal name is required' }, { status: 400 })
    }

    if (!signedByTitle || signedByTitle.trim().length < 2) {
      return NextResponse.json({ error: 'Title/Position is required' }, { status: 400 })
    }

    if (!signedByCompany || signedByCompany.trim().length < 2) {
      return NextResponse.json({ error: 'Company/Organization is required' }, { status: 400 })
    }

    if (!signedByEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signedByEmail)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    // Signature is only required if no signature fields are being used
    const hasSignatureFields = signedFields && signedFields.length > 0
    if (!hasSignatureFields && (!signatureDataUrl || !signatureDataUrl.startsWith('data:image/png;base64,'))) {
      return NextResponse.json({ error: 'Valid signature is required' }, { status: 400 })
    }

    // Get client IP address
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown'

    // Upload signature image to R2 (legacy flow)
    let signatureUrl: string | null = null
    if (isR2Configured && signatureDataUrl && signatureDataUrl.startsWith('data:image/png;base64,')) {
      const base64Data = signatureDataUrl.replace(/^data:image\/png;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')

      const timestamp = new Date().toISOString().split('T')[0]
      const sanitizedName = user.client.name.replace(/[^a-zA-Z0-9]/g, '-')
      const fileName = `signature-${sanitizedName}-${timestamp}-${Date.now()}.png`
      const fileKey = `contracts/signatures/${user.client.clientNumber}/${fileName}`

      signatureUrl = await uploadToR2(fileKey, buffer, 'image/png')
    }

    // NOTE: We no longer upload/embed signed PDFs
    // Signatures are stored in ContractSignatureField and composited on-demand

    // Update or create signature fields
    if (hasSignatureFields && Array.isArray(signedFields)) {
      for (const field of signedFields) {
        if (!field.signatureDataUrl) continue

        // Upload field signature to R2
        let fieldSignatureUrl: string | null = null
        if (isR2Configured) {
          const base64Data = field.signatureDataUrl.replace(/^data:image\/\w+;base64,/, '')
          const buffer = Buffer.from(base64Data, 'base64')
          const fieldFileName = `field-${field.fieldId}-${Date.now()}.png`
          const fieldFileKey = `contracts/signatures/${user.client.clientNumber}/fields/${fieldFileName}`
          fieldSignatureUrl = await uploadToR2(fieldFileKey, buffer, 'image/png')
        }

        // Check if this field exists in the database
        const existingField = field.fieldId
          ? await prisma.contractSignatureField.findUnique({ where: { id: field.fieldId } })
          : null

        if (existingField) {
          // Update existing field
          await prisma.contractSignatureField.update({
            where: { id: field.fieldId },
            data: {
              isSigned: true,
              signatureUrl: fieldSignatureUrl || field.signatureDataUrl,
              signedValue: field.value || null,
              signedByName: signedByName.trim(),
              signedByEmail: signedByEmail.trim().toLowerCase(),
              signedByIp: ip,
              signedByUserId: session.user.id,
              signedAt: new Date(),
            },
          })
        } else {
          // Create new signature field - client placed their own signature
          await prisma.contractSignatureField.create({
            data: {
              contractId: contractId,
              type: field.type || 'signature',
              pageNumber: field.pageNumber || 1,
              xPercent: field.x || 0,
              yPercent: field.y || 0,
              widthPercent: field.width || 20,
              heightPercent: field.height || 5,
              assignedTo: 'client',
              isSigned: true,
              signatureUrl: fieldSignatureUrl || field.signatureDataUrl,
              signedValue: field.value || null,
              signedByName: signedByName.trim(),
              signedByEmail: signedByEmail.trim().toLowerCase(),
              signedByIp: ip,
              signedByUserId: session.user.id,
              signedAt: new Date(),
            },
          })
        }
      }
    }

    // Determine status - ACTIVE if admin already countersigned, otherwise SIGNED
    const newStatus = contract.countersignedAt ? 'ACTIVE' : 'SIGNED'

    // Preserve original file URL - we don't embed signatures anymore
    // Signatures are stored in ContractSignatureField and composited on-demand
    const originalFileUrl = contract.originalFileUrl || contract.fileUrl

    // Update contract with signature info
    // NOTE: fileUrl is NOT updated - signatures are composited on demand
    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        status: newStatus,
        signedAt: new Date(),
        signatureUrl: signatureUrl || undefined,
        originalFileUrl: originalFileUrl, // Preserve original PDF
        signedByName: signedByName.trim(),
        signedByTitle: signedByTitle.trim(),
        signedByCompany: signedByCompany.trim(),
        signedByEmail: signedByEmail.trim().toLowerCase(),
        signedByIp: ip,
        signedByUserId: session.user.id,
      },
    })

    // Log activity
    await prisma.clientActivity.create({
      data: {
        clientId: user.client.id,
        type: 'CONTRACT_SIGNED',
        description: `Contract "${contract.title}" signed by ${signedByName.trim()}`,
        performedBy: session.user.id,
      },
    })

    // Send notifications
    try {
      if (newStatus === 'ACTIVE') {
        // Both have signed - send fully executed notification to client
        await sendContractFullyExecutedToClient({
          to: user.client.email,
          clientName: user.client.name,
          contractTitle: updatedContract.title,
          countersignedByName: contract.countersignedByName || '47 Industries',
        })
      }
      // Notify admin that client signed
      await sendClientContractSignedNotification({
        clientName: user.client.name,
        clientEmail: user.client.email,
        clientId: user.client.id,
        contractTitle: updatedContract.title,
        signedAt: updatedContract.signedAt!,
        signedByName: signedByName.trim(),
        signedByIp: ip,
      })
    } catch (emailError) {
      console.error('Failed to send contract signed notification:', emailError)
    }

    return NextResponse.json({
      success: true,
      contract: {
        id: updatedContract.id,
        status: updatedContract.status,
        signedAt: updatedContract.signedAt,
        signedByName: updatedContract.signedByName,
      },
      message: newStatus === 'ACTIVE' ? 'Contract fully executed' : 'Contract signed successfully',
    })
  } catch (error) {
    console.error('Error signing contract:', error)
    return NextResponse.json(
      { error: 'Failed to sign contract: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
