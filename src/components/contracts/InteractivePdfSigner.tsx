'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import SignaturePad from 'signature_pad'
import { PDFDocument, rgb } from 'pdf-lib'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

type SignatureType = 'signature' | 'initials' | 'date'
type CreateMode = 'draw' | 'type' | 'upload'

interface PlacedElement {
  id: string
  type: SignatureType
  pageNumber: number
  x: number // percentage from left
  y: number // percentage from top
  width: number // percentage of page width
  dataUrl?: string // For signature/initials images
  text?: string // For typed signatures or date
  signerName: string
  signerTitle: string
}

interface InteractivePdfSignerProps {
  pdfUrl: string
  contractTitle: string
  onSave: (signedPdfBlob: Blob, signerName: string, signerTitle: string, signatureDataUrl: string, initialsDataUrl?: string) => Promise<void>
  onClose: () => void
  existingSignatures?: PlacedElement[]
  initialSignerName?: string
  initialSignerTitle?: string
  initialSignatureDataUrl?: string | null
  initialInitialsDataUrl?: string | null
}

const SIGNATURE_FONTS = [
  { name: 'Dancing Script', style: 'cursive' },
  { name: 'Great Vibes', style: 'cursive' },
  { name: 'Allura', style: 'cursive' },
  { name: 'Pacifico', style: 'cursive' },
]

