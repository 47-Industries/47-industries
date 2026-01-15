import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/team/[id]/contracts - Get team member contracts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const teamMember = await prisma.teamMember.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    const contracts = await prisma.teamMemberContract.findMany({
      where: { teamMemberId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ contracts })
  } catch (error) {
    console.error('Error fetching contracts:', error)
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 })
  }
}

// POST /api/admin/team/[id]/contracts - Create team member contract
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()

    const teamMember = await prisma.teamMember.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    if (!body.title || !body.type) {
      return NextResponse.json(
        { error: 'Title and type are required' },
        { status: 400 }
      )
    }

    const contract = await prisma.teamMemberContract.create({
      data: {
        teamMemberId: id,
        title: body.title,
        type: body.type,
        fileUrl: body.fileUrl || null,
        fileName: body.fileName || null,
        status: body.status || 'DRAFT',
        signedAt: body.signedAt ? new Date(body.signedAt) : null,
        effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
      },
    })

    return NextResponse.json({ success: true, contract })
  } catch (error) {
    console.error('Error creating contract:', error)
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 })
  }
}
