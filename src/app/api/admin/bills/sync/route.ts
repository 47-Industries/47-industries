import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'
import { getGmailBillService, processAndSaveBills } from '@/lib/gmail-bills'

// POST /api/admin/bills/sync - Sync bills from Gmail
export async function POST(request: NextRequest) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const gmailService = getGmailBillService()

    // Load credentials from database
    const hasCredentials = await gmailService.setCredentialsFromDb()
    if (!hasCredentials) {
      return NextResponse.json({
        error: 'Gmail not configured',
        needsAuth: true,
        authUrl: gmailService.getAuthUrl()
      }, { status: 400 })
    }

    // Fetch and process emails
    const emails = await gmailService.fetchRecentEmails()
    const results = await processAndSaveBills(emails)

    // Update last sync time
    await prisma.gmailCredentials.updateMany({
      data: { lastSync: new Date() }
    })

    // Auto-create payment splits for new bills
    const newBills = await prisma.bill.findMany({
      where: {
        payments: { none: {} },
        status: 'PENDING'
      }
    })

    const founders = await prisma.user.findMany({ where: { isFounder: true } })

    for (const bill of newBills) {
      if (founders.length > 0) {
        const splitAmount = Number(bill.amount) / founders.length
        await prisma.billPayment.createMany({
          data: founders.map(f => ({
            billId: bill.id,
            userId: f.id,
            amount: splitAmount,
            status: 'PENDING'
          }))
        })
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      splitsCreated: newBills.length
    })
  } catch (error: any) {
    console.error('Error syncing bills:', error)
    return NextResponse.json({ error: 'Failed to sync bills: ' + error.message }, { status: 500 })
  }
}

// GET /api/admin/bills/sync - Get sync status
export async function GET(request: NextRequest) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const credentials = await prisma.gmailCredentials.findFirst({
      orderBy: { updatedAt: 'desc' }
    })

    const gmailService = getGmailBillService()

    return NextResponse.json({
      configured: !!credentials,
      accountEmail: credentials?.accountEmail,
      lastSync: credentials?.lastSync,
      authUrl: !credentials ? gmailService.getAuthUrl() : null
    })
  } catch (error: any) {
    console.error('Error getting sync status:', error)
    return NextResponse.json({ error: 'Failed to get sync status' }, { status: 500 })
  }
}
