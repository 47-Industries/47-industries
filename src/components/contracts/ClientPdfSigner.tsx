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
type CreateMode = 'draw' | 'type'

export interface SignatureField {
  id: string
  type: string
  pageNumber: number
  xPercent: number
  yPercent: number
  widthPercent: number
  heightPercent: number
  assignedTo: string
  label?: string | null
  isSigned: boolean
  signatureUrl?: string | null
  signedValue?: string | null
  signedByName?: string | null
  signedAt?: string | null
}

interface ClientPdfSignerProps {
  pdfUrl: string
  contractTitle: string
  signatureFields: SignatureField[] // Fields designated for this signer
  signerRole: 'CLIENT' | 'PARTNER' // Who is signing
  onSave: (
    signedPdfBlob: Blob,
    signerName: string,
    signerTitle: string,
    signerCompany: string,
    signerEmail: string,
    signedFields: Array<{ fieldId: string; signatureDataUrl: string; value?: string }>
  ) => Promise<void>
  onClose: () => void
  initialSignerName?: string
  initialSignerEmail?: string
}

const SIGNATURE_FONTS = [
  { name: 'Dancing Script', style: 'cursive' },
  { name: 'Great Vibes', style: 'cursive' },
  { name: 'Allura', style: 'cursive' },
  { name: 'Pacifico', style: 'cursive' },
]

// Color scheme for signature fields
const FIELD_COLORS = {
  unsigned: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-500' },
  signed: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-500' },
  other: { bg: 'bg-zinc-500/20', border: 'border-zinc-500', text: 'text-zinc-500' },
}

