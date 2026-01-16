import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/account/partner/projects/[id] - Get project details for partner
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get partner for this user
    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        firstSaleRate: true,
        recurringRate: true,
      },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Not a partner' }, { status: 404 })
    }

    // Get project and verify partner has access (is the referrer)
    const project = await prisma.clientProject.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            industry: true,
          },
        },
        contracts: {
          select: {
            id: true,
            contractNumber: true,
            title: true,
            status: true,
            totalValue: true,
            signedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify partner is the referrer for this project
    if (project.referredByPartnerId !== partner.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        type: project.type,
        status: project.status,
        contractValue: project.contractValue,
        monthlyRecurring: project.monthlyRecurring,
        startDate: project.startDate,
        estimatedEndDate: project.estimatedEndDate,
        completedAt: project.completedAt,
        productionUrl: project.productionUrl,
        stagingUrl: project.stagingUrl,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        client: project.client,
        contracts: project.contracts,
      },
      partner: {
        id: partner.id,
        name: partner.name,
        firstSaleRate: Number(partner.firstSaleRate),
        recurringRate: Number(partner.recurringRate),
      },
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}
