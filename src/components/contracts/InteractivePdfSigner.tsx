'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import SignaturePad from 'signature_pad'
import { PDFDocument } from 'pdf-lib'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure PDF.js worker - use unpkg CDN for reliable production loading
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PlacedSignature {
  pageNumber: number
  x: number // percentage from left
  y: number // percentage from top
  width: number // percentage of page width
  signerName: string
}

interface InteractivePdfSignerProps {
  pdfUrl: string
  contractTitle: string
  onSave: (signedPdfBlob: Blob, signerName: string, signatureDataUrl: string) => Promise<void>
  onClose: () => void
  existingSignatures?: PlacedSignature[]
}

export default function InteractivePdfSigner({
  pdfUrl,
  contractTitle,
  onSave,
  onClose,
  existingSignatures = [],
}: InteractivePdfSignerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageWidth, setPageWidth] = useState(700)
  const [loading, setLoading] = useState(true)
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null)

  // Signature capture state
  const [showSignatureCapture, setShowSignatureCapture] = useState(false)
  const [clickPosition, setClickPosition] = useState<{ pageNumber: number; x: number; y: number } | null>(null)
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const [signerName, setSignerName] = useState('')
  const [placedSignatures, setPlacedSignatures] = useState<PlacedSignature[]>(existingSignatures)

  // Signature pad
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  // Saving state
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Fetch PDF bytes on mount
  useEffect(() => {
    async function fetchPdf() {
      try {
        const response = await fetch(pdfUrl)
        const bytes = await response.arrayBuffer()
        setPdfBytes(bytes)
      } catch (err) {
        console.error('Error fetching PDF:', err)
        setError('Failed to load PDF')
      }
    }
    fetchPdf()
  }, [pdfUrl])

  // Initialize signature pad when modal opens
  useEffect(() => {
    if (showSignatureCapture && canvasRef.current && !signaturePad) {
      const canvas = canvasRef.current
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext('2d')?.scale(ratio, ratio)

      const pad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
      })

      pad.addEventListener('endStroke', () => {
        setIsEmpty(pad.isEmpty())
      })

      setSignaturePad(pad)

      return () => {
        pad.off()
      }
    }
  }, [showSignatureCapture, signaturePad])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
  }

  const handlePageClick = (pageNumber: number, event: React.MouseEvent<HTMLDivElement>) => {
    // If we already have a signature captured, place it
    if (signatureDataUrl && signerName) {
      const rect = event.currentTarget.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 100
      const y = ((event.clientY - rect.top) / rect.height) * 100

      setPlacedSignatures(prev => [...prev, {
        pageNumber,
        x,
        y,
        width: 20, // 20% of page width
        signerName,
      }])
    } else {
      // Open signature capture modal
      const rect = event.currentTarget.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 100
      const y = ((event.clientY - rect.top) / rect.height) * 100

      setClickPosition({ pageNumber, x, y })
      setShowSignatureCapture(true)
    }
  }

  const handleClearSignature = () => {
    signaturePad?.clear()
    setIsEmpty(true)
  }

  const handleCaptureSignature = () => {
    if (!signaturePad || isEmpty || !signerName.trim()) return

    const dataUrl = signaturePad.toDataURL('image/png')
    setSignatureDataUrl(dataUrl)

    // Place signature at clicked position
    if (clickPosition) {
      setPlacedSignatures(prev => [...prev, {
        pageNumber: clickPosition.pageNumber,
        x: clickPosition.x,
        y: clickPosition.y,
        width: 20,
        signerName: signerName.trim(),
      }])
    }

    setShowSignatureCapture(false)
    setClickPosition(null)
  }

  const handleRemoveSignature = (index: number) => {
    setPlacedSignatures(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!pdfBytes || placedSignatures.length === 0 || !signatureDataUrl || !signerName) {
      setError('Please place at least one signature on the document')
      return
    }

    try {
      setSaving(true)
      setError('')

      // Load the PDF
      const pdfDoc = await PDFDocument.load(pdfBytes)
      const pages = pdfDoc.getPages()

      // Embed the signature image
      const signatureImage = await pdfDoc.embedPng(signatureDataUrl)
      const sigAspectRatio = signatureImage.width / signatureImage.height

      // Place each signature
      for (const sig of placedSignatures) {
        const page = pages[sig.pageNumber - 1]
        if (!page) continue

        const { width: pageWidth, height: pageHeight } = page.getSize()

        // Calculate signature dimensions (20% of page width by default)
        const sigWidth = (sig.width / 100) * pageWidth
        const sigHeight = sigWidth / sigAspectRatio

        // Convert percentage positions to PDF coordinates
        // PDF coordinates start from bottom-left
        const x = (sig.x / 100) * pageWidth - sigWidth / 2
        const y = pageHeight - (sig.y / 100) * pageHeight - sigHeight / 2

        page.drawImage(signatureImage, {
          x: Math.max(0, x),
          y: Math.max(0, y),
          width: sigWidth,
          height: sigHeight,
        })
      }

      // Save the modified PDF
      const modifiedPdfBytes = await pdfDoc.save()
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' })

      await onSave(blob, signerName.trim(), signatureDataUrl)
    } catch (err) {
      console.error('Error saving signed PDF:', err)
      setError(err instanceof Error ? err.message : 'Failed to save signed PDF')
      setSaving(false)
    }
  }

  const resetSignature = () => {
    setSignatureDataUrl(null)
    setSignerName('')
    setPlacedSignatures([])
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
          {signatureDataUrl && (
            <div className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded-lg">
              <span className="text-sm text-zinc-400">Signing as:</span>
              <span className="text-sm text-white font-medium">{signerName}</span>
              <button
                onClick={resetSignature}
                className="text-zinc-500 hover:text-white ml-2"
                title="Reset signature"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2"
            disabled={saving}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-500/10 border-b border-blue-500/30 px-6 py-3 shrink-0">
        <p className="text-blue-400 text-sm">
          {signatureDataUrl
            ? 'Click anywhere on the document to place your signature. You can place multiple signatures.'
            : 'Click where you want to place your signature on the document.'}
        </p>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-zinc-950 p-6">
        <div className="max-w-4xl mx-auto">
          {loading && (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-zinc-400">Loading document...</p>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-20">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          <Document
            file={pdfBytes ? { data: pdfBytes } : pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(err) => {
              console.error('PDF load error:', err)
              setError(`Failed to load PDF: ${err.message}`)
              setLoading(false)
            }}
            loading={
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-zinc-400">Loading PDF...</p>
              </div>
            }
            error={
              <div className="text-center py-20">
                <p className="text-red-500 mb-4">Failed to load PDF document.</p>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-400"
                >
                  Open PDF in new tab
                </a>
              </div>
            }
            className="flex flex-col gap-4"
          >
            {Array.from(new Array(numPages), (_, index) => (
              <div
                key={`page_${index + 1}`}
                className="relative bg-white shadow-lg cursor-crosshair"
                onClick={(e) => handlePageClick(index + 1, e)}
              >
                <Page
                  pageNumber={index + 1}
                  width={pageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />

                {/* Render placed signatures on this page */}
                {placedSignatures
                  .filter(sig => sig.pageNumber === index + 1)
                  .map((sig, sigIndex) => (
                    <div
                      key={sigIndex}
                      className="absolute group"
                      style={{
                        left: `${sig.x}%`,
                        top: `${sig.y}%`,
                        transform: 'translate(-50%, -50%)',
                        width: `${sig.width}%`,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {signatureDataUrl && (
                        <img
                          src={signatureDataUrl}
                          alt={`Signature by ${sig.signerName}`}
                          className="w-full h-auto"
                        />
                      )}
                      <button
                        onClick={() => handleRemoveSignature(
                          placedSignatures.findIndex(
                            s => s.pageNumber === sig.pageNumber && s.x === sig.x && s.y === sig.y
                          )
                        )}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove signature"
                      >
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                {/* Page number indicator */}
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
          {placedSignatures.length > 0
            ? `${placedSignatures.length} signature(s) placed`
            : 'No signatures placed'}
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
            disabled={placedSignatures.length === 0 || saving}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              placedSignatures.length > 0 && !saving
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

      {/* Signature Capture Modal */}
      {showSignatureCapture && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4">
          <div className="bg-zinc-900 rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white">Create Your Signature</h3>
              <p className="text-zinc-400 text-sm mt-1">
                Enter your name and draw your signature below
              </p>
            </div>

            <div className="p-6">
              {/* Signer Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Enter your full legal name"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Signature Pad */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-zinc-400">
                    Draw Your Signature
                  </label>
                  <button
                    onClick={handleClearSignature}
                    className="text-sm text-zinc-500 hover:text-zinc-300"
                  >
                    Clear
                  </button>
                </div>
                <div
                  className="bg-white rounded-lg border-2 border-zinc-700 overflow-hidden"
                  style={{ touchAction: 'none' }}
                >
                  <canvas
                    ref={canvasRef}
                    className="w-full cursor-crosshair"
                    style={{ height: '150px', display: 'block' }}
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  Draw your signature using your mouse or touchscreen
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSignatureCapture(false)
                    setClickPosition(null)
                  }}
                  className="flex-1 px-6 py-3 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCaptureSignature}
                  disabled={isEmpty || !signerName.trim()}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                    !isEmpty && signerName.trim()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  Place Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
