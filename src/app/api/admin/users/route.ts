import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthInfo } from '@/lib/auth-helper'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/admin/users - List all users with filtering
export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)
    if (!auth.isAuthorized || (auth.role !== 'ADMIN' && auth.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role') // CUSTOMER, ADMIN, SUPER_ADMIN, or null for all
    const adminRoles = searchParams.get('adminRoles') // If true, fetch both ADMIN and SUPER_ADMIN
    const search = searchParams.get('search')

    const where: any = {}

    if (adminRoles === 'true') {
      // Fetch both ADMIN and SUPER_ADMIN
      where.role = { in: ['ADMIN', 'SUPER_ADMIN'] }
    } else if (role) {
      where.role = role
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { username: { contains: search } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        role: true,
        permissions: true,
        emailAccess: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST /api/admin/users - Create a new user
export async function POST(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)
    if (!auth.isAuthorized || (auth.role !== 'ADMIN' && auth.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, username, email, password, role, permissions, emailAccess } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if user already exists by email
    const existingEmail = await prisma.user.findUnique({ where: { email } })
    if (existingEmail) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
    }

    // Check if username is taken (if provided)
    if (username) {
      const existingUsername = await prisma.user.findUnique({ where: { username } })
      if (existingUsername) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 })
      }
    }

    // Hash password if provided
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null

    const user = await prisma.user.create({
      data: {
        name,
        username: username || null,
        email,
        password: hashedPassword,
        role: role || 'CUSTOMER',
        permissions: permissions || null,
        emailAccess: emailAccess || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        emailAccess: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
