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

    if (contract.countersignedAt) {
      return NextResponse.json({ error: 'Contract already countersigned' }, { status: 400 })
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
    let countersignatureUrl: string | null = null
    if (isR2Configured) {
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

    // Determine new status - ACTIVE if client already signed, keep current if admin signs first
    const newStatus = contract.signedAt ? 'ACTIVE' : contract.status

    // Update contract with countersignature info
    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        status: newStatus,
        countersignatureUrl,
        countersignedByName: signedByName.trim(),
        countersignedByEmail: user.email,
        countersignedByIp: ip,
        countersignedByUserId: user.id,
        countersignedAt: new Date(),
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
