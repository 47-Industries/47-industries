import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/account/client - Get client data for authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find client linked to this user
    const client = await prisma.client.findUnique({
      where: { userId: user.id },
      include: {
        projects: {
          where: { status: { in: ['ACTIVE', 'PROPOSAL'] } },
          select: {
            id: true,
            name: true,
            status: true,
            monthlyRecurring: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            status: true,
            dueDate: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        contracts: {
          select: {
            id: true,
            contractNumber: true,
            title: true,
            status: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'No client account linked' }, { status: 404 })
    }

    return NextResponse.json({
      client: {
        id: client.id,
        clientNumber: client.clientNumber,
        name: client.name,
        type: client.type,
        totalRevenue: client.totalRevenue,
        totalOutstanding: client.totalOutstanding,
        autopayEnabled: client.autopayEnabled,
        projects: client.projects,
        invoices: client.invoices,
        contracts: client.contracts,
      },
    })
  } catch (error) {
    console.error('Error fetching client data:', error)
    return NextResponse.json({ error: 'Failed to fetch client data' }, { status: 500 })
  }
}
