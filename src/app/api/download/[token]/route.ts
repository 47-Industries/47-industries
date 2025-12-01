import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Find the download record
    const download = await prisma.digitalDownload.findUnique({
      where: { downloadToken: token },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            digitalFileUrl: true,
            digitalFileName: true,
          },
        },
      },
    })

    if (!download) {
      return NextResponse.json(
        { error: 'Invalid download link' },
        { status: 404 }
      )
    }

    // Check if download has expired
    if (download.expiresAt && new Date() > download.expiresAt) {
      return NextResponse.json(
        { error: 'Download link has expired' },
        { status: 410 }
      )
    }

    // Check download limit
    if (download.maxDownloads && download.downloadCount >= download.maxDownloads) {
      return NextResponse.json(
        { error: 'Download limit exceeded' },
        { status: 403 }
      )
    }

    // Verify file URL exists
    if (!download.product.digitalFileUrl) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Update download count
    await prisma.digitalDownload.update({
      where: { id: download.id },
      data: {
        downloadCount: download.downloadCount + 1,
        lastDownloadAt: new Date(),
      },
    })

    // Redirect to the actual file URL (R2 signed URL)
    // For better security, you could generate a signed URL here instead of direct redirect
    return NextResponse.redirect(download.product.digitalFileUrl)
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    )
  }
}
