import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkExpensePermission } from '@/lib/expense-permissions'
import { billParser } from '@/lib/bill-parser'

// POST /api/admin/email-accounts/[id]/sync - Manually sync an email account
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const permission = await checkExpensePermission()
  if (!permission.canAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const daysBack = Math.min(body.daysBack || 7, 60)

    const account = await prisma.emailAccount.findUnique({
      where: { id }
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    if (!account.isActive) {
      return NextResponse.json({ error: 'Account is not active' }, { status: 400 })
    }

    let results = {
      emails: 0,
      proposed: 0,
      errors: [] as string[]
    }

    if (account.provider === 'GMAIL') {
      // Use Gmail scanner for this specific account
      const { gmailScanner } = await import('@/lib/gmail-scanner')

      if (!account.refreshToken) {
        return NextResponse.json({ error: 'No refresh token configured' }, { status: 400 })
      }

      try {
        // Fetch emails from this account
        const emails = await gmailScanner.fetchRecentEmails(account.refreshToken, daysBack)
        results.emails = emails.length

        // Process each email to create proposed bills
        for (const email of emails) {
          const result = await billParser.processEmailToProposed(email, 'GMAIL', account.id)
          if (result.created) {
            results.proposed++
          }
        }

        // Update sync time
        await prisma.emailAccount.update({
          where: { id },
          data: { lastSyncAt: new Date(), lastSyncError: null }
        })
      } catch (err: any) {
        results.errors.push(err.message)
        await prisma.emailAccount.update({
          where: { id },
          data: { lastSyncError: err.message }
        })
      }
    } else if (account.provider === 'ZOHO') {
      // Use Zoho scanner for this specific account
      const { zohoBillScanner } = await import('@/lib/zoho-bill-scanner')

      try {
        const scanResult = await zohoBillScanner.scanAccount(id, daysBack)

        if (scanResult.error) {
          results.errors.push(scanResult.error)
        } else {
          results.emails = scanResult.emails.length

          // Process each email to create proposed bills
          for (const email of scanResult.emails) {
            const result = await billParser.processEmailToProposed(email, 'ZOHO', account.id)
            if (result.created) {
              results.proposed++
            }
          }
        }
      } catch (err: any) {
        results.errors.push(err.message)
      }
    } else {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      results
    })
  } catch (error: any) {
    console.error('[EMAIL_ACCOUNTS] Error syncing:', error.message)
    return NextResponse.json({ error: 'Failed to sync email account' }, { status: 500 })
  }
}
