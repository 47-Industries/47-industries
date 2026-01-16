import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth, getAdminAuthInfo } from '@/lib/auth-helper'

// GET /api/admin/amendments - List amendments
export async function GET(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const clientContractId = searchParams.get('clientContractId')
    const partnerContractId = searchParams.get('partnerContractId')
    const status = searchParams.get('status')

    const where: any = {}

    if (clientContractId) {
      where.clientContractId = clientContractId
    }

    if (partnerContractId) {
      where.partnerContractId = partnerContractId
    }

    if (status && status !== 'all') {
      where.status = status
    }

    const amendments = await prisma.contractAmendment.findMany({
      where,
      include: {
        clientContract: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        partnerContract: {
          include: {
            partner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ amendments })
  } catch (error) {
    console.error('Error fetching amendments:', error)
    return NextResponse.json({ error: 'Failed to fetch amendments' }, { status: 500 })
  }
}

// POST /api/admin/amendments - Create a new amendment
export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const auth = await getAdminAuthInfo(req)

    // Validate - exactly one contract type must be provided
    if ((!body.clientContractId && !body.partnerContractId) ||
        (body.clientContractId && body.partnerContractId)) {
      return NextResponse.json(
        { error: 'Exactly one of clientContractId or partnerContractId must be provided' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!body.title || body.additionalValue === undefined) {
      return NextResponse.json(
        { error: 'Title and additionalValue are required' },
        { status: 400 }
      )
    }

    // Generate amendment number
    const date = new Date()
    const timestamp = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0')
    const count = await prisma.contractAmendment.count()
    const amendmentNumber = `AMEND-${timestamp}-${(count + 1).toString().padStart(4, '0')}`

    const amendment = await prisma.contractAmendment.create({
      data: {
        amendmentNumber,
        clientContractId: body.clientContractId || null,
        partnerContractId: body.partnerContractId || null,
        title: body.title,
        description: body.description || null,
        additionalValue: body.additionalValue,
        additionalMonthlyValue: body.additionalMonthlyValue || null,
        effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
        createdBy: auth.userId,
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

    return NextResponse.json({ success: true, amendment })
  } catch (error) {
    console.error('Error creating amendment:', error)
    return NextResponse.json({ error: 'Failed to create amendment' }, { status: 500 })
  }
}
