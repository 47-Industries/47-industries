import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToR2, isR2Configured } from '@/lib/r2'

// POST /api/account/client/amendments/[id]/sign - Client signs an amendment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get client for this user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        client: {
          select: { id: true, name: true, email: true, clientNumber: true },
        },
      },
    })

    if (!user?.client) {
      return NextResponse.json({ error: 'Not a client' }, { status: 403 })
    }

    // Get the amendment and verify it belongs to this client
    const amendment = await prisma.contractAmendment.findUnique({
      where: { id },
      include: {
        clientContract: {
          select: {
            id: true,
            clientId: true,
            title: true,
          },
        },
      },
    })

    if (!amendment) {
      return NextResponse.json({ error: 'Amendment not found' }, { status: 404 })
    }

    if (!amendment.clientContractId || amendment.clientContract?.clientId !== user.client.id) {
      return NextResponse.json({ error: 'Amendment does not belong to you' }, { status: 403 })
    }

    if (amendment.status === 'SIGNED' || amendment.status === 'ACTIVE') {
      return NextResponse.json({ error: 'Amendment is already signed' }, { status: 400 })
    }

    if (amendment.status !== 'SENT') {
      return NextResponse.json({ error: 'Amendment must be sent before signing' }, { status: 400 })
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
      const base64Data = signatureDataUrl.replace(/^data:image\/png;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')

      const timestamp = new Date().toISOString().split('T')[0]
      const sanitizedName = user.client.name.replace(/[^a-zA-Z0-9]/g, '-')
      const fileName = `signature-${sanitizedName}-${timestamp}-${Date.now()}.png`
      const fileKey = `contracts/signatures/amendments/${user.client.clientNumber}/${fileName}`

      signatureUrl = await uploadToR2(fileKey, buffer, 'image/png')
    }

    // For client amendments, signing makes them ACTIVE (no countersignature needed)
    const updatedAmendment = await prisma.contractAmendment.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        signedAt: new Date(),
        signatureUrl,
        signedByName: signedByName.trim(),
        signedByEmail: user.client.email,
        signedByIp: ip,
        signedByUserId: session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      amendment: {
        id: updatedAmendment.id,
        status: updatedAmendment.status,
        signedAt: updatedAmendment.signedAt,
        signedByName: updatedAmendment.signedByName,
      },
      message: 'Amendment signed successfully',
    })
  } catch (error) {
    console.error('Error signing amendment:', error)
    return NextResponse.json(
      { error: 'Failed to sign amendment: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
