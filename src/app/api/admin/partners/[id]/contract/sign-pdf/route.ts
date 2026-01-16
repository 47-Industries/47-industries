import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToR2, isR2Configured } from '@/lib/r2'

// POST /api/admin/partners/[id]/contract/sign-pdf - Upload signed PDF and record signature
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: partnerId } = await params

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

    // Get partner with contract
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      include: { contract: true },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    if (!partner.contract) {
      return NextResponse.json({ error: 'No contract found for this partner' }, { status: 404 })
    }

    // Parse form data
    const formData = await req.formData()
    const signedPdf = formData.get('signedPdf') as File | null
    const signerName = formData.get('signerName') as string | null
    const signatureDataUrl = formData.get('signatureDataUrl') as string | null
    const signatureType = formData.get('signatureType') as string || 'admin' // 'admin' or 'partner'

    if (!signedPdf || !signerName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get client IP address
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown'

    // Upload signed PDF to R2
    let signedFileUrl = partner.contract.fileUrl
    if (isR2Configured) {
      const buffer = Buffer.from(await signedPdf.arrayBuffer())
      const timestamp = new Date().toISOString().split('T')[0]
      const fileName = `${partner.partnerNumber}-contract-signed-${timestamp}.pdf`
      const fileKey = `contracts/partners/signed/${partner.partnerNumber}/${fileName}`

      signedFileUrl = await uploadToR2(fileKey, buffer, 'application/pdf')
    }

    // Upload signature image to R2 if provided
    let signatureUrl: string | null = null
    if (signatureDataUrl && isR2Configured) {
      const base64Data = signatureDataUrl.replace(/^data:image\/png;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      const timestamp = Date.now()
      const sanitizedName = signerName.trim().replace(/[^a-zA-Z0-9]/g, '-')
      const fileName = `signature-${sanitizedName}-${timestamp}.png`
      const fileKey = `contracts/partners/signatures/${partner.partnerNumber}/${fileName}`

      signatureUrl = await uploadToR2(fileKey, buffer, 'image/png')
    }

    // Determine what to update based on signature type
    const updateData: Record<string, unknown> = {
      fileUrl: signedFileUrl, // Always update to the signed version
    }

    if (signatureType === 'admin') {
      // Admin countersigning
      updateData.countersignatureUrl = signatureUrl
      updateData.countersignedByName = signerName.trim()
      updateData.countersignedByEmail = user.email
      updateData.countersignedByIp = ip
      updateData.countersignedByUserId = user.id
      updateData.countersignedAt = new Date()

      // If partner already signed, mark as ACTIVE
      if (partner.contract.signedAt) {
        updateData.status = 'ACTIVE'
      }
    } else {
      // Partner signing (admin signing on behalf)
      updateData.signatureUrl = signatureUrl
      updateData.signedByName = signerName.trim()
      updateData.signedByEmail = user.email // Admin's email since they're doing it
      updateData.signedByIp = ip
      updateData.signedByUserId = user.id
      updateData.signedAt = new Date()
      updateData.status = 'SIGNED'

      // If admin already countersigned, mark as ACTIVE
      if (partner.contract.countersignedAt) {
        updateData.status = 'ACTIVE'
      }
    }

    // Update contract
    const updatedContract = await prisma.partnerContract.update({
      where: { id: partner.contract.id },
      data: updateData,
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
