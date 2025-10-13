import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const checkLogin = searchParams.get('checkLogin')

  try {
    const dbUrl = process.env.DATABASE_URL

    if (!dbUrl) {
      return NextResponse.json({ error: 'DATABASE_URL not set' })
    }

    // Show masked URL
    const maskedUrl = dbUrl.replace(/:[^:@]*@/, ':****@')

    // Parse URL for detailed connection
    const url = new URL(dbUrl.replace('mysql://', 'http://'))
    const connectionConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.replace('/', '') || 'railway'
    }

    const connection = await mysql.createConnection(connectionConfig)

    // Test query
    const [result] = await connection.execute('SELECT 1 as test')

    // If checkLogin parameter is present, verify admin credentials
    let loginCheck = null
    if (checkLogin === 'true') {
      try {
        const [users] = await connection.execute(
          'SELECT id, username, email, password, role FROM User WHERE username = ?',
          ['47industries']
        )

        if ((users as any[]).length > 0) {
          const user = (users as any)[0]
          const isPasswordValid = await bcrypt.compare('Balance47420', user.password)

          loginCheck = {
            userFound: true,
            username: user.username,
            email: user.email,
            role: user.role,
            passwordValid: isPasswordValid
          }
        } else {
          loginCheck = {
            userFound: false,
            message: 'User 47industries not found'
          }
        }
      } catch (e: any) {
        loginCheck = {
          error: e.message
        }
      }
    }

    await connection.end()

    return NextResponse.json({
      success: true,
      message: 'MySQL connection successful',
      databaseUrl: maskedUrl,
      database: connectionConfig.database,
      testQuery: result,
      loginCheck
    })

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      code: error.code,
      sqlState: error.sqlState,
      databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@')
    }, { status: 500 })
  }
}
