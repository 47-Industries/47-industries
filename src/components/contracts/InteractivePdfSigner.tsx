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
type AssignedTo = 'ADMIN' | 'ADMIN_2' | 'CLIENT' | 'PARTNER'

export interface PlacedElement {
  id: string
  type: SignatureType
  pageNumber: number
  x: number // percentage from left
  y: number // percentage from top
  width: number // percentage of page width
  height?: number // percentage of page height (for placeholders)
  dataUrl?: string // For signature/initials images
  text?: string // For typed signatures or date
  signerName: string
  signerTitle: string
  // New fields for placeholder support
  isPlaceholder?: boolean // True if this is a placeholder for someone else to sign
  assignedTo?: AssignedTo // Who should sign this field
  assignedUserId?: string // User ID of the person assigned to sign
  label?: string // Label shown on placeholder
  isSigned?: boolean // Whether the placeholder has been signed
  fieldId?: string // Database ID if saved to ContractSignatureField
}

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

// Signer option for the dropdown
export interface SignerOption {
  id: string
  type: 'admin' | 'client' | 'partner'
  name: string
  email?: string
  title?: string // Job title/role from database
  hasSignature?: boolean
  hasInitials?: boolean
  assignedTo: AssignedTo
}

interface InteractivePdfSignerProps {
  pdfUrl: string
  contractTitle: string
  contractId?: string // Contract ID for fetching signers
  clientId?: string // Client ID for the contract
  onSave: (
    signerName: string,
    signerTitle: string,
    signatureDataUrl: string,
    adminSignedElements: PlacedElement[],
    placeholderElements: PlacedElement[],
    initialsDataUrl?: string
  ) => Promise<void>
  onClose: () => void
  existingSignatures?: PlacedElement[]
  existingSignatureFields?: SignatureField[] // Load existing signature fields from database
  initialSignerName?: string
  initialSignerTitle?: string
  initialSignatureDataUrl?: string | null
  initialInitialsDataUrl?: string | null
  mode?: 'sign' | 'setup' | 'both' // 'sign' = signing only, 'setup' = create placeholders only, 'both' = can do both
  currentUserRole?: 'admin' | 'client' | 'partner' // Who is currently using the signer
  availableSigners?: SignerOption[] // Optional pre-loaded signer options
}

const SIGNATURE_FONTS = [
  { name: 'Dancing Script', style: 'cursive' },
  { name: 'Great Vibes', style: 'cursive' },
  { name: 'Allura', style: 'cursive' },
  { name: 'Pacifico', style: 'cursive' },
]

