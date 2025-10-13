import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  if (key !== 'setup47industries') {
    return NextResponse.json({ error: 'Invalid key' }, { status: 403 })
  }

  const results: string[] = []
  let connection: any = null

  try {
    // Connect directly to MySQL with database specified
    results.push('🔌 Connecting to MySQL database...')
    const dbUrl = process.env.DATABASE_URL!

    // Ensure URL includes database name
    const url = new URL(dbUrl.replace('mysql://', 'http://'))
    const connectionConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.replace('/', '') || 'railway'
    }

    connection = await mysql.createConnection(connectionConfig)
    results.push(`✅ Connected to database: ${connectionConfig.database}`)

    // Create User table
    results.push('📋 Creating User table...')
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS User (
        id VARCHAR(191) PRIMARY KEY,
        username VARCHAR(191) UNIQUE,
        email VARCHAR(191) UNIQUE,
        name VARCHAR(191),
        password VARCHAR(191),
        image VARCHAR(191),
        role ENUM('CUSTOMER', 'ADMIN', 'SUPER_ADMIN') DEFAULT 'CUSTOMER',
        emailVerified DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email)
      )
    `)
    results.push('✅ User table created')

    // Create admin user
    results.push('👤 Creating admin user...')
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const hashedPassword = await bcrypt.hash('Balance47420', 10)

    // Check if admin exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM User WHERE username = ? OR email = ? LIMIT 1',
      ['47industries', 'admin@47industries.com']
    )

    if ((existingUsers as any[]).length > 0) {
      // Update existing
      await connection.execute(`
        UPDATE User
        SET username = ?, email = ?, name = ?, password = ?, role = ?
        WHERE id = ?
      `, ['47industries', 'admin@47industries.com', '47 Industries', hashedPassword, 'ADMIN', (existingUsers as any)[0].id])
      results.push('✅ Updated existing admin user')
    } else {
      // Create new
      await connection.execute(`
        INSERT INTO User (id, username, email, name, password, role, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [userId, '47industries', 'admin@47industries.com', '47 Industries', hashedPassword, 'ADMIN'])
      results.push('✅ Created new admin user')
    }

    results.push('')
    results.push('🎉 SETUP COMPLETE!')
    results.push('')
    results.push('Login at: https://47-industries-production.up.railway.app/admin/login')
    results.push('Username: 47industries')
    results.push('Password: Balance47420')

    return NextResponse.json({ success: true, results })

  } catch (error: any) {
    results.push('❌ Error: ' + error.message)
    return NextResponse.json({ error: error.message, results }, { status: 500 })
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}
