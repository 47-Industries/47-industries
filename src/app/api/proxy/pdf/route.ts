import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  // Require authentication
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 })
  }

  // Only allow fetching from our R2 bucket domain
  const allowedDomains = [
    'files.47industries.com',
    'pub-', // R2 public bucket URLs
    '47industries', // R2 bucket references
  ]

  try {
    const parsedUrl = new URL(url)
    const isAllowed = allowedDomains.some(domain =>
      parsedUrl.hostname.includes(domain) || parsedUrl.href.includes(domain)
    )

    if (!isAllowed) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 })
    }

    // Fetch the PDF
    const response = await fetch(url)

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch PDF: ${response.status}` },
        { status: response.status }
      )
    }

    const pdfBuffer = await response.arrayBuffer()

    // Return the PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.byteLength.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error proxying PDF:', error)
    return NextResponse.json(
      { error: 'Failed to fetch PDF' },
      { status: 500 }
    )
  }
}
