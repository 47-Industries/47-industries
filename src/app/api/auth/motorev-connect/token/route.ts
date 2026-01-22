import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateConnectionToken } from '@/lib/user-affiliate-utils'

// POST /api/auth/motorev-connect/token
// Generates a connection token for linking MotoRev to 47 Industries account
// Auth: Requires authenticated session
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: userId, email, name } = session.user

    if (!email) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      )
    }

    // Generate connection token
    const token = generateConnectionToken(userId, email, name || undefined)

    return NextResponse.json({
      success: true,
      token,
    })
  } catch (error) {
    console.error('Error generating connection token:', error)
    return NextResponse.json(
      { error: 'Failed to generate connection token' },
      { status: 500 }
    )
  }
}
