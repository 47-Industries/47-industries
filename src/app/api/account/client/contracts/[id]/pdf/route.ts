import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PDFDocument, rgb } from 'pdf-lib'

// GET /api/account/client/contracts/[id]/pdf - Get composed PDF with all signatures
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params

    // Get authenticated user
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's client
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { client: true },
    })

    if (!user?.client) {
      return NextResponse.json({ error: 'No client account linked' }, { status: 403 })
    }

    // Get contract with signature fields
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        signatureFields: {
          where: { isSigned: true },
          orderBy: [{ pageNumber: 'asc' }, { yPercent: 'asc' }],
        },
      },
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Verify contract belongs to this client
    if (contract.clientId !== user.client.id) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Get the original PDF URL
    const pdfUrl = contract.originalFileUrl || contract.fileUrl
    if (!pdfUrl) {
      return NextResponse.json({ error: 'No PDF file found for this contract' }, { status: 404 })
    }

    // Fetch the original PDF
    const pdfResponse = await fetch(pdfUrl)
    if (!pdfResponse.ok) {
      console.error('Failed to fetch PDF:', pdfResponse.status, pdfResponse.statusText)
      return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 500 })
    }

    const pdfBytes = await pdfResponse.arrayBuffer()
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const pages = pdfDoc.getPages()

    // Embed all signed signatures onto the PDF
    for (const field of contract.signatureFields) {
      const page = pages[field.pageNumber - 1]
      if (!page) continue

      const { width: pdfPageWidth, height: pdfPageHeight } = page.getSize()

      // Calculate position (percentages to absolute)
      const x = (field.xPercent / 100) * pdfPageWidth
      const y = pdfPageHeight - (field.yPercent / 100) * pdfPageHeight

      if (field.type === 'DATE' && field.signedValue) {
        // Draw date as text
        const fontSize = 12
        page.drawText(field.signedValue, {
          x: x - 50,
          y: y,
          size: fontSize,
          color: rgb(0, 0, 0),
        })
      } else if (field.signatureUrl) {
        try {
          // Fetch signature image
          let signatureData: ArrayBuffer
          if (field.signatureUrl.startsWith('data:image/')) {
            // It's a data URL
            const base64Data = field.signatureUrl.replace(/^data:image\/\w+;base64,/, '')
            signatureData = Buffer.from(base64Data, 'base64')
          } else {
            // It's a URL - fetch it
            const sigResponse = await fetch(field.signatureUrl)
            if (!sigResponse.ok) {
              console.error(`Failed to fetch signature: ${field.signatureUrl}`)
              continue
            }
            signatureData = await sigResponse.arrayBuffer()
          }

          // Determine image type and embed
          const isPng = field.signatureUrl.toLowerCase().includes('png')
          let image
          try {
            if (isPng || field.signatureUrl.startsWith('data:image/png')) {
              image = await pdfDoc.embedPng(signatureData)
            } else {
              image = await pdfDoc.embedJpg(signatureData)
            }
          } catch {
            // If specific format fails, try the other
            try {
              image = await pdfDoc.embedPng(signatureData)
            } catch {
              image = await pdfDoc.embedJpg(signatureData)
            }
          }

          // Calculate dimensions
          const aspectRatio = image.width / image.height
          const imgWidth = (field.widthPercent / 100) * pdfPageWidth
          const imgHeight = imgWidth / aspectRatio

          // Position (centered on the field position)
          const imgX = x - imgWidth / 2
          const imgY = y - imgHeight / 2

          page.drawImage(image, {
            x: Math.max(0, imgX),
            y: Math.max(0, imgY),
            width: imgWidth,
            height: imgHeight,
          })
        } catch (err) {
          console.error(`Failed to embed signature for field ${field.id}:`, err)
        }
      }
    }

    // Generate the composed PDF
    const composedPdfBytes = await pdfDoc.save()

    // Return the PDF
    return new NextResponse(composedPdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${contract.contractNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error composing PDF:', error)
    return NextResponse.json(
      { error: 'Failed to load PDF: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
