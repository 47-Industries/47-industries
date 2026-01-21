import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PDFDocument, rgb } from 'pdf-lib'

// GET /api/admin/partners/[id]/contract/composed-pdf - Generate PDF with all signatures composited
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: partnerId } = await params

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

    // Get partner with contract and signature fields
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        contract: {
          include: {
            signatureFields: {
              where: { isSigned: true },
              orderBy: [{ pageNumber: 'asc' }, { yPercent: 'asc' }],
            },
          },
        },
      },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    if (!partner.contract) {
      return NextResponse.json({ error: 'No contract found for this partner' }, { status: 404 })
    }

    const contract = partner.contract

    console.log('[Partner PDF Compose] Partner:', partnerId)
    console.log('[Partner PDF Compose] Signature fields:', contract.signatureFields?.length || 0)
    console.log('[Partner PDF Compose] Legacy signatureUrl:', contract.signatureUrl ? 'present' : 'missing')
    console.log('[Partner PDF Compose] Legacy countersignatureUrl:', contract.countersignatureUrl ? 'present' : 'missing')

    // Get the PDF URL
    const pdfUrl = contract.fileUrl
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
          if (!res.ok) throw new Error('Failed to fetch signature image')
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
        console.error('[Partner PDF Compose] Failed to embed signature:', err)
        return false
      }
    }

    // Embed signature fields first (if any)
    if (contract.signatureFields && contract.signatureFields.length > 0) {
      for (const field of contract.signatureFields) {
        const page = pages[field.pageNumber - 1]
        if (!page) continue

        const { width: pdfPageWidth, height: pdfPageHeight } = page.getSize()
        const x = (field.xPercent / 100) * pdfPageWidth
        const y = pdfPageHeight - (field.yPercent / 100) * pdfPageHeight

        if (field.type === 'DATE' && field.signedValue) {
          page.drawText(field.signedValue, {
            x: x - 50,
            y: y,
            size: 12,
            color: rgb(0, 0, 0),
          })
        } else if (field.signatureUrl) {
          try {
            let signatureData: ArrayBuffer
            if (field.signatureUrl.startsWith('data:image/')) {
              const base64Data = field.signatureUrl.replace(/^data:image\/\w+;base64,/, '')
              signatureData = Buffer.from(base64Data, 'base64')
            } else {
              const sigResponse = await fetch(field.signatureUrl)
              if (!sigResponse.ok) continue
              signatureData = await sigResponse.arrayBuffer()
            }

            const bytes = new Uint8Array(signatureData)
            const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47

            let image
            try {
              image = isPng ? await pdfDoc.embedPng(signatureData) : await pdfDoc.embedJpg(signatureData)
            } catch {
              try {
                image = isPng ? await pdfDoc.embedJpg(signatureData) : await pdfDoc.embedPng(signatureData)
              } catch {
                continue
              }
            }

            const aspectRatio = image.width / image.height
            const imgWidth = (field.widthPercent / 100) * pdfPageWidth
            const imgHeight = imgWidth / aspectRatio

            page.drawImage(image, {
              x: Math.max(0, x - imgWidth / 2),
              y: Math.max(0, y - imgHeight / 2),
              width: imgWidth,
              height: imgHeight,
            })
          } catch (err) {
            console.error(`Failed to embed signature for field ${field.id}:`, err)
          }
        }
      }
    }

    // Check if we have signature fields for partner and admin
    const hasPartnerFieldSig = contract.signatureFields?.some(f =>
      f.assignedTo?.toUpperCase() === 'PARTNER' || f.assignedTo?.toUpperCase() === 'CLIENT'
    )
    const hasAdminFieldSig = contract.signatureFields?.some(f =>
      f.assignedTo?.toUpperCase() === 'ADMIN'
    )

    // Use default positions for legacy signatures (last page, common positions)
    const lastPage = pages[pages.length - 1]

    // Embed partner's legacy signature if no field signature exists
    if (!hasPartnerFieldSig && contract.signatureUrl) {
      console.log('[Partner PDF Compose] Using legacy partner signatureUrl')
      await embedSignatureImage(contract.signatureUrl, lastPage, 30, 80, 20)
    }

    // Embed admin's legacy countersignature if no field signature exists
    if (!hasAdminFieldSig && contract.countersignatureUrl) {
      console.log('[Partner PDF Compose] Using legacy admin countersignatureUrl')
      await embedSignatureImage(contract.countersignatureUrl, lastPage, 70, 80, 20)
    }

    // Generate the composed PDF
    const composedPdfBytes = await pdfDoc.save()

    // Return the PDF
    return new NextResponse(composedPdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${partner.partnerNumber}-contract-signed.pdf"`,
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
