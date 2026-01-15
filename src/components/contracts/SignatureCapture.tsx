'use client'

import { useRef, useEffect, useState } from 'react'
import SignaturePad from 'signature_pad'

interface SignatureCaptureProps {
  onSave: (dataUrl: string) => void
  onCancel: () => void
}

export default function SignatureCapture({ onSave, onCancel }: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

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

  const handleSave = () => {
    if (signaturePad && !signaturePad.isEmpty()) {
      const dataUrl = signaturePad.toDataURL('image/png')
      onSave(dataUrl)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl max-w-lg w-full p-6">
        <h3 className="text-xl font-bold mb-4 text-white">Sign Contract</h3>
        <p className="text-zinc-400 text-sm mb-4">
          Draw your signature in the box below
        </p>

        <div className="bg-white rounded-lg mb-4" style={{ touchAction: 'none' }}>
          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ height: '200px', display: 'block' }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClear}
            className="flex-1 px-4 py-3 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isEmpty}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
              isEmpty
                ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Apply Signature
          </button>
        </div>
      </div>
    </div>
  )
}
