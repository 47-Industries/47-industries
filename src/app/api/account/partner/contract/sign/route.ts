import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToR2, isR2Configured } from '@/lib/r2'
import { sendContractSignedNotification, sendContractFullyExecutedNotification } from '@/lib/email'

// GET /api/account/partner/contract/sign - Get signature fields for partner contract
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
      include: {
        contract: {
          include: {
            signatureFields: {
              orderBy: [{ pageNumber: 'asc' }, { yPercent: 'asc' }],
            },
          },
        },
      },
    })

    if (!partner || !partner.contract) {
      return NextResponse.json({ signatureFields: [] })
    }

    return NextResponse.json({
      signatureFields: partner.contract.signatureFields,
    })
  } catch (error) {
    console.error('Error fetching partner contract signature fields:', error)
    return NextResponse.json({ error: 'Failed to fetch signature fields' }, { status: 500 })
  }
}

// POST /api/account/partner/contract/sign - Partner signs their contract
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get partner for this user
    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
      include: {
        contract: {
          include: {
            signatureFields: true,
          },
        },
      },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Not a partner' }, { status: 403 })
    }

    if (!partner.contract) {
      return NextResponse.json({ error: 'No contract found' }, { status: 404 })
    }

    if (partner.contract.status === 'SIGNED' || partner.contract.status === 'ACTIVE') {
      return NextResponse.json({ error: 'Contract is already signed' }, { status: 400 })
    }

    if (partner.contract.status !== 'SENT') {
      return NextResponse.json({ error: 'Contract must be sent before signing' }, { status: 400 })
    }

    const body = await req.json()
    const {
      signedByName,
      signedByTitle,
      signedByCompany,
      signedByEmail,
      signatureDataUrl,
      signedPdfBlob, // Base64 encoded PDF with signatures embedded
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
      // Convert base64 to buffer
      const base64Data = signatureDataUrl.replace(/^data:image\/png;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')

      // Generate unique filename
      const timestamp = new Date().toISOString().split('T')[0]
      const sanitizedName = partner.name.replace(/[^a-zA-Z0-9]/g, '-')
      const fileName = `signature-${sanitizedName}-${timestamp}-${Date.now()}.png`
      const fileKey = `contracts/signatures/${partner.partnerNumber}/${fileName}`

      signatureUrl = await uploadToR2(fileKey, buffer, 'image/png')
    }

    // Upload signed PDF if provided
    let signedPdfUrl: string | null = null
    if (isR2Configured && signedPdfBlob) {
      const pdfBuffer = Buffer.from(signedPdfBlob, 'base64')
      const timestamp = new Date().toISOString().split('T')[0]
      const pdfFileName = `signed-partner-${partner.partnerNumber}-${timestamp}.pdf`
      const pdfFileKey = `contracts/signed/partners/${partner.partnerNumber}/${pdfFileName}`

      signedPdfUrl = await uploadToR2(pdfFileKey, pdfBuffer, 'application/pdf')
    }

    // Update signature fields if provided
    if (hasSignatureFields && Array.isArray(signedFields)) {
      for (const field of signedFields) {
        if (!field.fieldId || !field.signatureDataUrl) continue

        // Check if this field exists in the database
        const existingField = await prisma.contractSignatureField.findUnique({
          where: { id: field.fieldId },
        })

        // Upload field signature to R2
        let fieldSignatureUrl: string | null = null
        if (isR2Configured) {
          const base64Data = field.signatureDataUrl.replace(/^data:image\/\w+;base64,/, '')
          const buffer = Buffer.from(base64Data, 'base64')
          const fieldFileName = `field-${field.fieldId}-${Date.now()}.png`
          const fieldFileKey = `contracts/signatures/${partner.partnerNumber}/fields/${fieldFileName}`
          fieldSignatureUrl = await uploadToR2(fieldFileKey, buffer, 'image/png')
        }

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
        }
        // Note: If field doesn't exist, we skip it - the signature is still
        // saved on the contract level via signatureUrl
      }
    }

    // Determine status - ACTIVE if admin already countersigned, otherwise SIGNED
    const newStatus = partner.contract.countersignedAt ? 'ACTIVE' : 'SIGNED'

    // Update contract with signature info
    const updatedContract = await prisma.partnerContract.update({
      where: { id: partner.contract.id },
      data: {
        status: newStatus,
        signedAt: new Date(),
        signatureUrl: signatureUrl || undefined,
        // Update fileUrl to signed PDF if provided
        fileUrl: signedPdfUrl || undefined,
        signedByName: signedByName.trim(),
        signedByTitle: signedByTitle.trim(),
        signedByCompany: signedByCompany.trim(),
        signedByEmail: signedByEmail.trim().toLowerCase(),
        signedByIp: ip,
        signedByUserId: session.user.id,
      },
    })

    // Send appropriate notification
    try {
      if (newStatus === 'ACTIVE') {
        // Both have signed - send fully executed notification to partner
        await sendContractFullyExecutedNotification({
          to: partner.email,
          partnerName: partner.name,
          contractTitle: updatedContract.title,
          countersignedByName: partner.contract.countersignedByName || '47 Industries',
        })
      }
      // Always notify admin that partner signed
      await sendContractSignedNotification({
        partnerName: partner.name,
        partnerEmail: partner.email,
        partnerId: partner.id,
        contractTitle: updatedContract.title,
        signedAt: updatedContract.signedAt!,
        signedByName: signedByName.trim(),
        signedByIp: ip,
      })
    } catch (emailError) {
      console.error('Failed to send contract signed notification:', emailError)
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
