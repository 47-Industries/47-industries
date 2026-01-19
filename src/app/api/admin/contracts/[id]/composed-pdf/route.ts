import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PDFDocument, rgb } from 'pdf-lib'

// GET /api/admin/contracts/[id]/composed-pdf - Generate PDF with all signatures composited
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

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get contract with signature fields and legacy signature URLs
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

    console.log('[Admin PDF Compose] Contract:', contractId)
    console.log('[Admin PDF Compose] Signature fields:', contract.signatureFields.length)
    console.log('[Admin PDF Compose] Legacy signatureUrl:', contract.signatureUrl ? 'present' : 'missing')
    console.log('[Admin PDF Compose] Legacy countersignatureUrl:', contract.countersignatureUrl ? 'present' : 'missing')

    // Get the original PDF URL (never the signed version)
    const pdfUrl = contract.originalFileUrl || contract.fileUrl
    if (!pdfUrl) {
      return NextResponse.json({ error: 'No PDF file found for this contract' }, { status: 404 })
    }

    // Fetch the original PDF
    const pdfResponse = await fetch(pdfUrl)
    if (!pdfResponse.ok) {
      console.error('Failed to fetch PDF:', pdfResponse.status, pdfResponse.statusText)
      return NextResponse.json({ error: 'Failed to fetch original PDF' }, { status: 500 })
    }

    const pdfBytes = await pdfResponse.arrayBuffer()
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const pages = pdfDoc.getPages()

    // Helper to check if signedByName indicates an admin
    const isAdminSigner = (name: string | null) => {
      if (!name) return false
      const lowerName = name.toLowerCase()
      return lowerName.includes('kyle') || lowerName.includes('rivers') || lowerName.includes('admin')
    }

    // Embed all signed signatures onto the PDF
    for (const field of contract.signatureFields) {
      const page = pages[field.pageNumber - 1]
      if (!page) continue

      // For ADMIN-assigned fields, check if we should use legacy countersignatureUrl instead
      // This handles cases where admin signed via legacy flow but field was signed by wrong person
      if (field.assignedTo?.toUpperCase() === 'ADMIN' && contract.countersignatureUrl) {
        // If the field was NOT signed by an actual admin, skip it - we'll use legacy below
        if (!isAdminSigner(field.signedByName)) {
          console.log(`[Admin PDF Compose] Field ${field.id}: ADMIN field signed by non-admin (${field.signedByName}), will use legacy countersignatureUrl`)
          continue
        }
      }

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

          // Detect image format from actual bytes (PNG starts with 0x89504E47)
          const bytes = new Uint8Array(signatureData)
          const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47
          console.log(`[Admin PDF Compose] Field ${field.id}: Detected format: ${isPng ? 'PNG' : 'JPEG'}`)

          let image
          try {
            if (isPng) {
              image = await pdfDoc.embedPng(signatureData)
            } else {
              image = await pdfDoc.embedJpg(signatureData)
            }
          } catch (formatError) {
            console.log(`[Admin PDF Compose] Field ${field.id}: Primary format failed, trying alternate...`)
            // If specific format fails, try the other
            try {
              image = isPng ? await pdfDoc.embedJpg(signatureData) : await pdfDoc.embedPng(signatureData)
            } catch {
              console.error(`[Admin PDF Compose] Field ${field.id}: Both formats failed`)
              continue
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

    // Helper function to embed a signature image
    const embedSignatureImage = async (
      sigUrl: string,
      targetPage: typeof pages[0],
      xPercent: number,
      yPercent: number,
      widthPercent: number = 20
    ) => {
      try {
        let sigData: ArrayBuffer
        if (sigUrl.startsWith('data:image/')) {
          const base64 = sigUrl.replace(/^data:image\/\w+;base64,/, '')
          sigData = Buffer.from(base64, 'base64')
        } else {
          const res = await fetch(sigUrl)
          if (!res.ok) throw new Error('Failed to fetch')
          sigData = await res.arrayBuffer()
        }

        const sigBytes = new Uint8Array(sigData)
        const isPng = sigBytes[0] === 0x89 && sigBytes[1] === 0x50 && sigBytes[2] === 0x4E && sigBytes[3] === 0x47

        let image
        try {
          image = isPng ? await pdfDoc.embedPng(sigData) : await pdfDoc.embedJpg(sigData)
        } catch {
          image = isPng ? await pdfDoc.embedJpg(sigData) : await pdfDoc.embedPng(sigData)
        }

        const { width: pw, height: ph } = targetPage.getSize()
        const aspectRatio = image.width / image.height
        const imgWidth = pw * (widthPercent / 100)
        const imgHeight = imgWidth / aspectRatio
        const x = (pw * (xPercent / 100)) - (imgWidth / 2)
        const y = ph - (ph * (yPercent / 100)) - (imgHeight / 2)

        targetPage.drawImage(image, {
          x: Math.max(0, x),
          y: Math.max(0, y),
          width: imgWidth,
          height: imgHeight,
        })
        return true
      } catch (err) {
        console.error('[Admin PDF Compose] Failed to embed legacy signature:', err)
        return false
      }
    }

    // Fallback: Draw legacy countersignature (admin) if needed
    // This runs if: no admin field exists, OR admin field was signed by non-admin
    const adminField = contract.signatureFields.find(f => f.assignedTo?.toUpperCase() === 'ADMIN')
    const hasRealAdminSignature = contract.signatureFields.some(f =>
      f.assignedTo?.toUpperCase() === 'ADMIN' && isAdminSigner(f.signedByName)
    )

    if (!hasRealAdminSignature && contract.countersignatureUrl) {
      console.log('[Admin PDF Compose] No real admin signature in fields, using legacy countersignatureUrl')
      // Use admin field position if it exists, otherwise use default position
      const xPos = adminField?.xPercent ?? 20.5
      const yPos = adminField?.yPercent ?? 22.7
      const widthPos = adminField?.widthPercent ?? 20
      const pageNum = adminField?.pageNumber ?? Math.min(4, pages.length)
      const targetPage = pages[pageNum - 1]
      await embedSignatureImage(contract.countersignatureUrl, targetPage, xPos, yPos, widthPos)
    }

    // Fallback: Draw legacy client signature if no client signature field exists
    const hasClientSignature = contract.signatureFields.some(f =>
      f.assignedTo?.toUpperCase() === 'CLIENT' || (f.signedByName && !f.signedByName.toLowerCase().includes('kyle'))
    )

    if (!hasClientSignature && contract.signatureUrl) {
      console.log('[Admin PDF Compose] No client signature field, using legacy signatureUrl')
      const lastPage = pages[Math.min(3, pages.length - 1)]
      await embedSignatureImage(contract.signatureUrl, lastPage, 64.25, 22.7, 20)
    }

    // Generate the composed PDF
    const composedPdfBytes = await pdfDoc.save()

    // Return the PDF
    return new NextResponse(composedPdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${contract.contractNumber}-signed.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error composing PDF:', error)
    return NextResponse.json(
      { error: 'Failed to compose PDF: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
