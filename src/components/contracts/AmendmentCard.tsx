'use client'

import { AmendmentStatus } from '@prisma/client'

interface Amendment {
  id: string
  amendmentNumber: string
  title: string
  description?: string | null
  additionalValue: number | string
  additionalMonthlyValue?: number | string | null
  effectiveDate?: string | null
  fileUrl?: string | null
  fileName?: string | null
  status: AmendmentStatus
  signedAt?: string | null
  signedByName?: string | null
  countersignedAt?: string | null
  countersignedByName?: string | null
  createdAt: string
}

interface AmendmentCardProps {
  amendment: Amendment
  showAdminActions?: boolean
  onUpload?: (amendmentId: string) => void
  onSend?: (amendmentId: string) => void
  onSign?: (amendment: Amendment) => void
  onCountersign?: (amendmentId: string) => void
  onDelete?: (amendmentId: string) => void
  onEdit?: (amendment: Amendment) => void
}

const statusConfig: Record<AmendmentStatus, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: 'Draft', color: 'text-zinc-400', bgColor: 'bg-zinc-700' },
  SENT: { label: 'Awaiting Signature', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  SIGNED: { label: 'Signed', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  ACTIVE: { label: 'Active', color: 'text-green-400', bgColor: 'bg-green-500/20' },
}

export default function AmendmentCard({
  amendment,
  showAdminActions = false,
  onUpload,
  onSend,
  onSign,
  onCountersign,
  onDelete,
  onEdit,
}: AmendmentCardProps) {
  const statusStyle = statusConfig[amendment.status]

  const formatCurrency = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return null
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyle.bgColor} ${statusStyle.color}`}>
              {statusStyle.label}
            </span>
            <span className="text-xs text-zinc-500">{amendment.amendmentNumber}</span>
          </div>
          <h4 className="font-medium text-white truncate">{amendment.title}</h4>
          {amendment.description && (
            <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{amendment.description}</p>
          )}
          <div className="flex flex-wrap gap-3 mt-2 text-sm">
            <span className="text-zinc-300">
              <span className="text-zinc-500">One-time:</span> {formatCurrency(amendment.additionalValue)}
            </span>
            {amendment.additionalMonthlyValue && (
              <span className="text-zinc-300">
                <span className="text-zinc-500">Monthly:</span> {formatCurrency(amendment.additionalMonthlyValue)}/mo
              </span>
            )}
            {amendment.effectiveDate && (
              <span className="text-zinc-300">
                <span className="text-zinc-500">Effective:</span> {formatDate(amendment.effectiveDate)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {amendment.fileUrl && (
            <a
              href={amendment.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-sm bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600 transition-colors"
            >
              View PDF
            </a>
          )}

          {showAdminActions && (
            <>
              {amendment.status === 'DRAFT' && (
                <>
                  {onEdit && (
                    <button
                      onClick={() => onEdit(amendment)}
                      className="px-3 py-1.5 text-sm bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                  {onUpload && (
                    <button
                      onClick={() => onUpload(amendment.id)}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      {amendment.fileUrl ? 'Replace PDF' : 'Upload PDF'}
                    </button>
                  )}
                  {amendment.fileUrl && onSend && (
                    <button
                      onClick={() => onSend(amendment.id)}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Send for Signature
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(amendment.id)}
                      className="px-3 py-1.5 text-sm bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </>
              )}

              {amendment.status === 'SIGNED' && onCountersign && (
                <button
                  onClick={() => onCountersign(amendment.id)}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Countersign
                </button>
              )}
            </>
          )}

          {!showAdminActions && amendment.status === 'SENT' && onSign && (
            <button
              onClick={() => onSign(amendment)}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Review & Sign
            </button>
          )}
        </div>
      </div>

      {/* Signature info */}
      {(amendment.signedAt || amendment.countersignedAt) && (
        <div className="mt-3 pt-3 border-t border-zinc-700">
          <div className="flex flex-wrap gap-4 text-sm">
            {amendment.signedAt && (
              <div>
                <span className="text-zinc-500">Signed by:</span>{' '}
                <span className="text-zinc-300">{amendment.signedByName}</span>
                <span className="text-zinc-500 ml-1">({formatDate(amendment.signedAt)})</span>
              </div>
            )}
            {amendment.countersignedAt && (
              <div>
                <span className="text-zinc-500">Countersigned by:</span>{' '}
                <span className="text-zinc-300">{amendment.countersignedByName}</span>
                <span className="text-zinc-500 ml-1">({formatDate(amendment.countersignedAt)})</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