export default function ClientPdfSigner({
  pdfUrl,
  contractTitle,
  signatureFields,
  signerRole,
  onSave,
  onClose,
  initialSignerName = '',
  initialSignerEmail = '',
}: ClientPdfSignerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [pageWidth, setPageWidth] = useState(700)

  // Use proxy URL for display
  const proxyUrl = `/api/proxy/pdf?url=${encodeURIComponent(pdfUrl)}`

  // Signer info
  const [signerName, setSignerName] = useState(initialSignerName)
  const [signerTitle, setSignerTitle] = useState('')
  const [signerCompany, setSignerCompany] = useState('')
  const [signerEmail, setSignerEmail] = useState(initialSignerEmail)

  // Track which fields have been signed (locally, before save)
  const [signedFieldsMap, setSignedFieldsMap] = useState<
    Record<string, { dataUrl: string; value?: string }>
  >({})

  // Saved signature/initials for quick placement
  const [savedSignatureDataUrl, setSavedSignatureDataUrl] = useState<string | null>(null)
  const [savedInitialsDataUrl, setSavedInitialsDataUrl] = useState<string | null>(null)

  // Modal state
  const [showSignModal, setShowSignModal] = useState(false)
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)
  const [createMode, setCreateMode] = useState<CreateMode>('draw')

  // Signature pad
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  // Typed signature
  const [typedText, setTypedText] = useState('')
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0].name)

  // Saving state
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Get the active field being signed
  const activeField = signatureFields.find(f => f.id === activeFieldId)

  // Filter fields for current signer
  const myFields = signatureFields.filter(f => f.assignedTo === signerRole)
  const otherFields = signatureFields.filter(f => f.assignedTo !== signerRole)

  // Check if all my fields are signed
  const allMyFieldsSigned = myFields.every(f => f.isSigned || signedFieldsMap[f.id])
  const signedCount = myFields.filter(f => f.isSigned || signedFieldsMap[f.id]).length

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
    if (showSignModal && createMode === 'draw' && canvasRef.current) {
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
  }, [showSignModal, createMode])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
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

  const handleClearSignature = () => {
    signaturePad?.clear()
    setIsEmpty(true)
  }

  const handleFieldClick = (field: SignatureField) => {
    // Can only sign unsigned fields assigned to me
    if (field.assignedTo !== signerRole || field.isSigned || signedFieldsMap[field.id]) return

    setActiveFieldId(field.id)
    setShowSignModal(true)
    setCreateMode('draw')

    // Pre-fill typed text for initials
    if (field.type.toLowerCase() === 'initials' && signerName) {
      const initials = signerName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
      setTypedText(initials)
    } else {
      setTypedText(signerName || '')
    }
  }

  const handleSign = () => {
    if (!activeField || !activeFieldId) return

    const fieldType = activeField.type.toLowerCase() as SignatureType
    let dataUrl: string | null = null
    let value: string | undefined

    if (fieldType === 'date') {
      value = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      dataUrl = textToImage(value, 'Arial', true)
    } else if (createMode === 'draw') {
      if (!signaturePad || isEmpty) return
      dataUrl = signaturePad.toDataURL('image/png')
    } else if (createMode === 'type') {
      if (!typedText.trim()) return
      dataUrl = textToImage(typedText, selectedFont, fieldType === 'initials')
      value = typedText
    }

    if (!dataUrl) return

    // Save the signature/initials for reuse
    if (fieldType === 'signature') {
      setSavedSignatureDataUrl(dataUrl)
    } else if (fieldType === 'initials') {
      setSavedInitialsDataUrl(dataUrl)
    }

    // Mark field as signed locally
    setSignedFieldsMap(prev => ({
      ...prev,
      [activeFieldId]: { dataUrl, value },
    }))

    setShowSignModal(false)
    setActiveFieldId(null)
    setTypedText('')
  }

  // Quick sign with saved signature
  const handleQuickSign = (fieldId: string, fieldType: string) => {
    const savedDataUrl =
      fieldType.toLowerCase() === 'signature'
        ? savedSignatureDataUrl
        : fieldType.toLowerCase() === 'initials'
        ? savedInitialsDataUrl
        : null

    if (!savedDataUrl) return

    setSignedFieldsMap(prev => ({
      ...prev,
      [fieldId]: { dataUrl: savedDataUrl },
    }))
  }

  const handleSave = async () => {
    // Validate signer info
    if (!signerName.trim() || !signerTitle.trim() || !signerCompany.trim() || !signerEmail.trim()) {
      setError('Please fill in all signer information')
      return
    }

    // Validate all fields are signed
    const unsignedFields = myFields.filter(f => !f.isSigned && !signedFieldsMap[f.id])
    if (unsignedFields.length > 0) {
      setError(`Please sign all ${unsignedFields.length} remaining field(s)`)
      return
    }

    try {
      setSaving(true)
      setError('')

      // Fetch the PDF
      const response = await fetch(proxyUrl)
      if (!response.ok) throw new Error('Failed to fetch PDF for signing')
      const pdfBytes = await response.arrayBuffer()

      const pdfDoc = await PDFDocument.load(pdfBytes)
      const pages = pdfDoc.getPages()

      // Embed signatures into PDF at field positions
      for (const field of myFields) {
        const signedData = signedFieldsMap[field.id]
        if (!signedData) continue // Skip already-signed fields (they're already in the PDF)

        const page = pages[field.pageNumber - 1]
        if (!page) continue

        const { width: pdfPageWidth, height: pdfPageHeight } = page.getSize()

        if (field.type.toLowerCase() === 'date' && signedData.value) {
          // Draw date as text
          const fontSize = 12
          const x = (field.xPercent / 100) * pdfPageWidth
          const y = pdfPageHeight - (field.yPercent / 100) * pdfPageHeight

          page.drawText(signedData.value, {
            x: x - 50,
            y: y,
            size: fontSize,
            color: rgb(0, 0, 0),
          })
        } else {
          // Embed signature/initials image
          const image = await pdfDoc.embedPng(signedData.dataUrl)
          const aspectRatio = image.width / image.height
          const imgWidth = (field.widthPercent / 100) * pdfPageWidth
          const imgHeight = imgWidth / aspectRatio

          const x = (field.xPercent / 100) * pdfPageWidth - imgWidth / 2
          const y = pdfPageHeight - (field.yPercent / 100) * pdfPageHeight - imgHeight / 2

          page.drawImage(image, {
            x: Math.max(0, x),
            y: Math.max(0, y),
            width: imgWidth,
            height: imgHeight,
          })
        }
      }

      const modifiedPdfBytes = await pdfDoc.save()
      const blob = new Blob([modifiedPdfBytes as BlobPart], { type: 'application/pdf' })

      // Prepare signed fields data
      const signedFieldsData = Object.entries(signedFieldsMap).map(([fieldId, data]) => ({
        fieldId,
        signatureDataUrl: data.dataUrl,
        value: data.value,
      }))

      await onSave(
        blob,
        signerName.trim(),
        signerTitle.trim(),
        signerCompany.trim(),
        signerEmail.trim(),
        signedFieldsData
      )
    } catch (err) {
      console.error('Error saving signed PDF:', err)
      setError(err instanceof Error ? err.message : 'Failed to save signed PDF')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-50">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white">Review & Sign Document</h2>
          <p className="text-zinc-400 text-sm">{contractTitle}</p>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-white p-2" disabled={saving}>
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Signer Info Bar */}
      <div className="bg-zinc-800 border-b border-zinc-700 px-6 py-4 shrink-0">
        <p className="text-sm text-zinc-400 mb-3">Please provide your information to sign this document</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="Full Legal Name *"
            className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-sm"
          />
          <input
            type="text"
            value={signerTitle}
            onChange={(e) => setSignerTitle(e.target.value)}
            placeholder="Title (CEO, Manager, etc.) *"
            className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-sm"
          />
          <input
            type="text"
            value={signerCompany}
            onChange={(e) => setSignerCompany(e.target.value)}
            placeholder="Company/Organization *"
            className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-sm"
          />
          <input
            type="email"
            value={signerEmail}
            onChange={(e) => setSignerEmail(e.target.value)}
            placeholder="Email Address *"
            className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-green-500/10 border-b border-green-500/30 px-6 py-3 shrink-0">
        <p className="text-green-400 text-sm">
          Click on the highlighted signature fields to add your signature. You need to sign {myFields.length} field(s).
          {signedCount > 0 && ` (${signedCount} of ${myFields.length} completed)`}
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
                className="relative bg-white shadow-xl"
              >
                <Page
                  pageNumber={index + 1}
                  width={pageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />

                {/* Render signature fields */}
                {signatureFields
                  .filter(field => field.pageNumber === index + 1)
                  .map((field) => {
                    const isMyField = field.assignedTo === signerRole
                    const isLocalSigned = signedFieldsMap[field.id]
                    const isSigned = field.isSigned || isLocalSigned
                    const canSign = isMyField && !isSigned
                    const fieldType = field.type.toLowerCase() as SignatureType

                    const colors = isMyField
                      ? isSigned
                        ? FIELD_COLORS.signed
                        : FIELD_COLORS.unsigned
                      : FIELD_COLORS.other

                    // Check if we have a saved signature for quick sign
                    const hasSavedSignature =
                      (fieldType === 'signature' && savedSignatureDataUrl) ||
                      (fieldType === 'initials' && savedInitialsDataUrl)

                    return (
                      <div
                        key={field.id}
                        className={`absolute ${canSign ? 'cursor-pointer' : ''}`}
                        style={{
                          left: `${field.xPercent}%`,
                          top: `${field.yPercent}%`,
                          transform: 'translate(-50%, -50%)',
                          width: `${field.widthPercent}%`,
                          minHeight: `${field.heightPercent}%`,
                        }}
                        onClick={() => canSign && handleFieldClick(field)}
                      >
                        {/* Unsigned field placeholder */}
                        {!isSigned && (
                          <div
                            className={`w-full h-full min-h-[40px] border-2 border-dashed ${colors.border} ${colors.bg} rounded flex flex-col items-center justify-center transition-all ${
                              canSign ? 'hover:border-solid hover:scale-105' : ''
                            }`}
                          >
                            <div className={`text-xs font-medium ${colors.text}`}>
                              {field.label || `${isMyField ? 'Your' : 'Other'} ${field.type}`}
                            </div>
                            {canSign && (
                              <>
                                <div className="text-[10px] text-zinc-600 mt-0.5">Click to sign</div>
                                {hasSavedSignature && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleQuickSign(field.id, field.type)
                                    }}
                                    className="mt-1 text-[10px] text-green-600 hover:text-green-500 underline"
                                  >
                                    Use saved {fieldType}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {/* Signed field with signature image */}
                        {isSigned && (
                          <div className={`w-full border-2 ${colors.border} ${colors.bg} rounded p-1`}>
                            {isLocalSigned ? (
                              <img
                                src={isLocalSigned.dataUrl}
                                alt={`${field.type} signed`}
                                className="w-full h-auto"
                              />
                            ) : field.signatureUrl ? (
                              <img
                                src={field.signatureUrl}
                                alt={`${field.type} by ${field.signedByName}`}
                                className="w-full h-auto"
                              />
                            ) : (
                              <div className="text-xs text-center text-zinc-500 py-2">
                                Signed by {field.signedByName}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}

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
          {signedCount} of {myFields.length} signature field(s) completed
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
            disabled={!allMyFieldsSigned || saving}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              allMyFieldsSigned && !saving
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
                Submitting...
              </>
            ) : (
              <>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Submit Signed Document
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sign Field Modal */}
      {showSignModal && activeField && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4">
          <div className="bg-zinc-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white">
                {activeField.type.toLowerCase() === 'date'
                  ? 'Add Date'
                  : activeField.type.toLowerCase() === 'signature'
                  ? 'Add Your Signature'
                  : 'Add Your Initials'}
              </h3>
              <p className="text-zinc-400 text-sm mt-1">
                {activeField.label || `${activeField.type} field`}
              </p>
            </div>

            <div className="p-6">
              {activeField.type.toLowerCase() === 'date' ? (
                <div className="mb-6 p-4 bg-zinc-800 rounded-lg text-center">
                  <p className="text-zinc-400 text-sm mb-2">Date will be added:</p>
                  <p className="text-white text-lg font-medium">
                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              ) : (
                <>
                  {/* Creation Mode Tabs */}
                  <div className="flex gap-2 mb-4">
                    {(['draw', 'type'] as CreateMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setCreateMode(mode)}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                          createMode === mode
                            ? 'bg-green-600 text-white'
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
                          Draw Your {activeField.type.toLowerCase() === 'signature' ? 'Signature' : 'Initials'}
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
                        Type Your {activeField.type.toLowerCase() === 'signature' ? 'Signature' : 'Initials'}
                      </label>
                      <input
                        type="text"
                        value={typedText}
                        onChange={(e) => setTypedText(e.target.value)}
                        placeholder={activeField.type.toLowerCase() === 'initials' ? 'KR' : signerName || 'Your Name'}
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 mb-4"
                      />

                      <label className="block text-sm font-medium text-zinc-400 mb-2">Font Style</label>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {SIGNATURE_FONTS.map((font) => (
                          <button
                            key={font.name}
                            onClick={() => setSelectedFont(font.name)}
                            className={`p-3 rounded-lg border-2 transition-colors ${
                              selectedFont === font.name
                                ? 'border-green-500 bg-zinc-800'
                                : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                            }`}
                          >
                            <span
                              style={{ fontFamily: `"${font.name}", ${font.style}`, fontSize: '20px' }}
                              className="text-white"
                            >
                              {typedText || (activeField.type.toLowerCase() === 'initials' ? 'KR' : 'Preview')}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowSignModal(false); setActiveFieldId(null) }}
                  className="flex-1 px-6 py-3 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSign}
                  disabled={
                    activeField.type.toLowerCase() !== 'date' &&
                    ((createMode === 'draw' && isEmpty) ||
                     (createMode === 'type' && !typedText.trim()))
                  }
                  className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                    activeField.type.toLowerCase() === 'date' ||
                    (createMode === 'draw' && !isEmpty) ||
                    (createMode === 'type' && typedText.trim())
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {activeField.type.toLowerCase() === 'date' ? 'Add Date' : 'Sign'}
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
