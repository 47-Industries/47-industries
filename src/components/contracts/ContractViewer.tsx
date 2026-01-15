'use client'

import { useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface Annotation {
  id: string
  page: number
  type: 'highlight' | 'comment'
  x: number
  y: number
  width?: number
  height?: number
  color?: string
  text?: string
  createdAt: string
}

interface ContractViewerProps {
  fileUrl: string
  annotations?: Annotation[]
  onAnnotationAdd?: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void
  readOnly?: boolean
}

export default function ContractViewer({
  fileUrl,
  annotations = [],
  onAnnotationAdd,
  readOnly = false,
}: ContractViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [annotationMode, setAnnotationMode] = useState<'none' | 'highlight' | 'comment'>('none')
  const [newComment, setNewComment] = useState('')
  const [commentPosition, setCommentPosition] = useState<{ x: number; y: number; page: number } | null>(null)

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
  }, [])

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error)
    setError('Failed to load PDF document')
    setLoading(false)
  }, [])

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || annotationMode === 'none' || !onAnnotationAdd) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    if (annotationMode === 'comment') {
      setCommentPosition({ x, y, page: pageNumber })
    } else if (annotationMode === 'highlight') {
      onAnnotationAdd({
        page: pageNumber,
        type: 'highlight',
        x,
        y,
        width: 20,
        height: 2,
        color: '#ffff00',
      })
    }
  }

  const handleAddComment = () => {
    if (!commentPosition || !newComment.trim() || !onAnnotationAdd) return

    onAnnotationAdd({
      page: commentPosition.page,
      type: 'comment',
      x: commentPosition.x,
      y: commentPosition.y,
      text: newComment.trim(),
    })

    setCommentPosition(null)
    setNewComment('')
  }

  const pageAnnotations = annotations.filter((a) => a.page === pageNumber)

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="px-3 py-2 bg-zinc-800 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-400">
            Page {pageNumber} of {numPages}
          </span>
          <button
            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
            className="px-3 py-2 bg-zinc-800 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700"
          >
            Next
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
            className="px-3 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700"
          >
            -
          </button>
          <span className="text-sm text-zinc-400 w-16 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(2, s + 0.1))}
            className="px-3 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700"
          >
            +
          </button>
        </div>

        {!readOnly && onAnnotationAdd && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAnnotationMode(annotationMode === 'highlight' ? 'none' : 'highlight')}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                annotationMode === 'highlight'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-zinc-800 hover:bg-zinc-700'
              }`}
            >
              Highlight
            </button>
            <button
              onClick={() => setAnnotationMode(annotationMode === 'comment' ? 'none' : 'comment')}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                annotationMode === 'comment'
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-800 hover:bg-zinc-700'
              }`}
            >
              Comment
            </button>
          </div>
        )}
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-zinc-950 p-4">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <p className="text-zinc-400">Loading PDF...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-64">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        <div
          className="mx-auto relative"
          style={{ width: 'fit-content' }}
          onClick={handlePageClick}
        >
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>

          {/* Render annotations */}
          {pageAnnotations.map((annotation) => (
            <div
              key={annotation.id}
              className="absolute pointer-events-none"
              style={{
                left: `${annotation.x}%`,
                top: `${annotation.y}%`,
              }}
            >
              {annotation.type === 'highlight' && (
                <div
                  className="opacity-50"
                  style={{
                    width: `${annotation.width || 20}%`,
                    height: `${annotation.height || 2}%`,
                    backgroundColor: annotation.color || '#ffff00',
                  }}
                />
              )}
              {annotation.type === 'comment' && (
                <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded max-w-[200px] pointer-events-auto">
                  {annotation.text}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Comment input modal */}
      {commentPosition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Comment</h3>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Enter your comment..."
              rows={3}
              className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white mb-4 resize-none"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setCommentPosition(null)}
                className="flex-1 px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
