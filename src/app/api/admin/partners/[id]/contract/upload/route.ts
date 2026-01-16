import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'
import { uploadToR2, isR2Configured } from '@/lib/r2'

// POST /api/admin/partners/[id]/contract/upload - Upload contract PDF
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

    // Get partner data
    const partner = await prisma.partner.findUnique({
      where: { id },
      select: {
        id: true,
        partnerNumber: true,
        name: true,
        contract: {
          select: { id: true },
        },
      },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    // Check if R2 is configured
    if (!isR2Configured) {
      return NextResponse.json(
        { error: 'File storage not configured. Please configure R2 to upload files.' },
        { status: 500 }
      )
    }

    // Get the uploaded file
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const sanitizedName = partner.name.replace(/[^a-zA-Z0-9]/g, '-')
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-')
    const fileName = `${sanitizedName}-${timestamp}-${originalName}`
    const fileKey = `contracts/partner-agreements/${partner.partnerNumber}/${fileName}`

    // Upload to R2
    const fileUrl = await uploadToR2(fileKey, buffer, 'application/pdf')

    // Update or create partner contract with the PDF URL
    await prisma.partnerContract.upsert({
      where: { partnerId: id },
      create: {
        partnerId: id,
        title: 'Partner Referral Agreement',
        description: `Partner referral agreement for ${partner.name}.`,
        fileUrl: fileUrl,
        fileName: file.name,
        status: 'DRAFT',
      },
      update: {
        fileUrl: fileUrl,
        fileName: file.name,
        // Don't update status or other fields if already set
      },
    })

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      message: 'Contract uploaded successfully',
    })
  } catch (error) {
    console.error('Error uploading partner contract:', error)
    return NextResponse.json(
      { error: 'Failed to upload contract: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