// Color scheme for different signers
const SIGNER_COLORS: Record<AssignedTo, { bg: string; border: string; text: string; bgLight: string }> = {
  ADMIN: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500', bgLight: 'bg-blue-500/20' },
  ADMIN_2: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-500', bgLight: 'bg-purple-500/20' },
  CLIENT: { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-500', bgLight: 'bg-green-500/20' },
  PARTNER: { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-500', bgLight: 'bg-orange-500/20' },
}

const SIGNER_LABELS: Record<AssignedTo, string> = {
  ADMIN: '47 Industries (Admin)',
  ADMIN_2: '47 Industries (Admin 2)',
  CLIENT: 'Client',
  PARTNER: 'Partner',
}

export default function InteractivePdfSigner({
  pdfUrl,
  contractTitle,
  contractId,
  clientId,
  onSave,
  onClose,
  existingSignatures = [],
  existingSignatureFields = [],
  initialSignerName = '',
  initialSignerTitle = '',
  initialSignatureDataUrl = null,
  initialInitialsDataUrl = null,
  mode = 'both',
  currentUserRole = 'admin',
  availableSigners: propSigners,
}: InteractivePdfSignerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [pageWidth, setPageWidth] = useState(700)

  // Signer options for "Add Field for Others" dropdown
  const [signerOptions, setSignerOptions] = useState<SignerOption[]>(propSigners || [])
  const [loadingSigners, setLoadingSigners] = useState(false)

  // Use proxy URL for display
  const proxyUrl = `/api/proxy/pdf?url=${encodeURIComponent(pdfUrl)}`

  // Signature/element state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createType, setCreateType] = useState<SignatureType>('signature')
  const [createMode, setCreateMode] = useState<CreateMode>('draw')
  const [clickPosition, setClickPosition] = useState<{ pageNumber: number; x: number; y: number } | null>(null)

  // Placeholder creation state
  const [isCreatingPlaceholder, setIsCreatingPlaceholder] = useState(false)
  const [selectedSigner, setSelectedSigner] = useState<SignerOption | null>(null)
  const [placeholderAssignedTo, setPlaceholderAssignedTo] = useState<AssignedTo>('CLIENT')

  // Saved signature data
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(initialSignatureDataUrl)
  const [initialsDataUrl, setInitialsDataUrl] = useState<string | null>(initialInitialsDataUrl)
  const [signerName, setSignerName] = useState(initialSignerName)
  const [signerTitle, setSignerTitle] = useState(initialSignerTitle)

  // Convert existing signature fields from database to PlacedElement format
  const initialElements: PlacedElement[] = [
    ...existingSignatures,
    ...existingSignatureFields.map(field => ({
      id: field.id,
      fieldId: field.id,
      type: field.type.toLowerCase() as SignatureType,
      pageNumber: field.pageNumber,
      x: field.xPercent,
      y: field.yPercent,
      width: field.widthPercent,
      height: field.heightPercent,
      signerName: field.signedByName || '',
      signerTitle: '',
      isPlaceholder: true,
      assignedTo: field.assignedTo as AssignedTo,
      label: field.label || undefined,
      isSigned: field.isSigned,
      dataUrl: field.signatureUrl || undefined,
      text: field.signedValue || undefined,
    }))
  ]

  // Placed elements
  const [placedElements, setPlacedElements] = useState<PlacedElement[]>(initialElements)
  const [hasLoadedExisting, setHasLoadedExisting] = useState(false)

  // Update placed elements when existingSignatureFields are loaded
  useEffect(() => {
    if (!hasLoadedExisting && existingSignatureFields.length > 0) {
      // Load signature images via proxy if they're R2 URLs
      const loadSignatureImages = async () => {
        const loadedElements: PlacedElement[] = await Promise.all(
          existingSignatureFields.map(async (field) => {
            let dataUrl = field.signatureUrl || undefined

            // If it's an R2 URL (not a data URL), proxy it to get a data URL
            if (dataUrl && !dataUrl.startsWith('data:') && field.isSigned) {
              try {
                const proxyRes = await fetch(`/api/proxy/pdf?url=${encodeURIComponent(dataUrl)}`)
                if (proxyRes.ok) {
                  const blob = await proxyRes.blob()
                  dataUrl = await new Promise<string>((resolve) => {
                    const reader = new FileReader()
                    reader.onloadend = () => resolve(reader.result as string)
                    reader.readAsDataURL(blob)
                  })
                }
              } catch (err) {
                console.error('Error loading signature image:', err)
              }
            }

            return {
              id: field.id,
              fieldId: field.id,
              type: field.type.toLowerCase() as SignatureType,
              pageNumber: field.pageNumber,
              x: field.xPercent,
              y: field.yPercent,
              width: field.widthPercent,
              height: field.heightPercent,
              signerName: field.signedByName || '',
              signerTitle: '',
              isPlaceholder: !field.isSigned, // Only placeholders for unsigned fields
              assignedTo: field.assignedTo as AssignedTo,
              label: field.label || undefined,
              isSigned: field.isSigned,
              dataUrl,
              text: field.signedValue || undefined,
            }
          })
        )
        setPlacedElements(prev => [...prev.filter(el => !existingSignatureFields.find(f => f.id === el.id)), ...loadedElements])
        setHasLoadedExisting(true)
      }

      loadSignatureImages()
    }
  }, [existingSignatureFields, hasLoadedExisting])

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

  // For others: signature creation state
  const forOthersCanvasRef = useRef<HTMLCanvasElement>(null)
  const [forOthersSignaturePad, setForOthersSignaturePad] = useState<SignaturePad | null>(null)
  const [forOthersIsEmpty, setForOthersIsEmpty] = useState(true)
  const [forOthersCreateMode, setForOthersCreateMode] = useState<CreateMode>('draw')
  const [forOthersTypedText, setForOthersTypedText] = useState('')
  const [forOthersSelectedFont, setForOthersSelectedFont] = useState(SIGNATURE_FONTS[0].name)
  const forOthersFileInputRef = useRef<HTMLInputElement>(null)
  const [forOthersDataUrl, setForOthersDataUrl] = useState<string | null>(null)
  const [savingToProfile, setSavingToProfile] = useState(false)

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

  // Fetch available signers for "Add Field for Others" dropdown
  useEffect(() => {
    if (propSigners) {
      setSignerOptions(propSigners)
      return
    }

    const fetchSigners = async () => {
      setLoadingSigners(true)
      try {
        const options: SignerOption[] = []

        // Fetch admins
        const adminsRes = await fetch('/api/admin/users/admins')
        if (adminsRes.ok) {
          const adminsData = await adminsRes.json()
          adminsData.admins?.forEach((admin: { id: string; name: string; email: string; title?: string; signatureUrl?: string; initialsUrl?: string }, index: number) => {
            options.push({
              id: admin.id,
              type: 'admin',
              name: admin.name || admin.email,
              email: admin.email,
              title: admin.title || undefined,
              hasSignature: !!admin.signatureUrl,
              hasInitials: !!admin.initialsUrl,
              assignedTo: index === 0 ? 'ADMIN' : 'ADMIN_2' as AssignedTo,
            })
          })
        }

        // Fetch client info if clientId is provided
        if (clientId) {
          const clientRes = await fetch(`/api/admin/clients/${clientId}`)
          if (clientRes.ok) {
            const clientData = await clientRes.json()
            if (clientData.client) {
              options.push({
                id: clientData.client.id,
                type: 'client',
                name: clientData.client.name,
                email: clientData.client.email,
                assignedTo: 'CLIENT' as AssignedTo,
              })
            }
          }
        }

        // Fetch partners if available
        const partnersRes = await fetch('/api/admin/partners')
        if (partnersRes.ok) {
          const partnersData = await partnersRes.json()
          partnersData.partners?.forEach((partner: { id: string; name: string; email: string }) => {
            options.push({
              id: partner.id,
              type: 'partner',
              name: partner.name,
              email: partner.email,
              assignedTo: 'PARTNER' as AssignedTo,
            })
          })
        }

        setSignerOptions(options)
      } catch (err) {
        console.error('Error fetching signers:', err)
      } finally {
        setLoadingSigners(false)
      }
    }

    if (currentUserRole === 'admin') {
      fetchSigners()
    }
  }, [propSigners, clientId, currentUserRole])

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
    if (showCreateModal && createMode === 'draw' && canvasRef.current && !isCreatingPlaceholder) {
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
  }, [showCreateModal, createMode, isCreatingPlaceholder])

  // Initialize "for others" signature pad when in placeholder mode with draw
  useEffect(() => {
    if (showCreateModal && isCreatingPlaceholder && forOthersCreateMode === 'draw' && forOthersCanvasRef.current && createType !== 'date') {
      const initPad = () => {
        const canvas = forOthersCanvasRef.current
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

        if (forOthersSignaturePad) {
          forOthersSignaturePad.off()
        }

        const pad = new SignaturePad(canvas, {
          backgroundColor: 'rgb(255, 255, 255)',
          penColor: 'rgb(0, 0, 0)',
          minWidth: 1,
          maxWidth: 3,
        })

        pad.addEventListener('endStroke', () => {
          setForOthersIsEmpty(pad.isEmpty())
        })

        setForOthersSignaturePad(pad)
        setForOthersIsEmpty(true)
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(initPad)
      })

      return () => {
        if (forOthersSignaturePad) {
          forOthersSignaturePad.off()
          setForOthersSignaturePad(null)
        }
      }
    }
  }, [showCreateModal, isCreatingPlaceholder, forOthersCreateMode, createType])

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

  const handleClearForOthersSignature = () => {
    forOthersSignaturePad?.clear()
    setForOthersIsEmpty(true)
    setForOthersDataUrl(null)
  }

  // File upload handler for "for others"
  const handleForOthersFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setForOthersDataUrl(dataUrl)
    }
    reader.readAsDataURL(file)
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

  // Create a placeholder for someone else to sign (with optional signature data)
  const handleCreatePlaceholder = async () => {
    if (!clickPosition || !selectedSigner) return

    // Get the signature data URL based on creation mode
    let dataUrl: string | null = null
    let text: string | undefined

    if (createType === 'date') {
      // Date is always auto-generated
      text = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      dataUrl = textToImage(text, 'Arial', true)
    } else if (forOthersCreateMode === 'draw' && forOthersSignaturePad && !forOthersIsEmpty) {
      dataUrl = forOthersSignaturePad.toDataURL('image/png')
    } else if (forOthersCreateMode === 'type' && forOthersTypedText.trim()) {
      dataUrl = textToImage(forOthersTypedText, forOthersSelectedFont, createType === 'initials')
      text = forOthersTypedText
    } else if (forOthersCreateMode === 'upload' && forOthersDataUrl) {
      dataUrl = forOthersDataUrl
    }

    const defaultLabels: Record<SignatureType, Record<AssignedTo, string>> = {
      signature: {
        ADMIN: 'Admin Signature',
        ADMIN_2: 'Admin 2 Signature',
        CLIENT: 'Client Signature',
        PARTNER: 'Partner Signature',
      },
      initials: {
        ADMIN: 'Admin Initials',
        ADMIN_2: 'Admin 2 Initials',
        CLIENT: 'Client Initials',
        PARTNER: 'Partner Initials',
      },
      date: {
        ADMIN: 'Date',
        ADMIN_2: 'Date',
        CLIENT: 'Date',
        PARTNER: 'Date',
      },
    }

    // Build label from signer's name and title
    const signerLabel = selectedSigner
      ? `${selectedSigner.name}${selectedSigner.title ? ` (${selectedSigner.title})` : ''}`
      : defaultLabels[createType][placeholderAssignedTo]

    // Determine if this is a pre-signed field (has dataUrl) or a placeholder
    const isSigned = !!dataUrl && createType !== 'date'

    const newElement: PlacedElement = {
      id: generateId(),
      type: createType,
      pageNumber: clickPosition.pageNumber,
      x: clickPosition.x,
      y: clickPosition.y,
      width: createType === 'initials' || createType === 'date' ? 12 : 25,
      height: createType === 'initials' || createType === 'date' ? 4 : 6,
      signerName: selectedSigner?.name || '',
      signerTitle: selectedSigner?.title || '',
      isPlaceholder: !isSigned, // Not a placeholder if already signed
      assignedTo: placeholderAssignedTo,
      assignedUserId: selectedSigner?.id || undefined,
      label: signerLabel,
      isSigned: isSigned,
      dataUrl: dataUrl || undefined,
      text,
    }

    // If we have signature data, save it to the signer's profile
    if (dataUrl && selectedSigner && (createType === 'signature' || createType === 'initials')) {
      setSavingToProfile(true)
      try {
        const updateData: Record<string, string> = {}
        if (createType === 'signature') {
          updateData.signatureDataUrl = dataUrl
        } else if (createType === 'initials') {
          updateData.initialsDataUrl = dataUrl
        }

        await fetch(`/api/admin/users/${selectedSigner.id}/signature`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        })
      } catch (err) {
        console.error('Failed to save signature to profile:', err)
        // Don't fail the whole operation
      } finally {
        setSavingToProfile(false)
      }
    }

    setPlacedElements(prev => [...prev, newElement])
    setShowCreateModal(false)
    setClickPosition(null)
    setIsCreatingPlaceholder(false)
    setSelectedSigner(null)
    // Reset for others state
    setForOthersTypedText('')
    setForOthersDataUrl(null)
    setForOthersIsEmpty(true)
    if (forOthersSignaturePad) {
      forOthersSignaturePad.clear()
    }
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
      const rect = (foundPage as Element).getBoundingClientRect()
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

    // Calculate new width based on distance from element center to mouse
    const elementCenterX = elemRect.left + elemRect.width / 2
    const distanceFromCenter = e.clientX - elementCenterX
    const newWidthPx = Math.abs(distanceFromCenter) * 2
    const newWidthPercent = (newWidthPx / pageRect.width) * 100

    setPlacedElements(prev => prev.map(el =>
      el.id === resizingId
        ? { ...el, width: Math.max(5, Math.min(50, newWidthPercent)) }
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
    // Separate admin's signed elements from placeholders for others
    const adminSignedElements = placedElements.filter(el => !el.isPlaceholder && (el.dataUrl || el.text))
    const placeholderElements = placedElements.filter(el => el.isPlaceholder && !el.isSigned)
    const mySignatureElements = adminSignedElements.filter(el => el.type === 'signature')

    // Validation based on mode
    if (mode === 'sign' || mode === 'both') {
      // If there are any placed elements that are not placeholders, require signer info
      if (mySignatureElements.length > 0 && (!signerName || !signerTitle)) {
        setError('Please enter your name and title to sign')
        return
      }
    }

    // If setup-only mode and no placeholders created, show error
    if (mode === 'setup' && placeholderElements.length === 0) {
      setError('Please add at least one signature field for signers')
      return
    }

    // If signing mode and no signatures placed, show error
    if (mode === 'sign' && mySignatureElements.length === 0) {
      setError('Please place at least one signature on the document')
      return
    }

    try {
      setSaving(true)
      setError('')

      // NEW FLOW: Don't embed signatures in PDF - pass them separately to be stored in DB
      // The PDF compositing happens on-demand when viewing/downloading the final PDF
      await onSave(
        signerName.trim(),
        signerTitle.trim(),
        signatureDataUrl || '',
        adminSignedElements,
        placeholderElements,
        initialsDataUrl || undefined
      )
    } catch (err) {
      console.error('Error saving signatures:', err)
      setError(err instanceof Error ? err.message : 'Failed to save signatures')
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
                  .map((elem) => {
                    const colors = elem.isPlaceholder && elem.assignedTo
                      ? SIGNER_COLORS[elem.assignedTo]
                      : SIGNER_COLORS.ADMIN

                    return (
                      <div
                        key={elem.id}
                        data-element-id={elem.id}
                        className={`absolute group select-none ${draggingId === elem.id ? 'cursor-grabbing z-50' : 'cursor-grab'}`}
                        style={{
                          left: `${elem.x}%`,
                          top: `${elem.y}%`,
                          transform: 'translate(-50%, -50%)',
                          width: `${elem.width}%`,
                          minHeight: elem.isPlaceholder && !elem.isSigned ? `${elem.height || 6}%` : undefined,
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
                        {/* Placeholder (unsigned) */}
                        {elem.isPlaceholder && !elem.isSigned && (
                          <div
                            className={`w-full h-full min-h-[40px] border-2 border-dashed ${colors.border} ${colors.bgLight} rounded flex items-center justify-center`}
                          >
                            <div className="text-center px-2">
                              <div className={`text-xs font-medium ${colors.text}`}>
                                {elem.label || `${SIGNER_LABELS[elem.assignedTo!]} ${elem.type}`}
                              </div>
                              <div className="text-[10px] text-zinc-500 mt-0.5">
                                {elem.type === 'signature' ? 'Sign here' : elem.type === 'initials' ? 'Initial here' : 'Date'}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Signed element or regular signature */}
                        {elem.dataUrl && (!elem.isPlaceholder || elem.isSigned) && (
                          <img
                            src={elem.dataUrl}
                            alt={`${elem.type} by ${elem.signerName}`}
                            className="w-full h-auto pointer-events-none"
                            draggable={false}
                          />
                        )}

                        {/* Border on hover */}
                        <div className={`absolute inset-0 border-2 border-transparent group-hover:${colors.border} rounded pointer-events-none`} />

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
                          className={`absolute -bottom-2 -right-2 w-4 h-4 ${colors.bg} rounded-full opacity-0 group-hover:opacity-100 cursor-se-resize shadow-lg`}
                          onMouseDown={(e) => handleResizeStart(elem.id, e)}
                        />

                        {/* Type/Signer label */}
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-zinc-500 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                          {elem.isPlaceholder
                            ? `${SIGNER_LABELS[elem.assignedTo!]} - ${elem.type}`
                            : elem.type === 'signature' ? 'Signature' : elem.type === 'initials' ? 'Initials' : 'Date'
                          }
                        </div>
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
          {(() => {
            const signatures = placedElements.filter(e => e.type === 'signature' && !e.isPlaceholder)
            const initials = placedElements.filter(e => e.type === 'initials' && !e.isPlaceholder)
            const dates = placedElements.filter(e => e.type === 'date' && !e.isPlaceholder)
            const placeholders = placedElements.filter(e => e.isPlaceholder)

            const parts = []
            if (signatures.length > 0) parts.push(`${signatures.length} signature(s)`)
            if (initials.length > 0) parts.push(`${initials.length} initials`)
            if (dates.length > 0) parts.push(`${dates.length} date(s)`)
            if (placeholders.length > 0) parts.push(`${placeholders.length} field(s) for others`)

            return parts.length > 0 ? parts.join(', ') : 'Click on document to add elements'
          })()}
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
            disabled={(() => {
              const hasSignatures = placedElements.filter(e => e.type === 'signature' && !e.isPlaceholder).length > 0
              const hasPlaceholders = placedElements.filter(e => e.isPlaceholder).length > 0
              if (mode === 'setup') return !hasPlaceholders || saving
              if (mode === 'sign') return !hasSignatures || saving
              return (!hasSignatures && !hasPlaceholders) || saving
            })()}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              (() => {
                const hasSignatures = placedElements.filter(e => e.type === 'signature' && !e.isPlaceholder).length > 0
                const hasPlaceholders = placedElements.filter(e => e.isPlaceholder).length > 0
                const canSave = mode === 'setup' ? hasPlaceholders : mode === 'sign' ? hasSignatures : (hasSignatures || hasPlaceholders)
                return canSave && !saving
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              })()
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
              {/* Mode Toggle: Sign Now vs Add Placeholder */}
              {(mode === 'both' || mode === 'setup') && currentUserRole === 'admin' && (
                <div className="mb-6">
                  <div className="flex rounded-lg overflow-hidden border border-zinc-700">
                    <button
                      onClick={() => setIsCreatingPlaceholder(false)}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        !isCreatingPlaceholder
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      Sign Now (Me)
                    </button>
                    <button
                      onClick={() => setIsCreatingPlaceholder(true)}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        isCreatingPlaceholder
                          ? 'bg-green-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      Add Field for Others
                    </button>
                  </div>
                </div>
              )}

              {/* Placeholder Creation Mode - Add Field for Others */}
              {isCreatingPlaceholder ? (
                <>
                  {/* Select Team Member / Signer */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Select Signer
                    </label>
                    {loadingSigners ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-zinc-500 text-sm mt-2">Loading team members...</p>
                      </div>
                    ) : signerOptions.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {signerOptions.map((signer) => {
                          const colors = SIGNER_COLORS[signer.assignedTo]
                          const isSelected = selectedSigner?.id === signer.id
                          return (
                            <button
                              key={signer.id}
                              onClick={() => {
                                setSelectedSigner(signer)
                                setPlaceholderAssignedTo(signer.assignedTo)
                              }}
                              className={`w-full px-4 py-3 rounded-lg font-medium transition-colors border-2 text-left ${
                                isSelected
                                  ? `${colors.border} ${colors.bgLight}`
                                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className={`font-medium ${isSelected ? colors.text : 'text-white'}`}>{signer.name}</div>
                                  <div className="text-xs text-zinc-500">
                                    {signer.title || signer.email || (signer.type === 'admin' ? 'Admin' : signer.type === 'client' ? 'Client' : 'Partner')}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {signer.hasSignature && (
                                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                  {isSelected && (
                                    <svg className={`w-5 h-5 ${colors.text}`} fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-zinc-500 text-sm">No team members found</p>
                    )}
                  </div>

                  {/* Show selected signer info */}
                  {selectedSigner && (
                    <div className="mb-6 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-zinc-500 mb-1">Full Legal Name</label>
                          <p className="text-white font-medium">{selectedSigner.name}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-500 mb-1">Title / Position</label>
                          <p className="text-white font-medium">{selectedSigner.title || 'Not set'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Element Type Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Field Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['signature', 'initials', 'date'] as SignatureType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => setCreateType(type)}
                          className={`px-4 py-3 rounded-lg font-medium transition-colors capitalize ${
                            createType === type
                              ? 'bg-blue-600 text-white'
                              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Signature/Initials creation for others */}
                  {selectedSigner && createType !== 'date' && (
                    <>
                      {/* Check if signer has saved signature/initials */}
                      {((createType === 'signature' && selectedSigner.hasSignature) || (createType === 'initials' && selectedSigner.hasInitials)) && (
                        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-green-400 text-sm font-medium">
                              {selectedSigner.name} has a saved {createType} on file
                            </span>
                          </div>
                          <p className="text-zinc-400 text-xs mt-1">
                            You can create a new one below or place a placeholder for them to sign.
                          </p>
                        </div>
                      )}

                      {/* Creation Mode Tabs */}
                      <div className="flex gap-2 mb-4">
                        {(['draw', 'type', 'upload'] as CreateMode[]).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setForOthersCreateMode(mode)}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                              forOthersCreateMode === mode
                                ? 'bg-zinc-700 text-white'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>

                      {/* Draw Mode */}
                      {forOthersCreateMode === 'draw' && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-zinc-400">
                              Draw {selectedSigner.name}&apos;s {createType === 'signature' ? 'Signature' : 'Initials'}
                            </label>
                            <button onClick={handleClearForOthersSignature} className="text-sm text-zinc-500 hover:text-zinc-300">
                              Clear
                            </button>
                          </div>
                          <div className="bg-white rounded-lg border-2 border-zinc-700 overflow-hidden" style={{ touchAction: 'none' }}>
                            <canvas ref={forOthersCanvasRef} className="cursor-crosshair" style={{ display: 'block', touchAction: 'none' }} />
                          </div>
                          <p className="text-zinc-500 text-xs mt-2">
                            This {createType} will be saved to {selectedSigner.name}&apos;s profile.
                          </p>
                        </div>
                      )}

                      {/* Type Mode */}
                      {forOthersCreateMode === 'type' && (
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Type {selectedSigner.name}&apos;s {createType === 'signature' ? 'Signature' : 'Initials'}
                          </label>
                          <input
                            type="text"
                            value={forOthersTypedText}
                            onChange={(e) => setForOthersTypedText(e.target.value)}
                            placeholder={createType === 'initials' ? 'Initials' : selectedSigner.name}
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 mb-4"
                          />

                          <label className="block text-sm font-medium text-zinc-400 mb-2">Font Style</label>
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            {SIGNATURE_FONTS.map((font) => (
                              <button
                                key={font.name}
                                onClick={() => setForOthersSelectedFont(font.name)}
                                className={`p-3 rounded-lg border-2 transition-colors ${
                                  forOthersSelectedFont === font.name
                                    ? 'border-blue-500 bg-zinc-800'
                                    : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                                }`}
                              >
                                <span
                                  style={{ fontFamily: `"${font.name}", ${font.style}`, fontSize: '20px' }}
                                  className="text-white"
                                >
                                  {forOthersTypedText || (createType === 'initials' ? 'AB' : 'Preview')}
                                </span>
                              </button>
                            ))}
                          </div>
                          <p className="text-zinc-500 text-xs">
                            This {createType} will be saved to {selectedSigner.name}&apos;s profile.
                          </p>
                        </div>
                      )}

                      {/* Upload Mode */}
                      {forOthersCreateMode === 'upload' && (
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Upload {selectedSigner.name}&apos;s {createType === 'signature' ? 'Signature' : 'Initials'} Image
                          </label>
                          <input
                            ref={forOthersFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleForOthersFileUpload}
                            className="hidden"
                          />
                          {forOthersDataUrl ? (
                            <div className="p-4 border-2 border-zinc-700 rounded-lg bg-zinc-800">
                              <div className="bg-white rounded p-2 inline-block mb-3">
                                <img src={forOthersDataUrl} alt="Uploaded" className="h-16 w-auto" />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => forOthersFileInputRef.current?.click()}
                                  className="flex-1 px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600"
                                >
                                  Change Image
                                </button>
                                <button
                                  onClick={() => setForOthersDataUrl(null)}
                                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => forOthersFileInputRef.current?.click()}
                              className="w-full p-8 border-2 border-dashed border-zinc-700 rounded-lg text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Click to upload image
                            </button>
                          )}
                          <p className="text-zinc-500 text-xs mt-2">
                            This {createType} will be saved to {selectedSigner.name}&apos;s profile.
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Date field info */}
                  {selectedSigner && createType === 'date' && (
                    <div className="mb-6 p-4 bg-zinc-800 rounded-lg text-center">
                      <p className="text-zinc-400 text-sm mb-2">Date will be added:</p>
                      <p className="text-white text-lg font-medium">
                        {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  )}

                  {/* Preview - only show for placeholder (no signature data) */}
                  {selectedSigner && createType !== 'date' && forOthersIsEmpty && !forOthersTypedText.trim() && !forOthersDataUrl && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Placeholder Preview</label>
                      <div
                        className={`p-4 border-2 border-dashed ${SIGNER_COLORS[placeholderAssignedTo].border} ${SIGNER_COLORS[placeholderAssignedTo].bgLight} rounded-lg text-center`}
                      >
                        <div className={`text-sm font-medium ${SIGNER_COLORS[placeholderAssignedTo].text}`}>
                          {selectedSigner.name}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {selectedSigner.title && <span>{selectedSigner.title} - </span>}
                          {createType === 'signature' ? 'Signature' : 'Initials'} placeholder
                        </div>
                      </div>
                      <p className="text-zinc-500 text-xs mt-2">
                        If you don&apos;t draw/type/upload, a placeholder will be created for {selectedSigner.name} to sign later.
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setClickPosition(null);
                        setIsCreatingPlaceholder(false);
                        setSelectedSigner(null);
                        setForOthersTypedText('');
                        setForOthersDataUrl(null);
                        setForOthersIsEmpty(true);
                        if (forOthersSignaturePad) forOthersSignaturePad.clear();
                      }}
                      className="flex-1 px-6 py-3 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePlaceholder}
                      disabled={!selectedSigner || savingToProfile}
                      className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                        selectedSigner && !savingToProfile
                          ? `${SIGNER_COLORS[placeholderAssignedTo].bg} text-white hover:opacity-90`
                          : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      {savingToProfile ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          {(!forOthersIsEmpty || forOthersTypedText.trim() || forOthersDataUrl) && createType !== 'date'
                            ? `Place ${createType === 'signature' ? 'Signature' : 'Initials'} & Save`
                            : `Place ${createType === 'signature' ? 'Signature' : createType === 'initials' ? 'Initials' : 'Date'} Field`
                          }
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Signer Info - only show when signing (not creating placeholder) */}
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
                <>
                  <div className="mb-6 p-4 bg-zinc-800 rounded-lg text-center">
                    <p className="text-zinc-400 text-sm mb-2">Date will be added:</p>
                    <p className="text-white text-lg font-medium">
                      {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>

                  {/* Actions for Date */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowCreateModal(false); setClickPosition(null) }}
                      className="flex-1 px-6 py-3 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateElement}
                      disabled={!signerName.trim() || !signerTitle.trim()}
                      className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                        signerName.trim() && signerTitle.trim()
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      Place Date
                    </button>
                  </div>
                </>
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

                  {/* Actions for Signing */}
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
                        (createMode === 'draw' && isEmpty) ||
                        (createMode === 'type' && !typedText.trim())
                      }
                      className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                        signerName.trim() && signerTitle.trim() &&
                        ((createMode === 'draw' && !isEmpty) ||
                         (createMode === 'type' && typedText.trim()) ||
                         createMode === 'upload')
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      Place {createType === 'signature' ? 'Signature' : 'Initials'}
                    </button>
                  </div>
                </>
              )}
                </>
              )}
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
