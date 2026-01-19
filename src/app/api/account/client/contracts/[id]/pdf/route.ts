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

    // Also fetch legacy signature URLs from the contract
    const contractLegacy = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        signatureUrl: true,
        countersignatureUrl: true,
      },
    })

    console.log('[PDF Compose] Contract ID:', contractId)
    console.log('[PDF Compose] Signature fields (isSigned=true) found:', contract?.signatureFields?.length || 0)
    console.log('[PDF Compose] Legacy signatureUrl:', contractLegacy?.signatureUrl ? 'present (' + contractLegacy.signatureUrl.length + ' chars)' : 'missing')
    console.log('[PDF Compose] Legacy countersignatureUrl:', contractLegacy?.countersignatureUrl ? 'present (' + contractLegacy.countersignatureUrl.length + ' chars)' : 'missing')
    contract?.signatureFields?.forEach((f, i) => {
      console.log(`[PDF Compose] Field ${i + 1}:`, {
        id: f.id,
        type: f.type,
        signedBy: f.signedByName,
        page: f.pageNumber,
        x: f.xPercent,
        y: f.yPercent,
        width: f.widthPercent,
        hasUrl: !!f.signatureUrl,
        urlLength: f.signatureUrl?.length || 0,
        urlPrefix: f.signatureUrl?.substring(0, 80),
      })
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

    // If no signature fields but we have legacy signatureUrl/countersignatureUrl, use those
    // This is a fallback for contracts signed before the new system
    if (contract.signatureFields.length === 0) {
      console.log('[PDF Compose] No signature fields, checking legacy fields...')
      console.log('[PDF Compose] Legacy signatureUrl:', contract.signatureUrl ? 'present' : 'missing')
      console.log('[PDF Compose] Legacy countersignatureUrl:', contract.countersignatureUrl ? 'present' : 'missing')
    }

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
          console.log(`[PDF Compose] Processing signature for field ${field.id}`)
          // Fetch signature image
          let signatureData: ArrayBuffer
          if (field.signatureUrl.startsWith('data:image/')) {
            // It's a data URL
            console.log(`[PDF Compose] Field ${field.id}: Using data URL`)
            const base64Data = field.signatureUrl.replace(/^data:image\/\w+;base64,/, '')
            signatureData = Buffer.from(base64Data, 'base64')
            console.log(`[PDF Compose] Field ${field.id}: Data URL decoded, size: ${signatureData.byteLength}`)
          } else {
            // It's a URL - fetch it
            console.log(`[PDF Compose] Field ${field.id}: Fetching URL: ${field.signatureUrl.substring(0, 80)}`)
            const sigResponse = await fetch(field.signatureUrl)
            if (!sigResponse.ok) {
              console.error(`[PDF Compose] Field ${field.id}: Failed to fetch signature: ${sigResponse.status} ${sigResponse.statusText}`)
              continue
            }
            signatureData = await sigResponse.arrayBuffer()
            console.log(`[PDF Compose] Field ${field.id}: Fetched, size: ${signatureData.byteLength}`)
          }

          // Detect image format from actual bytes (PNG starts with 0x89504E47)
          const bytes = new Uint8Array(signatureData)
          const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47
          console.log(`[PDF Compose] Field ${field.id}: Detected format: ${isPng ? 'PNG' : 'JPEG'} (first bytes: ${bytes[0]?.toString(16)}, ${bytes[1]?.toString(16)})`)

          let image
          try {
            if (isPng) {
              image = await pdfDoc.embedPng(signatureData)
            } else {
              image = await pdfDoc.embedJpg(signatureData)
            }
          } catch (formatError) {
            console.log(`[PDF Compose] Field ${field.id}: Primary format failed, trying alternate...`)
            // If specific format fails, try the other
            try {
              image = isPng ? await pdfDoc.embedJpg(signatureData) : await pdfDoc.embedPng(signatureData)
            } catch {
              console.error(`[PDF Compose] Field ${field.id}: Both formats failed`)
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

          console.log(`[PDF Compose] Field ${field.id}: Drawing at (${Math.max(0, imgX).toFixed(1)}, ${Math.max(0, imgY).toFixed(1)}) size: ${imgWidth.toFixed(1)}x${imgHeight.toFixed(1)}`)
          page.drawImage(image, {
            x: Math.max(0, imgX),
            y: Math.max(0, imgY),
            width: imgWidth,
            height: imgHeight,
          })
          console.log(`[PDF Compose] Field ${field.id}: Successfully embedded`)
        } catch (err) {
          console.error(`[PDF Compose] Failed to embed signature for field ${field.id}:`, err)
        }
      }
    }

    // Check if we need to draw legacy signatures (fallback for contracts signed before new system)
    // The admin's countersignature might only be in the legacy field
    const hasAdminSignature = contract.signatureFields.some(f =>
      f.assignedTo?.toUpperCase() === 'ADMIN' || f.signedByName?.toLowerCase().includes('kyle')
    )

    if (!hasAdminSignature && contractLegacy?.countersignatureUrl) {
      console.log('[PDF Compose] No admin signature field found, using legacy countersignatureUrl')
      try {
        // Fetch the legacy countersignature
        let sigData: ArrayBuffer
        if (contractLegacy.countersignatureUrl.startsWith('data:image/')) {
          const base64 = contractLegacy.countersignatureUrl.replace(/^data:image\/\w+;base64,/, '')
          sigData = Buffer.from(base64, 'base64')
        } else {
          const res = await fetch(contractLegacy.countersignatureUrl)
          if (res.ok) {
            sigData = await res.arrayBuffer()
          } else {
            throw new Error('Failed to fetch countersignature')
          }
        }

        // Detect format from bytes
        const sigBytes = new Uint8Array(sigData)
        const isPng = sigBytes[0] === 0x89 && sigBytes[1] === 0x50 && sigBytes[2] === 0x4E && sigBytes[3] === 0x47
        console.log(`[PDF Compose] Legacy countersig format: ${isPng ? 'PNG' : 'JPEG'}`)

        let image
        try {
          image = isPng ? await pdfDoc.embedPng(sigData) : await pdfDoc.embedJpg(sigData)
        } catch {
          image = isPng ? await pdfDoc.embedJpg(sigData) : await pdfDoc.embedPng(sigData)
        }

        // Draw at LEFT side of signature area (under "47 INDUSTRIES LLC")
        // Use last page if contract doesn't have 4 pages
        const lastPage = pages[Math.min(3, pages.length - 1)]
        const { width: pw, height: ph } = lastPage.getSize()

        const aspectRatio = image.width / image.height
        const imgWidth = pw * 0.2 // 20% of page width
        const imgHeight = imgWidth / aspectRatio

        // Position: LEFT side (around 20.5%), about 23% from top - under "47 INDUSTRIES LLC"
        const x = (pw * 0.205) - (imgWidth / 2)
        const y = ph - (ph * 0.227) - (imgHeight / 2)

        console.log(`[PDF Compose] Drawing legacy countersig at (${x.toFixed(1)}, ${y.toFixed(1)})`)
        lastPage.drawImage(image, {
          x: Math.max(0, x),
          y: Math.max(0, y),
          width: imgWidth,
          height: imgHeight,
        })
        console.log('[PDF Compose] Legacy countersig embedded successfully')
      } catch (err) {
        console.error('[PDF Compose] Failed to embed legacy countersignature:', err)
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
