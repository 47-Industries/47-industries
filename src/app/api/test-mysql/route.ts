import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL

    if (!dbUrl) {
      return NextResponse.json({ error: 'DATABASE_URL not set' })
    }

    // Show masked URL
    const maskedUrl = dbUrl.replace(/:[^:@]*@/, ':****@')

    // Try to connect
    const connection = await mysql.createConnection(dbUrl)

    // Test query
    const [result] = await connection.execute('SELECT 1 as test')

    await connection.end()

    return NextResponse.json({
      success: true,
      message: 'MySQL connection successful',
      databaseUrl: maskedUrl,
      testQuery: result
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
