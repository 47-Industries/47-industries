import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'
import { uploadToR2, isR2Configured } from '@/lib/r2'
import { renderToBuffer } from '@react-pdf/renderer'
import { ServiceAgreementPDF } from '@/lib/pdf/service-agreement'
import React from 'react'

// POST /api/admin/clients/[id]/generate-agreement - Generate and save service agreement PDF
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

    // Get client data
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: true,
        contracts: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Validate required fields
    const {
      projectName,
      scope,
      totalValue,
      monthlyValue,
      paymentTerms,
      monthlyIncludes,
      startDate,
      contractId,
    } = body

    if (!projectName || !scope || !totalValue || !paymentTerms) {
      return NextResponse.json(
        { error: 'Missing required fields: projectName, scope, totalValue, paymentTerms' },
        { status: 400 }
      )
    }

    // Generate contract number if creating new, or use existing
    let contractNumber: string
    let existingContract = null

    if (contractId) {
      existingContract = await prisma.contract.findUnique({
        where: { id: contractId },
      })
      if (!existingContract) {
        return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
      }
      contractNumber = existingContract.contractNumber
    } else {
      const date = new Date()
      const timestamp =
        date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0')
      const count = await prisma.contract.count()
      contractNumber = `CON-${timestamp}-${(count + 1).toString().padStart(4, '0')}`
    }

    // Prepare data for PDF
    const clientData = {
      name: client.name,
      email: client.email,
      phone: client.phone || undefined,
      address: client.address || undefined,
      clientNumber: client.clientNumber,
    }

    const contractData = {
      contractNumber,
      title: body.title || `${client.name} Service Agreement`,
      projectName,
      scope: Array.isArray(scope) ? scope : [scope],
      totalValue: Number(totalValue),
      monthlyValue: monthlyValue ? Number(monthlyValue) : undefined,
      paymentTerms,
      monthlyIncludes: monthlyIncludes || [],
      startDate,
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(ServiceAgreementPDF, { client: clientData, contract: contractData })
    )

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const sanitizedName = client.name.replace(/[^a-zA-Z0-9]/g, '-')
    const fileName = `Service-Agreement-${sanitizedName}-${timestamp}.pdf`
    const fileKey = `contracts/clients/${client.clientNumber}/${fileName}`

    let fileUrl: string

    // Upload to R2 if configured
    if (isR2Configured) {
      fileUrl = await uploadToR2(fileKey, Buffer.from(pdfBuffer), 'application/pdf')
    } else {
      return NextResponse.json(
        { error: 'R2 storage not configured. Please configure R2 to save PDFs.' },
        { status: 500 }
      )
    }

    // Build description from scope
    const scopeText = contractData.scope.join('\n- ')
    const description = `SCOPE OF WORK:\n- ${scopeText}\n\nPAYMENT TERMS:\n${paymentTerms}\n\nProject Value: $${totalValue.toLocaleString()}${monthlyValue ? `\nMonthly Maintenance: $${monthlyValue.toLocaleString()}/month` : ''}`

    // Update existing contract or create new one
    let contract
    if (existingContract) {
      contract = await prisma.contract.update({
        where: { id: contractId },
        data: {
          title: contractData.title,
          description,
          fileUrl,
          fileName,
          totalValue,
          monthlyValue: monthlyValue || null,
          startDate: startDate ? new Date(startDate) : null,
        },
      })
    } else {
      contract = await prisma.contract.create({
        data: {
          contractNumber,
          clientId: id,
          title: contractData.title,
          description,
          fileUrl,
          fileName,
          totalValue,
          monthlyValue: monthlyValue || null,
          startDate: startDate ? new Date(startDate) : null,
          status: 'DRAFT',
        },
      })
    }

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName,
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      message: 'Service agreement generated and saved successfully',
    })
  } catch (error) {
    console.error('Error generating service agreement:', error)
    return NextResponse.json(
      { error: 'Failed to generate agreement: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
