import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthInfo } from '@/lib/auth-helper'

import { prisma } from '@/lib/prisma'

// GET /api/admin/notifications - List all notifications
export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)

    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'all'

    const where: any = {
      OR: [
        { userId: null }, // For all admins
        { userId: auth.userId }, // For specific admin
      ]
    }

    if (filter === 'unread') {
      where.isRead = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Calculate stats
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const allNotifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: null },
          { userId: auth.userId },
        ]
      },
      select: {
        isRead: true,
        createdAt: true,
      }
    })

    const stats = {
      total: allNotifications.length,
      unread: allNotifications.filter(n => !n.isRead).length,
      today: allNotifications.filter(n => n.createdAt >= todayStart).length,
      thisWeek: allNotifications.filter(n => n.createdAt >= weekStart).length,
    }

    return NextResponse.json({ notifications, stats })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST /api/admin/notifications - Create a notification (internal use)
export async function POST(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)

    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { type, title, message, link, userId, metadata } = body

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Type, title, and message are required' },
        { status: 400 }
      )
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        link: link || null,
        userId: userId || null,
        metadata: metadata || null,
      },
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}
