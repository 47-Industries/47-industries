import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'
import { uploadToR2, isR2Configured } from '@/lib/r2'
import { renderToBuffer } from '@react-pdf/renderer'
import { PartnerAgreementPDF } from '@/lib/pdf/partner-agreement'
import React from 'react'

// POST /api/admin/partners/[id]/generate-agreement - Generate and save partner agreement PDF
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
        email: true,
        phone: true,
        company: true,
        firstSaleRate: true,
        recurringRate: true,
        createdAt: true,
      },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    // Prepare partner data for PDF
    const partnerData = {
      ...partner,
      firstSaleRate: Number(partner.firstSaleRate),
      recurringRate: Number(partner.recurringRate),
      createdAt: partner.createdAt.toISOString(),
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(PartnerAgreementPDF, { partner: partnerData })
    )

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const sanitizedName = partner.name.replace(/[^a-zA-Z0-9]/g, '-')
    const fileName = `Partner-Agreement-${sanitizedName}-${timestamp}.pdf`
    const fileKey = `contracts/partner-agreements/${partner.partnerNumber}/${fileName}`

    let fileUrl: string

    // Upload to R2 if configured, otherwise save locally (for dev)
    if (isR2Configured) {
      fileUrl = await uploadToR2(fileKey, Buffer.from(pdfBuffer), 'application/pdf')
    } else {
      // For development without R2, we'll return a data URL or throw an error
      return NextResponse.json(
        { error: 'R2 storage not configured. Please configure R2 to save PDFs.' },
        { status: 500 }
      )
    }

    // Update or create partner contract with the PDF URL
    await prisma.partnerContract.upsert({
      where: { partnerId: id },
      create: {
        partnerId: id,
        title: 'Partner Referral Agreement',
        description: `Partner referral agreement for ${partner.name}. Commission rates: ${partner.firstSaleRate}% first sale, ${partner.recurringRate}% recurring.`,
        fileUrl: fileUrl,
        fileName: fileName,
        status: 'DRAFT',
      },
      update: {
        title: 'Partner Referral Agreement',
        description: `Partner referral agreement for ${partner.name}. Commission rates: ${partner.firstSaleRate}% first sale, ${partner.recurringRate}% recurring.`,
        fileUrl: fileUrl,
        fileName: fileName,
        // Don't update status if already signed
      },
    })

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName,
      message: 'Agreement generated and saved successfully',
    })
  } catch (error) {
    console.error('Error generating partner agreement:', error)
    return NextResponse.json(
      { error: 'Failed to generate agreement: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
