import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth, getAdminAuthInfo } from '@/lib/auth-helper'

// GET /api/admin/contracts - List all contracts
export async function GET(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')

    const where: any = {}

    if (clientId) {
      where.clientId = clientId
    }

    if (status && status !== 'all') {
      where.status = status
    }

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, clientNumber: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ contracts })
  } catch (error) {
    console.error('Error fetching contracts:', error)
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 })
  }
}

// POST /api/admin/contracts - Create contract
export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const auth = await getAdminAuthInfo(req)

    if (!body.clientId || !body.title) {
      return NextResponse.json({ error: 'Client ID and title are required' }, { status: 400 })
    }

    // Generate contract number
    const date = new Date()
    const timestamp = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0')
    const count = await prisma.contract.count()
    const contractNumber = `CON-${timestamp}-${(count + 1).toString().padStart(4, '0')}`

    const contract = await prisma.contract.create({
      data: {
        contractNumber,
        clientId: body.clientId,
        projectId: body.projectId || null,
        title: body.title,
        description: body.description || null,
        fileUrl: body.fileUrl || null,
        externalUrl: body.externalUrl || null,
        totalValue: body.totalValue || 0,
        monthlyValue: body.monthlyValue || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        status: body.status || 'DRAFT',
        requiredAdminSignatures: body.requiredAdminSignatures ?? 1,
        clientSignatureRequired: body.clientSignatureRequired ?? true,
        createdBy: auth.userId,
      },
      include: {
        client: true,
        project: true,
      },
    })

    // Log activity
    await prisma.clientActivity.create({
      data: {
        clientId: body.clientId,
        type: 'CONTRACT_SENT',
        description: `Contract "${body.title}" created`,
        performedBy: auth.userId,
      },
    })

    return NextResponse.json({ success: true, contract })
  } catch (error) {
    console.error('Error creating contract:', error)
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 })
  }
}
