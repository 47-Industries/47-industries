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

// POST /api/admin/contracts/[id]/countersign - Admin countersigns a client contract
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

    // Get contract with client
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { client: true },
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Contract must be at least SENT status
    if (contract.status === 'DRAFT') {
      return NextResponse.json({ error: 'Contract must be sent before signing' }, { status: 400 })
    }

    // Allow re-countersigning (editing signatures) - removed the check that prevented this

    const body = await req.json()
    const {
      signedByName,
      signedByTitle,
      signatureDataUrl,
      signedPdfBlob, // Legacy: Base64 encoded PDF with signatures embedded (ignored in new flow)
      signatureFields, // Placeholders for client/partner to sign
      adminSignedElements, // NEW: Admin's actual signatures to store in DB
    } = body

    if (!signedByName || signedByName.trim().length < 2) {
      return NextResponse.json({ error: 'Legal name is required' }, { status: 400 })
    }

    // Get client IP address
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown'

    // Upload legacy signature image to R2 (if provided)
    let countersignatureUrl: string | null = null
    if (isR2Configured && signatureDataUrl && signatureDataUrl.startsWith('data:image/png;base64,')) {
      const base64Data = signatureDataUrl.replace(/^data:image\/png;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')

      const timestamp = new Date().toISOString().split('T')[0]
      const sanitizedName = signedByName.trim().replace(/[^a-zA-Z0-9]/g, '-')
      const fileName = `countersignature-${sanitizedName}-${timestamp}-${Date.now()}.png`
      const fileKey = `contracts/countersignatures/${contract.contractNumber}/${fileName}`

      countersignatureUrl = await uploadToR2(fileKey, buffer, 'image/png')
    }

    // NEW: Store admin's signatures in ContractSignatureField (not embedded in PDF)
    if (adminSignedElements && Array.isArray(adminSignedElements) && adminSignedElements.length > 0) {
      // Delete existing admin signature fields that were signed by this user
      await prisma.contractSignatureField.deleteMany({
        where: {
          contractId,
          signedByUserId: user.id,
          isSigned: true,
        },
      })

      // Create new signature field records for each admin signature
      for (const element of adminSignedElements as SignedElement[]) {
        if (!element.dataUrl && !element.text) continue

        // Upload signature image to R2 if it's a data URL
        let signatureUrl: string | null = null
        if (isR2Configured && element.dataUrl && element.dataUrl.startsWith('data:image/')) {
          const base64Data = element.dataUrl.replace(/^data:image\/\w+;base64,/, '')
          const buffer = Buffer.from(base64Data, 'base64')
          const fieldFileName = `admin-sig-${element.type}-${Date.now()}.png`
          const fieldFileKey = `contracts/signatures/${contract.contractNumber}/admin/${fieldFileName}`
          signatureUrl = await uploadToR2(fieldFileKey, buffer, 'image/png')
        }

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
            signatureUrl: signatureUrl || element.dataUrl,
            signedValue: element.text || null,
            signedByName: signedByName.trim(),
            signedByEmail: user.email,
            signedByIp: ip,
            signedByUserId: user.id,
            signedAt: new Date(),
          },
        })
      }
    }

    // Save placeholder fields for client/partner (these are unsigned)
    if (signatureFields && Array.isArray(signatureFields) && signatureFields.length > 0) {
      // Delete existing unsigned placeholder fields
      await prisma.contractSignatureField.deleteMany({
        where: {
          contractId,
          isSigned: false,
        },
      })

      // Create new placeholder signature fields
      for (const field of signatureFields) {
        await prisma.contractSignatureField.create({
          data: {
            contractId,
            type: field.type?.toUpperCase() || 'SIGNATURE',
            pageNumber: field.pageNumber || 1,
            xPercent: field.x || field.xPercent || 50,
            yPercent: field.y || field.yPercent || 50,
            widthPercent: field.width || field.widthPercent || 20,
            heightPercent: field.height || field.heightPercent || 6,
            assignedTo: field.assignedTo || 'CLIENT',
            assignedUserId: field.assignedUserId || null,
            label: field.label || null,
            isSigned: false,
          },
        })
      }
    }

    // Determine new status - ACTIVE if client already signed, keep current if admin signs first
    const newStatus = contract.signedAt ? 'ACTIVE' : contract.status

    // Preserve original file URL - always keep the clean PDF
    // The fileUrl should always point to the original unsigned PDF
    const originalFileUrl = contract.originalFileUrl || contract.fileUrl

    // Update contract with countersignature info
    // NOTE: We do NOT update fileUrl anymore - signatures are composited on demand
    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        status: newStatus,
        countersignatureUrl: countersignatureUrl || undefined,
        countersignedByName: signedByName.trim(),
        countersignedByTitle: signedByTitle?.trim() || null,
        countersignedByEmail: user.email,
        countersignedByIp: ip,
        countersignedByUserId: user.id,
        countersignedAt: new Date(),
        // Preserve original URL - don't update fileUrl
        originalFileUrl: originalFileUrl,
      },
    })

    // Log activity
    await prisma.clientActivity.create({
      data: {
        clientId: contract.clientId,
        type: 'CONTRACT_COUNTERSIGNED',
        description: `Contract "${contract.title}" countersigned by ${signedByName.trim()}`,
        performedBy: user.id,
      },
    })

    return NextResponse.json({
      success: true,
      contract: {
        id: updatedContract.id,
        status: updatedContract.status,
        countersignedAt: updatedContract.countersignedAt,
        countersignedByName: updatedContract.countersignedByName,
      },
      message: newStatus === 'ACTIVE' ? 'Contract fully executed' : 'Contract countersigned',
    })
  } catch (error) {
    console.error('Error countersigning contract:', error)
    return NextResponse.json(
      { error: 'Failed to countersign contract: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
