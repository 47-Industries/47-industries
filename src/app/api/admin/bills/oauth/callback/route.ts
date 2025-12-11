import { NextRequest, NextResponse } from 'next/server'
import { getGmailBillService } from '@/lib/gmail-bills'

// GET /api/admin/bills/oauth/callback - Handle Gmail OAuth callback
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/expenses?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/admin/expenses?error=No+authorization+code', request.url)
    )
  }

  try {
    const gmailService = getGmailBillService()

    // Get the email address from the token info
    // For now, use a placeholder - in production you'd get this from the token
    const accountEmail = process.env.GMAIL_ACCOUNT_EMAIL || 'bills@47industries.com'

    await gmailService.exchangeCodeAndSave(code, accountEmail)

    return NextResponse.redirect(
      new URL('/admin/expenses?success=Gmail+connected+successfully', request.url)
    )
  } catch (error: any) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      new URL(`/admin/expenses?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }
}
