'use client'

import { useRef, useEffect, useState } from 'react'
import SignaturePad from 'signature_pad'

interface ContractSigningModalProps {
  contractTitle: string
  contractFileUrl: string
  onSign: (data: { signedByName: string; signatureDataUrl: string }) => Promise<void>
  onClose: () => void
}

export default function ContractSigningModal({
  contractTitle,
  contractFileUrl,
  onSign,
  onClose,
}: ContractSigningModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)
  const [agreed, setAgreed] = useState(false)
  const [legalName, setLegalName] = useState('')
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (canvasRef.current) {
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
  }, [])

  const handleClear = () => {
    signaturePad?.clear()
    setIsEmpty(true)
  }

  const canSign = agreed && legalName.trim().length > 2 && !isEmpty

  const handleSign = async () => {
    if (!canSign || !signaturePad) return

    try {
      setSigning(true)
      setError('')
      const signatureDataUrl = signaturePad.toDataURL('image/png')
      await onSign({
        signedByName: legalName.trim(),
        signatureDataUrl,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign contract')
      setSigning(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-zinc-900 rounded-xl w-full max-w-4xl my-8">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Sign Contract</h2>
              <p className="text-zinc-400 text-sm mt-1">{contractTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2"
              disabled={signing}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contract Preview */}
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-3">
            Contract Document
          </h3>
          <div className="bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden">
            <iframe
              src={`${contractFileUrl}#toolbar=0`}
              className="w-full"
              style={{ height: '400px' }}
              title="Contract PDF"
            />
          </div>
          <div className="mt-3 flex gap-3">
            <a
              href={contractFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:text-blue-400 flex items-center gap-1"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in new tab
            </a>
            <a
              href={contractFileUrl}
              download
              className="text-sm text-blue-500 hover:text-blue-400 flex items-center gap-1"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </a>
          </div>
        </div>

        {/* Signing Section */}
        <div className="p-6">
          {/* Agreement Checkbox */}
          <label className="flex items-start gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-900"
              disabled={signing}
            />
            <span className="text-zinc-300 text-sm leading-relaxed">
              I have read and agree to the terms of this agreement. I understand that by signing below,
              I am entering into a legally binding contract with 47 Industries LLC.
            </span>
          </label>

          {/* Legal Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Legal Name (as it should appear on the contract)
            </label>
            <input
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="Enter your full legal name"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              disabled={signing}
            />
          </div>

          {/* Signature Pad */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-zinc-400">
                Your Signature
              </label>
              <button
                onClick={handleClear}
                className="text-sm text-zinc-500 hover:text-zinc-300"
                disabled={signing}
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

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors font-medium"
              disabled={signing}
            >
              Cancel
            </button>
            <button
              onClick={handleSign}
              disabled={!canSign || signing}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                canSign && !signing
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {signing ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing...
                </>
              ) : (
                <>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Sign Contract
                </>
              )}
            </button>
          </div>

          {/* Validation hints */}
          {!canSign && (
            <div className="mt-4 text-xs text-zinc-500">
              <p>To sign, you must:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {!agreed && <li>Agree to the terms above</li>}
                {legalName.trim().length <= 2 && <li>Enter your legal name</li>}
                {isEmpty && <li>Draw your signature</li>}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
