import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth, getAdminAuthInfo } from '@/lib/auth-helper'
import { uploadToR2, isR2Configured } from '@/lib/r2'
import { renderToBuffer } from '@react-pdf/renderer'
import { ClientServiceAgreementPDF } from '@/lib/pdf/client-service-agreement'
import React from 'react'

// POST /api/admin/clients/[id]/projects/[projectId]/generate-contract - Generate and save client service agreement PDF
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: clientId, projectId } = await params
    const body = await req.json()
    const auth = await getAdminAuthInfo(req)

    // Get client data
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        clientNumber: true,
        name: true,
        email: true,
        phone: true,
        address: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Get project data
    const project = await prisma.clientProject.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        contractValue: true,
        monthlyRecurring: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Use provided date or default to today
    const effectiveDate = body.effectiveDate || new Date().toISOString()

    // Check if regenerating existing contract
    const existingContractId = body.contractId
    let existingContract = null
    if (existingContractId) {
      existingContract = await prisma.contract.findUnique({
        where: { id: existingContractId },
        select: { contractNumber: true, title: true },
      })
    }

    // Generate contract number or use existing
    let contractNumber: string
    if (existingContract) {
      contractNumber = existingContract.contractNumber
    } else {
      const date = new Date()
      const timestamp = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0')
      const count = await prisma.contract.count()
      contractNumber = `CON-${timestamp}-${(count + 1).toString().padStart(4, '0')}`
    }

    // Prepare data for PDF
    const pdfData = {
      client: {
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        clientNumber: client.clientNumber,
      },
      project: {
        name: project.name,
        description: project.description,
        contractValue: Number(project.contractValue) || 0,
        monthlyRecurring: project.monthlyRecurring ? Number(project.monthlyRecurring) : null,
        type: project.type,
      },
      contract: {
        contractNumber,
        title: body.title || `Service Agreement - ${project.name}`,
      },
      effectiveDate,
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(ClientServiceAgreementPDF, pdfData)
    )

    // Generate filename
    const dateStamp = new Date().toISOString().split('T')[0]
    const sanitizedName = client.name.replace(/[^a-zA-Z0-9]/g, '-')
    const sanitizedProject = project.name.replace(/[^a-zA-Z0-9]/g, '-')
    const fileName = `Service-Agreement-${sanitizedName}-${sanitizedProject}-${dateStamp}.pdf`
    const fileKey = `contracts/client-agreements/${client.clientNumber}/${fileName}`

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

    // Create or update contract record
    const contractTitle = body.title || existingContract?.title || `Service Agreement - ${project.name}`
    let contract

    if (existingContractId && existingContract) {
      // Update existing contract
      contract = await prisma.contract.update({
        where: { id: existingContractId },
        data: {
          fileUrl,
          // Keep other fields unless explicitly updating
        },
        include: {
          client: true,
          project: true,
        },
      })
    } else {
      // Create new contract
      contract = await prisma.contract.create({
        data: {
          contractNumber,
          clientId,
          projectId,
          title: contractTitle,
          description: `Client service agreement for ${client.name}. Project: ${project.name}. Value: $${project.contractValue || 0}`,
          fileUrl,
          totalValue: project.contractValue || 0,
          monthlyValue: project.monthlyRecurring,
          status: 'DRAFT',
        },
        include: {
          client: true,
          project: true,
        },
      })
    }

    // Log activity
    await prisma.clientActivity.create({
      data: {
        clientId,
        type: 'CONTRACT_SENT',
        description: existingContractId
          ? `Contract "${contract.title}" regenerated for project "${project.name}"`
          : `Contract "${contract.title}" generated for project "${project.name}"`,
        performedBy: auth.userId,
      },
    })

    return NextResponse.json({
      success: true,
      contract,
      fileUrl,
      fileName,
      message: 'Contract generated and saved successfully',
    })
  } catch (error) {
    console.error('Error generating client contract:', error)
    return NextResponse.json(
      { error: 'Failed to generate contract: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