export default function InteractivePdfSigner({
  pdfUrl,
  contractTitle,
  onSave,
  onClose,
  existingSignatures = [],
  initialSignerName = '',
  initialSignerTitle = '',
  initialSignatureDataUrl = null,
  initialInitialsDataUrl = null,
}: InteractivePdfSignerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [pageWidth, setPageWidth] = useState(700)

  // Use proxy URL for display
  const proxyUrl = `/api/proxy/pdf?url=${encodeURIComponent(pdfUrl)}`

  // Signature/element state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createType, setCreateType] = useState<SignatureType>('signature')
  const [createMode, setCreateMode] = useState<CreateMode>('draw')
  const [clickPosition, setClickPosition] = useState<{ pageNumber: number; x: number; y: number } | null>(null)

  // Saved signature data
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(initialSignatureDataUrl)
  const [initialsDataUrl, setInitialsDataUrl] = useState<string | null>(initialInitialsDataUrl)
  const [signerName, setSignerName] = useState(initialSignerName)
  const [signerTitle, setSignerTitle] = useState(initialSignerTitle)

  // Placed elements
  const [placedElements, setPlacedElements] = useState<PlacedElement[]>(existingSignatures)

  // Dragging state
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Resizing state
  const [resizingId, setResizingId] = useState<string | null>(null)

  // Signature pad
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  // Typed signature
  const [typedText, setTypedText] = useState('')
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0].name)

  // Upload
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Saving state
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Load Google Fonts for typed signatures
  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&family=Allura&family=Pacifico&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [])

  // Calculate responsive page width
  useEffect(() => {
    const updateWidth = () => {
      const maxWidth = Math.min(window.innerWidth - 48, 800)
      setPageWidth(maxWidth)
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Initialize signature pad when modal opens with draw mode
  useEffect(() => {
    if (showCreateModal && createMode === 'draw' && canvasRef.current) {
      const initPad = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const container = canvas.parentElement
        const containerWidth = container?.clientWidth || 350
        const canvasHeight = 150

        const ratio = Math.max(window.devicePixelRatio || 1, 1)
        canvas.width = containerWidth * ratio
        canvas.height = canvasHeight * ratio
        canvas.style.width = `${containerWidth}px`
        canvas.style.height = `${canvasHeight}px`

        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.scale(ratio, ratio)
          ctx.fillStyle = 'rgb(255, 255, 255)'
          ctx.fillRect(0, 0, containerWidth, canvasHeight)
        }

        if (signaturePad) {
          signaturePad.off()
        }

        const pad = new SignaturePad(canvas, {
          backgroundColor: 'rgb(255, 255, 255)',
          penColor: 'rgb(0, 0, 0)',
          minWidth: 1,
          maxWidth: 3,
        })

        pad.addEventListener('endStroke', () => {
          setIsEmpty(pad.isEmpty())
        })

        setSignaturePad(pad)
        setIsEmpty(true)
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(initPad)
      })

      return () => {
        if (signaturePad) {
          signaturePad.off()
          setSignaturePad(null)
        }
      }
    }
  }, [showCreateModal, createMode])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
  }

  const generateId = () => `elem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const handlePageClick = (pageNumber: number, event: React.MouseEvent<HTMLDivElement>) => {
    // Don't place if we're dragging or resizing
    if (draggingId || resizingId) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    setClickPosition({ pageNumber, x, y })
    setShowCreateModal(true)
    setCreateType('signature')
    setCreateMode('draw')
    setTypedText(signerName || '')
  }

  const handleClearSignature = () => {
    signaturePad?.clear()
    setIsEmpty(true)
  }

  // Convert typed text to image
  const textToImage = (text: string, font: string, isInitials: boolean = false): string => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    const fontSize = isInitials ? 48 : 64
    ctx.font = `${fontSize}px "${font}", cursive`
    const metrics = ctx.measureText(text)

    const padding = 20
    canvas.width = metrics.width + padding * 2
    canvas.height = fontSize + padding * 2

    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.font = `${fontSize}px "${font}", cursive`
    ctx.fillStyle = 'black'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, padding, canvas.height / 2)

    return canvas.toDataURL('image/png')
  }

  const handleCreateElement = () => {
    if (!clickPosition) return

    let dataUrl: string | null = null
    let text: string | undefined

    if (createType === 'date') {
      text = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      dataUrl = textToImage(text, 'Arial', true)
    } else if (createMode === 'draw') {
      if (!signaturePad || isEmpty) return
      dataUrl = signaturePad.toDataURL('image/png')
    } else if (createMode === 'type') {
      if (!typedText.trim()) return
      dataUrl = textToImage(typedText, selectedFont, createType === 'initials')
      text = typedText
    }

    if (!dataUrl) return

    // Save to appropriate state
    if (createType === 'signature') {
      setSignatureDataUrl(dataUrl)
    } else if (createType === 'initials') {
      setInitialsDataUrl(dataUrl)
    }

    const newElement: PlacedElement = {
      id: generateId(),
      type: createType,
      pageNumber: clickPosition.pageNumber,
      x: clickPosition.x,
      y: clickPosition.y,
      width: createType === 'initials' || createType === 'date' ? 10 : 20,
      dataUrl,
      text,
      signerName: signerName.trim(),
      signerTitle: signerTitle.trim(),
    }

    setPlacedElements(prev => [...prev, newElement])
    setShowCreateModal(false)
    setClickPosition(null)
    setTypedText('')
  }

  const handleRemoveElement = (id: string) => {
    setPlacedElements(prev => prev.filter(el => el.id !== id))
  }

  // Drag handlers
  const handleDragStart = (id: string, e: React.MouseEvent, elementRect: DOMRect, pageRect: DOMRect) => {
    e.stopPropagation()
    e.preventDefault()

    const offsetX = e.clientX - elementRect.left - elementRect.width / 2
    const offsetY = e.clientY - elementRect.top - elementRect.height / 2

    setDraggingId(id)
    setDragOffset({ x: offsetX, y: offsetY })
  }

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!draggingId) return

    const pageElements = document.querySelectorAll('[data-page-number]')
    let foundPage: Element | null = null
    let pageNumber = 0

    pageElements.forEach(el => {
      const rect = el.getBoundingClientRect()
      if (e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top && e.clientY <= rect.bottom) {
        foundPage = el
        pageNumber = parseInt(el.getAttribute('data-page-number') || '0')
      }
    })

    if (foundPage && pageNumber > 0) {
      const rect = foundPage.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100

      setPlacedElements(prev => prev.map(el =>
        el.id === draggingId
          ? { ...el, pageNumber, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) }
          : el
      ))
    }
  }, [draggingId])

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
    setDragOffset({ x: 0, y: 0 })
  }, [])

  // Resize handlers
  const handleResizeStart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setResizingId(id)
  }

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingId) return

    const element = placedElements.find(el => el.id === resizingId)
    if (!element) return

    const pageEl = document.querySelector(`[data-page-number="${element.pageNumber}"]`)
    if (!pageEl) return

    const pageRect = pageEl.getBoundingClientRect()
    const elementEl = document.querySelector(`[data-element-id="${resizingId}"]`)
    if (!elementEl) return

    const elemRect = elementEl.getBoundingClientRect()
    const newWidth = ((e.clientX - elemRect.left) / pageRect.width) * 100

    setPlacedElements(prev => prev.map(el =>
      el.id === resizingId
        ? { ...el, width: Math.max(5, Math.min(40, newWidth * 2)) }
        : el
    ))
  }, [resizingId, placedElements])

  const handleResizeEnd = useCallback(() => {
    setResizingId(null)
  }, [])

  // Global mouse event handlers
  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleDragMove)
      window.addEventListener('mouseup', handleDragEnd)
      return () => {
        window.removeEventListener('mousemove', handleDragMove)
        window.removeEventListener('mouseup', handleDragEnd)
      }
    }
  }, [draggingId, handleDragMove, handleDragEnd])

  useEffect(() => {
    if (resizingId) {
      window.addEventListener('mousemove', handleResizeMove)
      window.addEventListener('mouseup', handleResizeEnd)
      return () => {
        window.removeEventListener('mousemove', handleResizeMove)
        window.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [resizingId, handleResizeMove, handleResizeEnd])

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string

      if (createType === 'signature') {
        setSignatureDataUrl(dataUrl)
      } else {
        setInitialsDataUrl(dataUrl)
      }

      if (clickPosition) {
        const newElement: PlacedElement = {
          id: generateId(),
          type: createType,
          pageNumber: clickPosition.pageNumber,
          x: clickPosition.x,
          y: clickPosition.y,
          width: createType === 'initials' ? 10 : 20,
          dataUrl,
          signerName: signerName.trim(),
          signerTitle: signerTitle.trim(),
        }
        setPlacedElements(prev => [...prev, newElement])
        setShowCreateModal(false)
        setClickPosition(null)
      }
    }
    reader.readAsDataURL(file)
  }

  // Quick place saved signature/initials
  const handleQuickPlace = (type: SignatureType) => {
    const dataUrl = type === 'signature' ? signatureDataUrl : initialsDataUrl
    if (!dataUrl || !clickPosition) return

    const newElement: PlacedElement = {
      id: generateId(),
      type,
      pageNumber: clickPosition.pageNumber,
      x: clickPosition.x,
      y: clickPosition.y,
      width: type === 'initials' ? 10 : 20,
      dataUrl,
      signerName: signerName.trim(),
      signerTitle: signerTitle.trim(),
    }

    setPlacedElements(prev => [...prev, newElement])
    setShowCreateModal(false)
    setClickPosition(null)
  }

  const handleSave = async () => {
    const signatureElements = placedElements.filter(el => el.type === 'signature')
    if (signatureElements.length === 0 || !signatureDataUrl || !signerName || !signerTitle) {
      setError('Please place at least one signature on the document')
      return
    }

    try {
      setSaving(true)
      setError('')

      const response = await fetch(proxyUrl)
      if (!response.ok) throw new Error('Failed to fetch PDF for signing')
      const pdfBytes = await response.arrayBuffer()

      const pdfDoc = await PDFDocument.load(pdfBytes)
      const pages = pdfDoc.getPages()

      // Process each placed element
      for (const elem of placedElements) {
        const page = pages[elem.pageNumber - 1]
        if (!page || !elem.dataUrl) continue

        const { width: pdfPageWidth, height: pdfPageHeight } = page.getSize()

        if (elem.type === 'date' && elem.text) {
          // Draw date as text
          const fontSize = 12
          const x = (elem.x / 100) * pdfPageWidth
          const y = pdfPageHeight - (elem.y / 100) * pdfPageHeight

          page.drawText(elem.text, {
            x: x - 50,
            y: y,
            size: fontSize,
            color: rgb(0, 0, 0),
          })
        } else {
          // Embed image
          const image = elem.dataUrl.startsWith('data:image/png')
            ? await pdfDoc.embedPng(elem.dataUrl)
            : await pdfDoc.embedJpg(elem.dataUrl)

          const aspectRatio = image.width / image.height
          const imgWidth = (elem.width / 100) * pdfPageWidth
          const imgHeight = imgWidth / aspectRatio

          const x = (elem.x / 100) * pdfPageWidth - imgWidth / 2
          const y = pdfPageHeight - (elem.y / 100) * pdfPageHeight - imgHeight / 2

          page.drawImage(image, {
            x: Math.max(0, x),
            y: Math.max(0, y),
            width: imgWidth,
            height: imgHeight,
          })
        }
      }

      const modifiedPdfBytes = await pdfDoc.save()
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' })

      await onSave(blob, signerName.trim(), signerTitle.trim(), signatureDataUrl, initialsDataUrl || undefined)
    } catch (err) {
      console.error('Error saving signed PDF:', err)
      setError(err instanceof Error ? err.message : 'Failed to save signed PDF')
      setSaving(false)
    }
  }

  const resetSignature = () => {
    setSignatureDataUrl(null)
    setInitialsDataUrl(null)
    setSignerName('')
    setSignerTitle('')
    setPlacedElements([])
    setSignaturePad(null)
    setIsEmpty(true)
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-50">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white">Sign Document</h2>
          <p className="text-zinc-400 text-sm">{contractTitle}</p>
        </div>
        <div className="flex items-center gap-4">
          {signerName && (
            <div className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded-lg">
              <span className="text-sm text-zinc-400">Signing as:</span>
              <span className="text-sm text-white font-medium">{signerName}{signerTitle ? `, ${signerTitle}` : ''}</span>
              <button onClick={resetSignature} className="text-zinc-500 hover:text-white ml-2" title="Reset">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-2" disabled={saving}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-500/10 border-b border-blue-500/30 px-6 py-3 shrink-0">
        <p className="text-blue-400 text-sm">
          Click anywhere on the document to add signatures, initials, or dates. Drag elements to reposition them.
        </p>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-zinc-950 p-4">
        <div className="flex flex-col items-center">
          {loading && (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-zinc-400">Loading document...</p>
            </div>
          )}

          <Document
            file={proxyUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(err) => {
              console.error('PDF load error:', err)
              setError(`Failed to load PDF: ${err.message}`)
              setLoading(false)
            }}
            loading={null}
            className="flex flex-col items-center gap-4"
          >
            {Array.from(new Array(numPages), (_, index) => (
              <div
                key={`page_${index + 1}`}
                data-page-number={index + 1}
                className="relative bg-white shadow-xl cursor-crosshair"
                onClick={(e) => handlePageClick(index + 1, e)}
              >
                <Page
                  pageNumber={index + 1}
                  width={pageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />

                {/* Render placed elements */}
                {placedElements
                  .filter(elem => elem.pageNumber === index + 1)
                  .map((elem) => (
                    <div
                      key={elem.id}
                      data-element-id={elem.id}
                      className={`absolute group select-none ${draggingId === elem.id ? 'cursor-grabbing z-50' : 'cursor-grab'}`}
                      style={{
                        left: `${elem.x}%`,
                        top: `${elem.y}%`,
                        transform: 'translate(-50%, -50%)',
                        width: `${elem.width}%`,
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const pageEl = e.currentTarget.closest('[data-page-number]')
                        if (pageEl) {
                          handleDragStart(elem.id, e, rect, pageEl.getBoundingClientRect())
                        }
                      }}
                    >
                      {elem.dataUrl && (
                        <img
                          src={elem.dataUrl}
                          alt={`${elem.type} by ${elem.signerName}`}
                          className="w-full h-auto pointer-events-none"
                          draggable={false}
                        />
                      )}

                      {/* Border on hover */}
                      <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500 rounded pointer-events-none" />

                      {/* Remove button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveElement(elem.id) }}
                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        title="Remove"
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      {/* Resize handle */}
                      <div
                        className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 cursor-se-resize shadow-lg"
                        onMouseDown={(e) => handleResizeStart(elem.id, e)}
                      />

                      {/* Type label */}
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-zinc-500 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                        {elem.type === 'signature' ? 'Signature' : elem.type === 'initials' ? 'Initials' : 'Date'}
                      </div>
                    </div>
                  ))}

                {/* Page number */}
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  Page {index + 1} of {numPages}
                </div>
              </div>
            ))}
          </Document>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-zinc-900 border-t border-zinc-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="text-sm text-zinc-400">
          {placedElements.length > 0
            ? `${placedElements.filter(e => e.type === 'signature').length} signature(s), ${placedElements.filter(e => e.type === 'initials').length} initials, ${placedElements.filter(e => e.type === 'date').length} date(s)`
            : 'No elements placed'}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors font-medium"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={placedElements.filter(e => e.type === 'signature').length === 0 || saving}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              placedElements.filter(e => e.type === 'signature').length > 0 && !saving
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Save Signed PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Create Element Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4">
          <div className="bg-zinc-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white">Add Element</h3>
              <p className="text-zinc-400 text-sm mt-1">Choose what to add to the document</p>
            </div>

            <div className="p-6">
              {/* Signer Info */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Full Legal Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Kyle Rivers"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Title / Position <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={signerTitle}
                    onChange={(e) => setSignerTitle(e.target.value)}
                    placeholder="President, CEO, etc."
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Element Type Tabs */}
              <div className="flex gap-2 mb-6">
                {(['signature', 'initials', 'date'] as SignatureType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setCreateType(type)
                      if (type === 'date') setCreateMode('type')
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                      createType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {createType === 'date' ? (
                <div className="mb-6 p-4 bg-zinc-800 rounded-lg text-center">
                  <p className="text-zinc-400 text-sm mb-2">Date will be added:</p>
                  <p className="text-white text-lg font-medium">
                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              ) : (
                <>
                  {/* Quick place saved signature/initials */}
                  {((createType === 'signature' && signatureDataUrl) || (createType === 'initials' && initialsDataUrl)) && (
                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-400 font-medium">Use saved {createType}</p>
                          <p className="text-zinc-400 text-sm">Click to place your existing {createType}</p>
                        </div>
                        <button
                          onClick={() => handleQuickPlace(createType)}
                          disabled={!signerName.trim() || !signerTitle.trim()}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-zinc-700 disabled:text-zinc-500"
                        >
                          Place {createType}
                        </button>
                      </div>
                      <div className="mt-3 bg-white rounded p-2 inline-block">
                        <img
                          src={createType === 'signature' ? signatureDataUrl! : initialsDataUrl!}
                          alt={`Saved ${createType}`}
                          className="h-12 w-auto"
                        />
                      </div>
                    </div>
                  )}

                  {/* Creation Mode Tabs */}
                  <div className="flex gap-2 mb-4">
                    {(['draw', 'type', 'upload'] as CreateMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setCreateMode(mode)}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                          createMode === mode
                            ? 'bg-zinc-700 text-white'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  {/* Draw Mode */}
                  {createMode === 'draw' && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-zinc-400">
                          Draw Your {createType === 'signature' ? 'Signature' : 'Initials'}
                        </label>
                        <button onClick={handleClearSignature} className="text-sm text-zinc-500 hover:text-zinc-300">
                          Clear
                        </button>
                      </div>
                      <div className="bg-white rounded-lg border-2 border-zinc-700 overflow-hidden" style={{ touchAction: 'none' }}>
                        <canvas ref={canvasRef} className="cursor-crosshair" style={{ display: 'block', touchAction: 'none' }} />
                      </div>
                    </div>
                  )}

                  {/* Type Mode */}
                  {createMode === 'type' && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-zinc-400 mb-2">
                        Type Your {createType === 'signature' ? 'Signature' : 'Initials'}
                      </label>
                      <input
                        type="text"
                        value={typedText}
                        onChange={(e) => setTypedText(e.target.value)}
                        placeholder={createType === 'initials' ? 'KR' : signerName || 'Your Name'}
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 mb-4"
                      />

                      <label className="block text-sm font-medium text-zinc-400 mb-2">Font Style</label>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {SIGNATURE_FONTS.map((font) => (
                          <button
                            key={font.name}
                            onClick={() => setSelectedFont(font.name)}
                            className={`p-3 rounded-lg border-2 transition-colors ${
                              selectedFont === font.name
                                ? 'border-blue-500 bg-zinc-800'
                                : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                            }`}
                          >
                            <span
                              style={{ fontFamily: `"${font.name}", ${font.style}`, fontSize: '20px' }}
                              className="text-white"
                            >
                              {typedText || (createType === 'initials' ? 'KR' : 'Preview')}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Mode */}
                  {createMode === 'upload' && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-zinc-400 mb-2">
                        Upload {createType === 'signature' ? 'Signature' : 'Initials'} Image
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-8 border-2 border-dashed border-zinc-700 rounded-lg text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Click to upload image
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowCreateModal(false); setClickPosition(null) }}
                  className="flex-1 px-6 py-3 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateElement}
                  disabled={
                    !signerName.trim() ||
                    !signerTitle.trim() ||
                    (createType !== 'date' && createMode === 'draw' && isEmpty) ||
                    (createType !== 'date' && createMode === 'type' && !typedText.trim())
                  }
                  className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                    signerName.trim() && signerTitle.trim() &&
                    (createType === 'date' ||
                     (createMode === 'draw' && !isEmpty) ||
                     (createMode === 'type' && typedText.trim()) ||
                     createMode === 'upload')
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  Place {createType === 'date' ? 'Date' : createType === 'signature' ? 'Signature' : 'Initials'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  )
}
