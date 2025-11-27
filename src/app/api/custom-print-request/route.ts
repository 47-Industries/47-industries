import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CustomRequestStatus } from '@prisma/client'

// POST /api/custom-print-request - Submit a 3D printing quote request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate required fields
    if (!body.name || !body.email || !body.material || !body.finish || !body.color || !body.quantity) {
      return NextResponse.json(
        { error: 'Name, email, material, finish, color, and quantity are required' },
        { status: 400 }
      )
    }

    if (!body.fileUrl || !body.fileName || !body.fileSize) {
      return NextResponse.json(
        { error: 'File upload is required' },
        { status: 400 }
      )
    }

    // Generate request number
    const date = new Date()
    const prefix = '3DP'
    const timestamp = date.getFullYear().toString().slice(-2) +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0')
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    const requestNumber = `${prefix}-${timestamp}-${random}`

    const customRequest = await prisma.customRequest.create({
      data: {
        requestNumber,
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        company: body.company || null,
        fileUrl: body.fileUrl,
        fileName: body.fileName,
        fileSize: body.fileSize,
        material: body.material,
        finish: body.finish,
        color: body.color,
        quantity: body.quantity,
        dimensions: body.dimensions || null,
        scale: body.scale || null,
        notes: body.notes || null,
        deadline: body.deadline ? new Date(body.deadline) : null,
        status: CustomRequestStatus.PENDING,
      },
    })

    return NextResponse.json({
      success: true,
      requestNumber: customRequest.requestNumber,
      message: 'Your quote request has been received. We will review it and get back to you within 24-48 hours.',
    })
  } catch (error) {
    console.error('Error submitting custom print request:', error)
    return NextResponse.json(
      { error: 'Failed to submit your request. Please try again.' },
      { status: 500 }
    )
  }
}
