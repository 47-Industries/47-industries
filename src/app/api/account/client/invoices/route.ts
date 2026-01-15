import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/account/client/invoices - Get invoices for authenticated client
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user and their linked client
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        client: {
          select: { id: true },
        },
      },
    })

    if (!user?.client) {
      return NextResponse.json({ error: 'No client account linked' }, { status: 404 })
    }

    // Fetch invoices for this client
    const invoices = await prisma.invoice.findMany({
      where: { clientId: user.client.id },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        status: true,
        dueDate: true,
        paidAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error('Error fetching client invoices:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}
