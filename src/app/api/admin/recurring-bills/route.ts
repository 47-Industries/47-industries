import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/recurring-bills - List all recurring bills
export async function GET(request: NextRequest) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const recurringBills = await prisma.recurringBill.findMany({
      where: { active: true },
      orderBy: { dueDay: 'asc' },
      include: {
        _count: {
          select: { instances: true }
        }
      }
    })

    return NextResponse.json({
      recurringBills,
      total: recurringBills.length
    })
  } catch (error: any) {
    console.error('Error fetching recurring bills:', error)
    return NextResponse.json({ error: 'Failed to fetch recurring bills' }, { status: 500 })
  }
}

// POST /api/admin/recurring-bills - Create a new recurring bill
export async function POST(request: NextRequest) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      name,
      vendor,
      amountType,
      fixedAmount,
      frequency,
      dueDay,
      emailPatterns,
      paymentMethod,
      vendorType
    } = body

    if (!name || !vendor || !amountType || !frequency || !dueDay || !vendorType) {
      return NextResponse.json(
        { error: 'Missing required fields: name, vendor, amountType, frequency, dueDay, vendorType' },
        { status: 400 }
      )
    }

    if (amountType === 'FIXED' && !fixedAmount) {
      return NextResponse.json(
        { error: 'Fixed amount is required for FIXED amount type' },
        { status: 400 }
      )
    }

    // Check for existing duplicate (same vendor, normalized)
    const normalizedVendor = vendor.toLowerCase().replace(/[^a-z0-9]/g, '')
    const existingBills = await prisma.recurringBill.findMany({
      where: { active: true }
    })

    const duplicate = existingBills.find(bill => {
      const existingNormalized = bill.vendor.toLowerCase().replace(/[^a-z0-9]/g, '')
      return existingNormalized === normalizedVendor && bill.vendorType === vendorType
    })

    if (duplicate) {
      return NextResponse.json({
        success: true,
        recurringBill: duplicate,
        message: 'Recurring bill already exists - using existing'
      })
    }

    const recurringBill = await prisma.recurringBill.create({
      data: {
        name,
        vendor,
        amountType,
        fixedAmount: fixedAmount ? parseFloat(fixedAmount) : null,
        frequency,
        dueDay: parseInt(dueDay),
        emailPatterns: emailPatterns || [],
        paymentMethod: paymentMethod || null,
        vendorType
      }
    })

    return NextResponse.json({
      success: true,
      recurringBill
    })
  } catch (error: any) {
    console.error('Error creating recurring bill:', error)
    return NextResponse.json({ error: 'Failed to create recurring bill' }, { status: 500 })
  }
}
