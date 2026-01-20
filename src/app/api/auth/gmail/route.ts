import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { google } from 'googleapis'

// GET /api/auth/gmail - Redirect to Gmail OAuth
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
      return NextResponse.json({ error: 'Gmail OAuth not configured' }, { status: 500 })
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI || 'https://admin.47industries.com/api/auth/gmail/callback'
    )

    // Generate state for CSRF protection
    const state = Buffer.from(JSON.stringify({
      userId: session.user.id,
      timestamp: Date.now()
    })).toString('base64')

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'consent',
      state
    })

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Error initiating Gmail OAuth:', error)
    return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 })
  }
}
