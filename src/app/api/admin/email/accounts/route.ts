import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ZohoMailClient, refreshAccessToken } from '@/lib/zoho'

async function getValidAccessToken(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      zohoAccessToken: true,
      zohoRefreshToken: true,
      zohoTokenExpiry: true,
    },
  })

  if (!user?.zohoAccessToken || !user?.zohoRefreshToken) {
    return null
  }

  const isExpired = user.zohoTokenExpiry
    ? new Date(user.zohoTokenExpiry).getTime() < Date.now() + 5 * 60 * 1000
    : true

  if (isExpired) {
    try {
      const tokens = await refreshAccessToken(user.zohoRefreshToken)
      await prisma.user.update({
        where: { id: userId },
        data: {
          zohoAccessToken: tokens.access_token,
          zohoTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        },
      })
      return tokens.access_token
    } catch (error) {
      console.error('Failed to refresh Zoho token:', error)
      return null
    }
  }

  return user.zohoAccessToken
}

// GET /api/admin/email/accounts - Get all email accounts/mailboxes from Zoho
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessToken = await getValidAccessToken(session.user.id)
    if (!accessToken) {
      return NextResponse.json({ error: 'Zoho Mail not connected', needsAuth: true }, { status: 401 })
    }

    const client = new ZohoMailClient(accessToken)

    // Get the main account first
    const accounts = await client.getAccounts()
    console.log('Zoho accounts:', JSON.stringify(accounts, null, 2))

    // Get all "from" addresses (includes group emails like support@, info@, etc.)
    const fromAddresses = await client.getFromAddresses()
    console.log('Zoho fromAddresses:', JSON.stringify(fromAddresses, null, 2))

    // Format from addresses for the frontend
    let mailboxes = fromAddresses.map((addr: any) => ({
      id: addr.sendMailId || addr.fromAddress,
      label: addr.displayName || addr.fromAddress?.split('@')[0] || 'Unknown',
      email: addr.fromAddress,
    }))

    // If no from addresses found, fall back to main account
    if (mailboxes.length === 0 && accounts.length > 0) {
      const acc = accounts[0]
      mailboxes.push({
        id: acc.accountId,
        label: acc.displayName || acc.emailAddress?.split('@')[0] || 'Unknown',
        email: acc.emailAddress,
      })
    }

    console.log('Final mailboxes:', JSON.stringify(mailboxes, null, 2))
    return NextResponse.json({ mailboxes })
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}
