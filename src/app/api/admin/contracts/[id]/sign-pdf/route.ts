import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToR2, isR2Configured } from '@/lib/r2'

// Interface for signed elements from the frontend
interface SignedElement {
  id?: string
  type: string
  pageNumber: number
  x: number
  y: number
  width: number
  height?: number
  dataUrl?: string
  text?: string
  signerName: string
  signerTitle: string
  isPlaceholder?: boolean
  assignedTo?: string
  assignedUserId?: string
  label?: string
}

// POST /api/admin/contracts/[id]/sign-pdf - Store signatures in DB (no PDF embedding)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params

    // Get authenticated admin user
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, role: true },
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get contract
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { client: true },
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Parse form data OR JSON
    let signerName: string | null = null
    let signerTitle: string | null = null
    let signatureDataUrl: string | null = null
    let signatureType = 'admin'
    let adminSignedElements: SignedElement[] = []
    let placeholderElements: SignedElement[] = []

    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      // Legacy FormData handling
      const formData = await req.formData()
      signerName = formData.get('signerName') as string | null
      signerTitle = formData.get('signerTitle') as string | null
      signatureDataUrl = formData.get('signatureDataUrl') as string | null
      signatureType = formData.get('signatureType') as string || 'admin'

      // Parse JSON fields if present
      const adminElementsStr = formData.get('adminSignedElements') as string | null
      const placeholderStr = formData.get('placeholderElements') as string | null
      if (adminElementsStr) {
        try { adminSignedElements = JSON.parse(adminElementsStr) } catch { /* ignore */ }
      }
      if (placeholderStr) {
        try { placeholderElements = JSON.parse(placeholderStr) } catch { /* ignore */ }
      }
    } else {
      // JSON body
      const body = await req.json()
      signerName = body.signerName
      signerTitle = body.signerTitle
      signatureDataUrl = body.signatureDataUrl
      signatureType = body.signatureType || 'admin'
      adminSignedElements = body.adminSignedElements || []
      placeholderElements = body.placeholderElements || []
    }

    if (!signerName || !signerTitle) {
      return NextResponse.json({ error: 'Missing required fields (name and title required)' }, { status: 400 })
    }

    // Get client IP address
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown'

    // Upload legacy signature image to R2 if provided
    let signatureUrl: string | null = null
    if (signatureDataUrl && isR2Configured && signatureDataUrl.startsWith('data:image/')) {
      const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      const timestamp = Date.now()
      const sanitizedName = signerName.trim().replace(/[^a-zA-Z0-9]/g, '-')
      const fileName = `signature-${sanitizedName}-${timestamp}.png`
      const fileKey = `contracts/signatures/${contract.contractNumber}/${fileName}`
      signatureUrl = await uploadToR2(fileKey, buffer, 'image/png')
    }

    // Store admin's signatures in ContractSignatureField (NEW flow - no PDF embedding)
    if (adminSignedElements && adminSignedElements.length > 0) {
      // Get existing unsigned placeholder fields for this contract
      const existingPlaceholders = await prisma.contractSignatureField.findMany({
        where: {
          contractId,
          isSigned: false,
        },
      })

      // Create or update signature field records
      for (const element of adminSignedElements) {
        if (!element.dataUrl && !element.text) continue

        // Upload signature image to R2
        let fieldSignatureUrl: string | null = null
        if (isR2Configured && element.dataUrl && element.dataUrl.startsWith('data:image/')) {
          const base64Data = element.dataUrl.replace(/^data:image\/\w+;base64,/, '')
          const buffer = Buffer.from(base64Data, 'base64')
          const fieldFileName = `admin-sig-${element.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`
          const fieldFileKey = `contracts/signatures/${contract.contractNumber}/admin/${fieldFileName}`
          fieldSignatureUrl = await uploadToR2(fieldFileKey, buffer, 'image/png')
        }

        // Check if there's an existing placeholder this signature should update
        // (matches by fieldId if provided, or by assignedTo + type)
        const existingField = existingPlaceholders.find(p =>
          (element.id && p.id === element.id) || // Match by fieldId
          (element.assignedTo && p.assignedTo === element.assignedTo && p.type === element.type?.toUpperCase())
        )

        if (existingField) {
          // Update existing placeholder to mark it as signed
          await prisma.contractSignatureField.update({
            where: { id: existingField.id },
            data: {
              isSigned: true,
              signatureUrl: fieldSignatureUrl || element.dataUrl,
              signedValue: element.text || null,
              signedByName: signerName.trim(),
              signedByEmail: user.email,
              signedByIp: ip,
              signedByUserId: user.id,
              signedAt: new Date(),
              // Optionally update position if admin moved it
              xPercent: element.x || existingField.xPercent,
              yPercent: element.y || existingField.yPercent,
              widthPercent: element.width || existingField.widthPercent,
            },
          })
        } else {
          // Create new signature field record (no existing placeholder)
          await prisma.contractSignatureField.create({
            data: {
              contractId,
              type: element.type?.toUpperCase() || 'SIGNATURE',
              pageNumber: element.pageNumber || 1,
              xPercent: element.x || 50,
              yPercent: element.y || 50,
              widthPercent: element.width || 20,
              heightPercent: element.height || 6,
              assignedTo: element.assignedTo || 'ADMIN',
              assignedUserId: element.assignedUserId || user.id,
              label: element.label || null,
              isSigned: true,
              signatureUrl: fieldSignatureUrl || element.dataUrl,
              signedValue: element.text || null,
              signedByName: signerName.trim(),
              signedByEmail: user.email,
              signedByIp: ip,
              signedByUserId: user.id,
              signedAt: new Date(),
            },
          })
        }
      }
    }

    // Save placeholder fields for others (only if new placeholders are being added)
    if (placeholderElements && placeholderElements.length > 0) {
      // Only delete unsigned fields that are being replaced by new placeholders
      // Get IDs of fields we're creating (to avoid deleting them)
      const newFieldIds = placeholderElements.map(f => f.id).filter(Boolean)

      // Delete existing unsigned placeholder fields, but preserve fields for other signers
      // that weren't included in the save (i.e., Admin 2's field when Admin 1 is signing)
      await prisma.contractSignatureField.deleteMany({
        where: {
          contractId,
          isSigned: false,
          // Only delete if we're explicitly replacing with new placeholders
          // If the field ID is in the newFieldIds, it will be recreated
          id: { in: newFieldIds.length > 0 ? newFieldIds : ['none'] }, // Only delete explicitly replaced ones
        },
      })

      // Create new placeholder fields
      for (const field of placeholderElements) {
        await prisma.contractSignatureField.create({
          data: {
            contractId,
            type: field.type?.toUpperCase() || 'SIGNATURE',
            pageNumber: field.pageNumber || 1,
            xPercent: field.x || 50,
            yPercent: field.y || 50,
            widthPercent: field.width || 20,
            heightPercent: field.height || 6,
            assignedTo: field.assignedTo || 'CLIENT',
            assignedUserId: field.assignedUserId || null,
            label: field.label || null,
            isSigned: false,
          },
        })
      }
    }
    // Note: When no new placeholders are being added, existing unsigned fields are preserved
    // This allows Admin 1 to sign without deleting Admin 2's placeholder

    // Preserve original file URL
    const originalFileUrl = contract.originalFileUrl || contract.fileUrl

    // Determine what to update based on signature type
    // NOTE: We no longer update fileUrl - signatures are composited on demand
    const updateData: Record<string, unknown> = {
      originalFileUrl: originalFileUrl,
    }

    if (signatureType === 'admin') {
      // Admin countersigning
      updateData.countersignatureUrl = signatureUrl
      updateData.countersignedByName = signerName.trim()
      updateData.countersignedByTitle = signerTitle.trim()
      updateData.countersignedByEmail = user.email
      updateData.countersignedByIp = ip
      updateData.countersignedByUserId = user.id
      updateData.countersignedAt = new Date()

      // If client already signed, mark as ACTIVE
      if (contract.signedAt) {
        updateData.status = 'ACTIVE'
      }
    } else {
      // Client signing (admin signing on behalf)
      updateData.signatureUrl = signatureUrl
      updateData.signedByName = signerName.trim()
      updateData.signedByTitle = signerTitle.trim()
      updateData.signedByEmail = user.email
      updateData.signedByIp = ip
      updateData.signedByUserId = user.id
      updateData.signedAt = new Date()
      updateData.status = 'SIGNED'

      // If admin already countersigned, mark as ACTIVE
      if (contract.countersignedAt) {
        updateData.status = 'ACTIVE'
      }
    }

    // Update contract
    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: updateData,
    })

    // Log activity
    await prisma.clientActivity.create({
      data: {
        clientId: contract.clientId,
        type: signatureType === 'admin' ? 'CONTRACT_COUNTERSIGNED' : 'CONTRACT_SIGNED',
        description: `Contract "${contract.title}" signed by ${signerName.trim()} (via admin)`,
        performedBy: user.id,
      },
    })

    return NextResponse.json({
      success: true,
      contract: {
        id: updatedContract.id,
        status: updatedContract.status,
        fileUrl: updatedContract.fileUrl,
        signedAt: updatedContract.signedAt,
        signedByName: updatedContract.signedByName,
        countersignedAt: updatedContract.countersignedAt,
        countersignedByName: updatedContract.countersignedByName,
      },
      message: signatureType === 'admin'
        ? (updatedContract.status === 'ACTIVE' ? 'Contract fully executed' : 'Contract countersigned')
        : 'Contract signed',
    })
  } catch (error) {
    console.error('Error saving signed PDF:', error)
    return NextResponse.json(
      { error: 'Failed to save signed PDF: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
