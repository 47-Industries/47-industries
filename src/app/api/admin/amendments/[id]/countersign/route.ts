import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth, getAdminAuthInfo } from '@/lib/auth-helper'
import { uploadToR2, isR2Configured } from '@/lib/r2'

// POST /api/admin/amendments/[id]/countersign - Admin countersign amendment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const auth = await getAdminAuthInfo(req)

    // Check if amendment exists
    const amendment = await prisma.contractAmendment.findUnique({
      where: { id },
    })

    if (!amendment) {
      return NextResponse.json({ error: 'Amendment not found' }, { status: 404 })
    }

    // For partner amendments, must be SIGNED before countersigning
    // For client amendments, countersigning is not typically needed, but we allow it
    if (amendment.partnerContractId && amendment.status !== 'SIGNED') {
      return NextResponse.json(
        { error: 'Partner must sign before admin can countersign' },
        { status: 400 }
      )
    }

    // Validate countersignature data
    if (!body.signatureData || !body.legalName) {
      return NextResponse.json(
        { error: 'Signature and legal name are required' },
        { status: 400 }
      )
    }

    // Upload signature image to R2 if configured
    let countersignatureUrl: string | null = null
    if (isR2Configured && body.signatureData) {
      const base64Data = body.signatureData.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      const key = `signatures/amendments/${amendment.amendmentNumber}-countersign-${Date.now()}.png`
      countersignatureUrl = await uploadToR2(key, buffer, 'image/png')
    }

    // Get IP address
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') ||
               'unknown'

    // Update amendment with countersignature
    const updatedAmendment = await prisma.contractAmendment.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        countersignedAt: new Date(),
        countersignatureUrl,
        countersignedByName: body.legalName,
        countersignedByEmail: auth.userEmail,
        countersignedByIp: ip,
        countersignedByUserId: auth.userId,
      },
      include: {
        clientContract: {
          include: {
            client: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        partnerContract: {
          include: {
            partner: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      amendment: updatedAmendment,
    })
  } catch (error) {
    console.error('Error countersigning amendment:', error)
    return NextResponse.json({ error: 'Failed to countersign amendment' }, { status: 500 })
  }
}
