import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/team/public - Get team members for public display (About page)
export async function GET() {
  try {
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        showOnAbout: true,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        title: true,
        publicBio: true,
        profileImageUrl: true,
        accentColor: true,
        displayOrder: true,
        aboutDisplayName: true,
        aboutDisplayTitle: true,
        aboutShowPhoto: true,
        aboutUseFirstName: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    })

    return NextResponse.json({ teamMembers })
  } catch (error: any) {
    console.error('Error fetching public team members:', error)
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
  }
}
