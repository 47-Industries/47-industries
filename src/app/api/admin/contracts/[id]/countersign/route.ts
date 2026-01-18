import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToR2, isR2Configured } from '@/lib/r2'

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
      signedPdfBlob, // Base64 encoded PDF with signatures embedded
      signatureFields, // Array of { type, pageNumber, xPercent, yPercent, widthPercent, heightPercent, assignedTo, label }
    } = body

    if (!signedByName || signedByName.trim().length < 2) {
      return NextResponse.json({ error: 'Legal name is required' }, { status: 400 })
    }

    // Signature is only required if no signed PDF is provided
    const hasSignedPdf = !!signedPdfBlob
    if (!hasSignedPdf && (!signatureDataUrl || !signatureDataUrl.startsWith('data:image/png;base64,'))) {
      return NextResponse.json({ error: 'Valid signature is required' }, { status: 400 })
    }

    // Get client IP address
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown'

    // Upload signature image to R2 (if provided)
    let countersignatureUrl: string | null = null
    if (isR2Configured && signatureDataUrl && signatureDataUrl.startsWith('data:image/png;base64,')) {
      // Convert base64 to buffer
      const base64Data = signatureDataUrl.replace(/^data:image\/png;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')

      // Generate unique filename
      const timestamp = new Date().toISOString().split('T')[0]
      const sanitizedName = signedByName.trim().replace(/[^a-zA-Z0-9]/g, '-')
      const fileName = `countersignature-${sanitizedName}-${timestamp}-${Date.now()}.png`
      const fileKey = `contracts/countersignatures/${contract.contractNumber}/${fileName}`

      countersignatureUrl = await uploadToR2(fileKey, buffer, 'image/png')
    }

    // Upload signed PDF if provided
    let signedPdfUrl: string | null = null
    if (isR2Configured && signedPdfBlob) {
      const pdfBuffer = Buffer.from(signedPdfBlob, 'base64')
      const timestamp = new Date().toISOString().split('T')[0]
      const pdfFileName = `signed-${contract.contractNumber}-${timestamp}.pdf`
      const pdfFileKey = `contracts/signed/${contract.contractNumber}/${pdfFileName}`

      signedPdfUrl = await uploadToR2(pdfFileKey, pdfBuffer, 'application/pdf')
    }

    // Save signature fields if provided (these are placeholders for client/partner)
    if (signatureFields && Array.isArray(signatureFields) && signatureFields.length > 0) {
      // Delete existing unsigned fields and create new ones
      await prisma.contractSignatureField.deleteMany({
        where: {
          contractId,
          isSigned: false,
        },
      })

      // Create new signature fields
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
            label: field.label || null,
            isSigned: false,
          },
        })
      }
    }

    // Determine new status - ACTIVE if client already signed, keep current if admin signs first
    const newStatus = contract.signedAt ? 'ACTIVE' : contract.status

    // Update contract with countersignature info
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
        // Update fileUrl to signed PDF if provided
        fileUrl: signedPdfUrl || undefined,
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
