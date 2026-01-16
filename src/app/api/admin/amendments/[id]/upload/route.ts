import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'
import { uploadToR2, isR2Configured } from '@/lib/r2'

// POST /api/admin/amendments/[id]/upload - Upload PDF to amendment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isR2Configured) {
      return NextResponse.json({ error: 'R2 storage not configured' }, { status: 500 })
    }

    const { id } = await params

    // Check if amendment exists
    const amendment = await prisma.contractAmendment.findUnique({
      where: { id },
      include: {
        clientContract: {
          include: {
            client: {
              select: { clientNumber: true },
            },
          },
        },
        partnerContract: {
          include: {
            partner: {
              select: { partnerNumber: true },
            },
          },
        },
      },
    })

    if (!amendment) {
      return NextResponse.json({ error: 'Amendment not found' }, { status: 404 })
    }

    // Only allow upload if in DRAFT status
    if (amendment.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only upload PDF for amendments in DRAFT status' },
        { status: 400 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    // Generate file key based on contract type
    let folderPath: string
    if (amendment.clientContractId && amendment.clientContract) {
      const clientNumber = amendment.clientContract.client.clientNumber
      folderPath = `contracts/clients/${clientNumber}/amendments`
    } else if (amendment.partnerContractId && amendment.partnerContract) {
      const partnerNumber = amendment.partnerContract.partner.partnerNumber
      folderPath = `contracts/partners/${partnerNumber}/amendments`
    } else {
      folderPath = 'contracts/amendments'
    }

    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const key = `${folderPath}/${amendment.amendmentNumber}-${sanitizedFileName}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to R2
    const fileUrl = await uploadToR2(key, buffer, file.type)

    // Update amendment with file info
    const updatedAmendment = await prisma.contractAmendment.update({
      where: { id },
      data: {
        fileUrl,
        fileName: file.name,
      },
    })

    return NextResponse.json({
      success: true,
      amendment: updatedAmendment,
    })
  } catch (error) {
    console.error('Error uploading amendment PDF:', error)
    return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 })
  }
}
