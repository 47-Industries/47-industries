import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/team/[id]/documents - Get team member documents
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

    const documents = await prisma.teamMemberDocument.findMany({
      where: { teamMemberId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

// POST /api/admin/team/[id]/documents - Upload team member document
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
      select: { role: true, name: true },
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

    if (!body.name || !body.type || !body.fileUrl || !body.fileName) {
      return NextResponse.json(
        { error: 'Name, type, fileUrl, and fileName are required' },
        { status: 400 }
      )
    }

    const document = await prisma.teamMemberDocument.create({
      data: {
        teamMemberId: id,
        name: body.name,
        type: body.type,
        fileUrl: body.fileUrl,
        fileName: body.fileName,
        uploadedBy: session.user.id,
      },
    })

    return NextResponse.json({ success: true, document })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}
