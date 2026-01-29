'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ============================================
// TYPES
// ============================================

interface DocumentFolder {
  id: string
  name: string
  description: string | null
  parentId: string | null
  color: string | null
  icon: string | null
  sortOrder: number
  createdBy: string
  createdAt: string
  updatedAt: string
  _count: {
    documents: number
  }
  children: DocumentFolder[]
}

interface CompanyDocument {
  id: string
  name: string
  description: string | null
  folderId: string | null
  fileUrl: string
  fileKey: string
  fileName: string
  fileSize: number
  fileType: string
  category: string | null
  tags: string[]
  year: number | null
  teamMemberId: string | null
  visibility: string
  uploadedBy: string
  createdAt: string
  updatedAt: string
  folder?: {
    id: string
    name: string
    color: string | null
  } | null
  downloadUrl?: string
}

interface TeamMember {
  id: string
  name: string
  email: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ============================================
// CONSTANTS
// ============================================

const CATEGORIES = [
  { value: 'TAX', label: 'Tax' },
  { value: 'LEGAL', label: 'Legal' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'HR', label: 'HR' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'OPERATIONS', label: 'Operations' },
  { value: 'OTHER', label: 'Other' },
]

const VISIBILITY_OPTIONS = [
  { value: 'ADMIN', label: 'Admin Only' },
  { value: 'TEAM', label: 'Team' },
  { value: 'ALL', label: 'All' },
]

const FOLDER_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1',
]

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  TAX: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
  LEGAL: { bg: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6' },
  CONTRACT: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' },
  HR: { bg: 'rgba(236, 72, 153, 0.15)', text: '#ec4899' },
  FINANCE: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' },
  OPERATIONS: { bg: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4' },
  OTHER: { bg: 'rgba(161, 161, 170, 0.15)', text: '#a1a1aa' },
}

// ============================================
// HELPERS
// ============================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getFileTypeCategory(fileType: string): 'pdf' | 'image' | 'document' | 'spreadsheet' | 'archive' | 'other' {
  if (fileType === 'application/pdf') return 'pdf'
  if (fileType.startsWith('image/')) return 'image'
  if (
    fileType.includes('word') ||
    fileType.includes('document') ||
    fileType === 'text/plain' ||
    fileType === 'text/rtf' ||
    fileType === 'application/rtf'
  ) return 'document'
  if (
    fileType.includes('sheet') ||
    fileType.includes('excel') ||
    fileType === 'text/csv'
  ) return 'spreadsheet'
  if (
    fileType.includes('zip') ||
    fileType.includes('tar') ||
    fileType.includes('gzip') ||
    fileType.includes('rar') ||
    fileType.includes('7z')
  ) return 'archive'
  return 'other'
}

function getCurrentYear(): number {
  return new Date().getFullYear()
}

function getYearOptions(): number[] {
  const current = getCurrentYear()
  const years: number[] = []
  for (let y = current; y >= current - 10; y--) {
    years.push(y)
  }
  return years
}

// ============================================
// SVG ICON COMPONENTS
// ============================================

function FileTypeIcon({ fileType, size = 24 }: { fileType: string; size?: number }) {
  const category = getFileTypeCategory(fileType)

  switch (category) {
    case 'pdf':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M10 12l2 2 2-2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="12" y1="18" x2="12" y2="14" strokeLinecap="round" />
        </svg>
      )
    case 'image':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      )
    case 'document':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      )
    case 'spreadsheet':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="16" y2="17" />
          <line x1="12" y1="9" x2="12" y2="21" />
        </svg>
      )
    case 'archive':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5">
          <polyline points="21 8 21 21 3 21 3 8" />
          <rect x="1" y="3" width="22" height="5" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
      )
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      )
  }
}

function FolderIcon({ color, size = 20 }: { color?: string | null; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color || '#f59e0b'} stroke={color || '#f59e0b'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" fillOpacity="0.2" />
    </svg>
  )
}

function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function UploadIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function GridIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}

function ListIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

function MoreIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  )
}

function ChevronIcon({ direction = 'right', size = 14 }: { direction?: 'right' | 'down'; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: direction === 'down' ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 0.15s',
      }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function CloseIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function DownloadIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function TrashIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  )
}

function EditIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function AllDocumentsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function DragDropIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function AdminDocumentsPage() {
  // Data state
  const [folders, setFolders] = useState<DocumentFolder[]>([])
  const [flatFolders, setFlatFolders] = useState<DocumentFolder[]>([])
  const [documents, setDocuments] = useState<CompanyDocument[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  // Filter state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState('')

  // UI state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isMobile, setIsMobile] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)

  // Modal state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<CompanyDocument | null>(null)
  const [editingFolder, setEditingFolder] = useState<DocumentFolder | null>(null)

  // Folder menu state
  const [folderMenuId, setFolderMenuId] = useState<string | null>(null)
  const [folderMenuPos, setFolderMenuPos] = useState({ x: 0, y: 0 })

  // Search debounce
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // ---- Responsive detection ----
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) setShowSidebar(false)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // ---- Fetch folders ----
  const fetchFolders = useCallback(async () => {
    try {
      const [treeRes, flatRes] = await Promise.all([
        fetch('/api/admin/documents/folders'),
        fetch('/api/admin/documents/folders?flat=true'),
      ])
      if (treeRes.ok) {
        const data = await treeRes.json()
        setFolders(data.folders || [])
      }
      if (flatRes.ok) {
        const data = await flatRes.json()
        setFlatFolders(data.folders || [])
      }
    } catch (error) {
      // Silent fail - folders just won't show
    }
  }, [])

  // ---- Fetch documents ----
  const fetchDocuments = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')

      if (selectedFolderId) {
        params.set('folderId', selectedFolderId)
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim())
      }
      if (categoryFilter) {
        params.set('category', categoryFilter)
      }
      if (yearFilter) {
        params.set('year', yearFilter)
      }
      if (visibilityFilter) {
        params.set('visibility', visibilityFilter)
      }

      const res = await fetch(`/api/admin/documents?${params}`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }, [selectedFolderId, searchQuery, categoryFilter, yearFilter, visibilityFilter])

  // ---- Fetch team members ----
  const fetchTeamMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/team')
      if (res.ok) {
        const data = await res.json()
        setTeamMembers(data.members || data.teamMembers || [])
      }
    } catch {
      // Silent fail
    }
  }, [])

  // ---- Initial data load ----
  useEffect(() => {
    fetchFolders()
    fetchTeamMembers()
  }, [fetchFolders, fetchTeamMembers])

  // ---- Fetch documents on filter change ----
  useEffect(() => {
    fetchDocuments(1)
  }, [fetchDocuments])

  // ---- Debounced search ----
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  // ---- Close folder menu on outside click ----
  useEffect(() => {
    const handler = () => setFolderMenuId(null)
    if (folderMenuId) {
      document.addEventListener('click', handler)
      return () => document.removeEventListener('click', handler)
    }
  }, [folderMenuId])

  // ---- Folder selection ----
  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId)
    if (isMobile) setShowSidebar(false)
  }

  // ---- Document click ----
  const handleDocumentClick = async (doc: CompanyDocument) => {
    try {
      const res = await fetch(`/api/admin/documents/${doc.id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedDocument(data)
        setShowDetailModal(true)
      }
    } catch {
      setSelectedDocument(doc)
      setShowDetailModal(true)
    }
  }

  // ---- Document delete ----
  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document? This cannot be undone.')) return

    try {
      const res = await fetch(`/api/admin/documents/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setShowDetailModal(false)
        setSelectedDocument(null)
        fetchDocuments(pagination.page)
        fetchFolders()
      } else {
        alert('Failed to delete document')
      }
    } catch {
      alert('Failed to delete document')
    }
  }

  // ---- Folder menu actions ----
  const handleFolderMenuAction = (action: 'edit' | 'delete', folder: DocumentFolder) => {
    setFolderMenuId(null)
    if (action === 'edit') {
      setEditingFolder(folder)
      setShowFolderModal(true)
    } else if (action === 'delete') {
      handleDeleteFolder(folder.id)
    }
  }

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this folder? Documents inside will be moved to the parent folder.')) return

    try {
      const res = await fetch(`/api/admin/documents/folders/${id}`, { method: 'DELETE' })
      if (res.ok) {
        if (selectedFolderId === id) {
          setSelectedFolderId(null)
        }
        fetchFolders()
        fetchDocuments(1)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete folder')
      }
    } catch {
      alert('Failed to delete folder')
    }
  }

  // ---- Find current folder name ----
  const getCurrentFolderName = (): string => {
    if (!selectedFolderId) return 'All Documents'
    const found = flatFolders.find(f => f.id === selectedFolderId)
    return found?.name || 'All Documents'
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        marginBottom: '24px',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '16px' : '0',
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: 700, margin: 0 }}>Documents</h1>
          <p style={{ color: '#71717a', margin: 0, fontSize: isMobile ? '14px' : '16px' }}>
            Manage company documents, contracts, and files
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {isMobile && (
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              style={{
                padding: '10px 16px',
                background: '#27272a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FolderIcon size={16} color="#f59e0b" />
              Folders
            </button>
          )}
          <button
            onClick={() => {
              setEditingFolder(null)
              setShowFolderModal(true)
            }}
            style={{
              padding: '10px 16px',
              background: '#27272a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <PlusIcon size={14} />
            New Folder
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <UploadIcon size={14} />
            Upload Document
          </button>
        </div>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div style={{
        display: 'flex',
        gap: '24px',
        alignItems: 'flex-start',
      }}>
        {/* Sidebar - Folder Tree */}
        {(showSidebar || !isMobile) && (
          <div style={{
            width: isMobile ? '100%' : '260px',
            minWidth: isMobile ? 'auto' : '260px',
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '12px',
            position: isMobile ? 'static' : 'sticky',
            top: '100px',
            maxHeight: isMobile ? 'none' : 'calc(100vh - 160px)',
            overflowY: 'auto',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 8px', margin: '0 0 4px 0' }}>
              Folders
            </p>

            {/* All Documents */}
            <button
              onClick={() => handleFolderSelect(null)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                background: selectedFolderId === null ? '#27272a' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: selectedFolderId === null ? '#ffffff' : '#a1a1aa',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
            >
              <AllDocumentsIcon size={16} />
              <span style={{ flex: 1 }}>All Documents</span>
              <span style={{ fontSize: '11px', color: '#71717a' }}>{pagination.total}</span>
            </button>

            {/* Folder Tree */}
            {folders.map(folder => (
              <FolderTreeItem
                key={folder.id}
                folder={folder}
                depth={0}
                selectedFolderId={selectedFolderId}
                onSelect={handleFolderSelect}
                folderMenuId={folderMenuId}
                onMenuOpen={(id, e) => {
                  e.stopPropagation()
                  setFolderMenuId(id === folderMenuId ? null : id)
                  setFolderMenuPos({ x: e.clientX, y: e.clientY })
                }}
                onMenuAction={handleFolderMenuAction}
              />
            ))}

            {folders.length === 0 && (
              <p style={{ fontSize: '12px', color: '#52525b', padding: '12px 10px', margin: 0, textAlign: 'center' }}>
                No folders yet
              </p>
            )}
          </div>
        )}

        {/* Main Content Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Filters Bar */}
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            {/* Search */}
            <div style={{
              flex: 1,
              minWidth: '200px',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#71717a',
                display: 'flex',
              }}>
                <SearchIcon size={16} />
              </div>
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 16px 10px 36px',
                  background: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '10px 12px',
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: categoryFilter ? '#ffffff' : '#71717a',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '120px',
              }}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              style={{
                padding: '10px 12px',
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: yearFilter ? '#ffffff' : '#71717a',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '100px',
              }}
            >
              <option value="">All Years</option>
              {getYearOptions().map(y => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>

            {/* Visibility Filter */}
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              style={{
                padding: '10px 12px',
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: visibilityFilter ? '#ffffff' : '#71717a',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '120px',
              }}
            >
              <option value="">All Visibility</option>
              {VISIBILITY_OPTIONS.map(v => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>

            {/* View Toggle */}
            <div style={{
              display: 'flex',
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              overflow: 'hidden',
            }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '10px 12px',
                  background: viewMode === 'grid' ? '#3b82f6' : 'transparent',
                  border: 'none',
                  color: viewMode === 'grid' ? '#ffffff' : '#71717a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <GridIcon size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '10px 12px',
                  background: viewMode === 'list' ? '#3b82f6' : 'transparent',
                  border: 'none',
                  color: viewMode === 'list' ? '#ffffff' : '#71717a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ListIcon size={14} />
              </button>
            </div>
          </div>

          {/* Current Folder Indicator */}
          {selectedFolderId && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              padding: '8px 12px',
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#a1a1aa',
            }}>
              <FolderIcon size={14} color={flatFolders.find(f => f.id === selectedFolderId)?.color} />
              <span>{getCurrentFolderName()}</span>
              <button
                onClick={() => setSelectedFolderId(null)}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  color: '#71717a',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '2px 6px',
                }}
              >
                Clear
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '300px',
            }}>
              <div style={{ color: '#71717a', fontSize: '14px' }}>Loading documents...</div>
            </div>
          )}

          {/* Empty State */}
          {!loading && documents.length === 0 && (
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '16px',
              padding: '48px 24px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.3,
              }}>
                <AllDocumentsIcon size={24} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                No documents found
              </h3>
              <p style={{ color: '#71717a', margin: '0 0 24px 0', fontSize: '14px' }}>
                {searchQuery || categoryFilter || yearFilter || visibilityFilter
                  ? 'Try adjusting your filters or search query'
                  : 'Upload your first document to get started'
                }
              </p>
              {!searchQuery && !categoryFilter && !yearFilter && !visibilityFilter && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '12px 24px',
                    background: '#3b82f6',
                    color: '#ffffff',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <UploadIcon size={14} />
                  Upload Document
                </button>
              )}
            </div>
          )}

          {/* Documents Grid */}
          {!loading && documents.length > 0 && viewMode === 'grid' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '12px',
            }}>
              {documents.map(doc => (
                <DocumentCard key={doc.id} document={doc} onClick={() => handleDocumentClick(doc)} />
              ))}
            </div>
          )}

          {/* Documents List */}
          {!loading && documents.length > 0 && viewMode === 'list' && (
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              overflow: 'hidden',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #27272a' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Name</th>
                    {!isMobile && <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Source</th>}
                    {!isMobile && <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Category</th>}
                    {!isMobile && <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Folder</th>}
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Size</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => {
                    const sourceColors = doc.source ? SOURCE_COLORS[doc.source] : null
                    const statusColors = doc.contractStatus ? CONTRACT_STATUS_COLORS[doc.contractStatus] : null
                    const subtitle = doc.clientName || doc.partnerName || doc.teamMemberName || doc.fileName
                    return (
                      <tr
                        key={doc.id}
                        onClick={() => handleDocumentClick(doc)}
                        style={{
                          borderBottom: '1px solid #27272a',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#1f1f1f' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileTypeIcon fileType={doc.fileType} size={20} />
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px' }}>{doc.name}</div>
                              <div style={{ fontSize: '12px', color: '#71717a' }}>{subtitle}</div>
                            </div>
                          </div>
                        </td>
                        {!isMobile && (
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {doc.source && sourceColors && (
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  background: sourceColors.bg,
                                  color: sourceColors.text,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  width: 'fit-content',
                                }}>
                                  <SourceIcon source={doc.source} size={10} />
                                  {sourceColors.label}
                                </span>
                              )}
                              {doc.contractStatus && statusColors && (
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: 500,
                                  background: statusColors.bg,
                                  color: statusColors.text,
                                  width: 'fit-content',
                                }}>
                                  {doc.contractStatus}
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                        {!isMobile && (
                          <td style={{ padding: '12px 16px' }}>
                            {doc.category && (
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 500,
                                background: CATEGORY_COLORS[doc.category]?.bg || CATEGORY_COLORS.OTHER.bg,
                                color: CATEGORY_COLORS[doc.category]?.text || CATEGORY_COLORS.OTHER.text,
                              }}>
                                {doc.category}
                              </span>
                            )}
                          </td>
                        )}
                        {!isMobile && (
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#a1a1aa' }}>
                            {doc.folder ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FolderIcon size={12} color={doc.folder.color} />
                                {doc.folder.name}
                              </span>
                            ) : (
                              <span style={{ color: '#52525b' }}>--</span>
                            )}
                          </td>
                        )}
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#a1a1aa' }}>{formatFileSize(doc.fileSize)}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#a1a1aa' }}>{formatDate(doc.createdAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              marginTop: '24px',
            }}>
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchDocuments(pagination.page - 1)}
                style={{
                  padding: '8px 14px',
                  background: '#27272a',
                  color: pagination.page <= 1 ? '#52525b' : '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: '13px', color: '#a1a1aa' }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchDocuments(pagination.page + 1)}
                style={{
                  padding: '8px 14px',
                  background: '#27272a',
                  color: pagination.page >= pagination.totalPages ? '#52525b' : '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========== MODALS ========== */}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <UploadDocumentModal
          flatFolders={flatFolders}
          teamMembers={teamMembers}
          selectedFolderId={selectedFolderId}
          onClose={() => setShowUploadModal(false)}
          onUploaded={() => {
            setShowUploadModal(false)
            fetchDocuments(1)
            fetchFolders()
            fetchSourceCounts()
          }}
        />
      )}

      {/* Folder Create/Edit Modal */}
      {showFolderModal && (
        <FolderModal
          editingFolder={editingFolder}
          flatFolders={flatFolders}
          onClose={() => {
            setShowFolderModal(false)
            setEditingFolder(null)
          }}
          onSaved={() => {
            setShowFolderModal(false)
            setEditingFolder(null)
            fetchFolders()
          }}
        />
      )}

      {/* Document Detail Modal */}
      {showDetailModal && selectedDocument && (
        <DocumentDetailModal
          document={selectedDocument}
          flatFolders={flatFolders}
          teamMembers={teamMembers}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedDocument(null)
          }}
          onUpdated={() => {
            fetchDocuments(pagination.page)
            fetchFolders()
          }}
          onDelete={() => handleDeleteDocument(selectedDocument.id)}
        />
      )}

      {/* Folder Context Menu */}
      {folderMenuId && (
        <div
          style={{
            position: 'fixed',
            top: folderMenuPos.y,
            left: folderMenuPos.x,
            background: '#27272a',
            border: '1px solid #3f3f46',
            borderRadius: '8px',
            padding: '4px',
            zIndex: 200,
            minWidth: '120px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              const folder = flatFolders.find(f => f.id === folderMenuId)
              if (folder) handleFolderMenuAction('edit', folder)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '13px',
              cursor: 'pointer',
              borderRadius: '4px',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#3f3f46' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <EditIcon size={14} />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              const folder = flatFolders.find(f => f.id === folderMenuId)
              if (folder) handleFolderMenuAction('delete', folder)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              fontSize: '13px',
              cursor: 'pointer',
              borderRadius: '4px',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#3f3f46' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <TrashIcon size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================
// FOLDER TREE ITEM
// ============================================

function FolderTreeItem({
  folder,
  depth,
  selectedFolderId,
  onSelect,
  folderMenuId,
  onMenuOpen,
  onMenuAction,
}: {
  folder: DocumentFolder
  depth: number
  selectedFolderId: string | null
  onSelect: (id: string) => void
  folderMenuId: string | null
  onMenuOpen: (id: string, e: React.MouseEvent) => void
  onMenuAction: (action: 'edit' | 'delete', folder: DocumentFolder) => void
}) {
  const [expanded, setExpanded] = useState(depth < 1)
  const hasChildren = folder.children && folder.children.length > 0
  const isSelected = selectedFolderId === folder.id

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 8px',
          paddingLeft: `${8 + depth * 16}px`,
          background: isSelected ? '#27272a' : 'transparent',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'background 0.15s',
          marginBottom: '1px',
        }}
        onClick={() => onSelect(folder.id)}
        onContextMenu={(e) => {
          e.preventDefault()
          onMenuOpen(folder.id, e)
        }}
        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#1f1f1f' }}
        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
      >
        {/* Expand toggle */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#71717a',
              cursor: 'pointer',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              width: '16px',
              justifyContent: 'center',
            }}
          >
            <ChevronIcon direction={expanded ? 'down' : 'right'} size={12} />
          </button>
        ) : (
          <div style={{ width: '16px' }} />
        )}

        <FolderIcon size={14} color={folder.color} />
        <span style={{
          flex: 1,
          fontSize: '13px',
          color: isSelected ? '#ffffff' : '#a1a1aa',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {folder.name}
        </span>
        <span style={{ fontSize: '10px', color: '#52525b' }}>
          {folder._count.documents}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMenuOpen(folder.id, e)
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#52525b',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.6,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6' }}
        >
          <MoreIcon size={12} />
        </button>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {folder.children.map(child => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              folderMenuId={folderMenuId}
              onMenuOpen={onMenuOpen}
              onMenuAction={onMenuAction}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// DOCUMENT CARD
// ============================================

function DocumentCard({ document: doc, onClick }: { document: CompanyDocument; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#3f3f46'
        e.currentTarget.style.background = '#1f1f1f'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#27272a'
        e.currentTarget.style.background = '#18181b'
      }}
    >
      {/* File Icon + Name */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          background: '#27272a',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <FileTypeIcon fileType={doc.fileType} size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '2px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {doc.name}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#71717a',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {doc.fileName}
          </div>
        </div>
      </div>

      {/* Meta Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: '10px',
      }}>
        {doc.category && (
          <span style={{
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            background: CATEGORY_COLORS[doc.category]?.bg || CATEGORY_COLORS.OTHER.bg,
            color: CATEGORY_COLORS[doc.category]?.text || CATEGORY_COLORS.OTHER.text,
          }}>
            {doc.category}
          </span>
        )}
        {doc.year && (
          <span style={{
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '11px',
            background: 'rgba(255,255,255,0.05)',
            color: '#a1a1aa',
          }}>
            {doc.year}
          </span>
        )}
        {doc.visibility !== 'ADMIN' && (
          <span style={{
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '11px',
            background: 'rgba(59, 130, 246, 0.1)',
            color: '#60a5fa',
          }}>
            {doc.visibility}
          </span>
        )}
      </div>

      {/* Bottom Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '10px',
        borderTop: '1px solid #27272a',
        fontSize: '12px',
        color: '#71717a',
      }}>
        <span>{formatFileSize(doc.fileSize)}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {doc.folder && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <FolderIcon size={10} color={doc.folder.color} />
              {doc.folder.name}
            </span>
          )}
          <span>{formatDate(doc.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// UPLOAD DOCUMENT MODAL
// ============================================

function UploadDocumentModal({
  flatFolders,
  teamMembers,
  selectedFolderId,
  onClose,
  onUploaded,
}: {
  flatFolders: DocumentFolder[]
  teamMembers: TeamMember[]
  selectedFolderId: string | null
  onClose: () => void
  onUploaded: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [folderId, setFolderId] = useState(selectedFolderId || '')
  const [year, setYear] = useState('')
  const [teamMemberId, setTeamMemberId] = useState('')
  const [visibility, setVisibility] = useState('ADMIN')
  const [tagsInput, setTagsInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    if (!name) {
      // Auto-fill name from filename without extension
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '')
      setName(nameWithoutExt)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) handleFileSelect(droppedFile)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => {
    setDragActive(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', name || file.name)
      if (description) formData.append('description', description)
      if (category) formData.append('category', category)
      if (folderId) formData.append('folderId', folderId)
      if (year) formData.append('year', year)
      if (teamMemberId) formData.append('teamMemberId', teamMemberId)
      formData.append('visibility', visibility)
      if (tagsInput.trim()) formData.append('tags', tagsInput.trim())

      const res = await fetch('/api/admin/documents', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        onUploaded()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to upload document')
      }
    } catch {
      alert('Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px',
    }}>
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Upload Document</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px' }}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{
              border: `2px dashed ${dragActive ? '#3b82f6' : '#3f3f46'}`,
              borderRadius: '12px',
              padding: '32px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragActive ? 'rgba(59, 130, 246, 0.05)' : '#0a0a0a',
              transition: 'all 0.2s',
              marginBottom: '20px',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFileSelect(f)
              }}
              style={{ display: 'none' }}
            />
            {file ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                  <FileTypeIcon fileType={file.type} size={20} />
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{file.name}</span>
                </div>
                <span style={{ fontSize: '12px', color: '#71717a' }}>{formatFileSize(file.size)}</span>
              </div>
            ) : (
              <div>
                <div style={{ color: '#52525b', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                  <DragDropIcon size={36} />
                </div>
                <p style={{ fontSize: '14px', color: '#a1a1aa', margin: '0 0 4px 0' }}>
                  Drag and drop a file here, or click to browse
                </p>
                <p style={{ fontSize: '12px', color: '#52525b', margin: 0 }}>
                  Maximum file size: 50MB
                </p>
              </div>
            )}
          </div>

          {/* Name */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>
              Document Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter document name"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#0a0a0a',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#0a0a0a',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Row: Category + Year */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: '#0a0a0a',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: category ? '#ffffff' : '#71717a',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select category</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>
                Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: '#0a0a0a',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: year ? '#ffffff' : '#71717a',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select year</option>
                {getYearOptions().map(y => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Folder */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>
              Folder
            </label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#0a0a0a',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: folderId ? '#ffffff' : '#71717a',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">No folder (root)</option>
              {flatFolders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Row: Visibility + Team Member */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: '#0a0a0a',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {VISIBILITY_OPTIONS.map(v => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>
                Team Member
              </label>
              <select
                value={teamMemberId}
                onChange={(e) => setTeamMemberId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: '#0a0a0a',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: teamMemberId ? '#ffffff' : '#71717a',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">None</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. important, 2024, quarterly"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#0a0a0a',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                background: '#27272a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              style={{
                padding: '12px 24px',
                background: !file || uploading ? '#27272a' : '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: !file || uploading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <UploadIcon size={14} />
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================
// FOLDER CREATE/EDIT MODAL
// ============================================

function FolderModal({
  editingFolder,
  flatFolders,
  onClose,
  onSaved,
}: {
  editingFolder: DocumentFolder | null
  flatFolders: DocumentFolder[]
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(editingFolder?.name || '')
  const [description, setDescription] = useState(editingFolder?.description || '')
  const [parentId, setParentId] = useState(editingFolder?.parentId || '')
  const [color, setColor] = useState(editingFolder?.color || FOLDER_COLORS[0])
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    try {
      const url = editingFolder
        ? `/api/admin/documents/folders/${editingFolder.id}`
        : '/api/admin/documents/folders'
      const method = editingFolder ? 'PATCH' : 'POST'

      const body: any = {
        name: name.trim(),
        description: description || null,
        parentId: parentId || null,
        color: color || null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        onSaved()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save folder')
      }
    } catch {
      alert('Failed to save folder')
    } finally {
      setSaving(false)
    }
  }

  // Filter out current folder and its descendants for parent selection
  const availableParents = flatFolders.filter(f => {
    if (!editingFolder) return true
    return f.id !== editingFolder.id
  })

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px',
    }}>
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        maxWidth: '480px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>
            {editingFolder ? 'Edit Folder' : 'Create Folder'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px' }}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>
              Folder Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tax Documents"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#0a0a0a',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#0a0a0a',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Parent Folder */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>
              Parent Folder
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#0a0a0a',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: parentId ? '#ffffff' : '#71717a',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">None (root level)</option>
              {availableParents.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Color Picker */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '8px' }}>
              Color
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {FOLDER_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: c,
                    border: color === c ? '2px solid #ffffff' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                background: '#27272a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              style={{
                padding: '12px 24px',
                background: saving || !name.trim() ? '#27272a' : '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: saving || !name.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : editingFolder ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================
// DOCUMENT DETAIL MODAL
// ============================================

function DocumentDetailModal({
  document: doc,
  flatFolders,
  teamMembers,
  onClose,
  onUpdated,
  onDelete,
}: {
  document: CompanyDocument
  flatFolders: DocumentFolder[]
  teamMembers: TeamMember[]
  onClose: () => void
  onUpdated: () => void
  onDelete: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(doc.name)
  const [description, setDescription] = useState(doc.description || '')
  const [category, setCategory] = useState(doc.category || '')
  const [folderId, setFolderId] = useState(doc.folderId || '')
  const [year, setYear] = useState(doc.year ? String(doc.year) : '')
  const [teamMemberId, setTeamMemberId] = useState(doc.teamMemberId || '')
  const [visibility, setVisibility] = useState(doc.visibility)
  const [tagsInput, setTagsInput] = useState(Array.isArray(doc.tags) ? doc.tags.join(', ') : '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          category: category || null,
          folderId: folderId || null,
          year: year || null,
          teamMemberId: teamMemberId || null,
          visibility,
          tags: tagsInput,
        }),
      })

      if (res.ok) {
        setIsEditing(false)
        onUpdated()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update document')
      }
    } catch {
      alert('Failed to update document')
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = () => {
    const url = doc.downloadUrl || doc.fileUrl
    if (url) {
      window.open(url, '_blank')
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px',
    }}>
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            <div style={{
              width: '44px',
              height: '44px',
              background: '#27272a',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <FileTypeIcon fileType={doc.fileType} size={24} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    background: '#0a0a0a',
                    border: '1px solid #3f3f46',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '18px',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              ) : (
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {doc.name}
                </h2>
              )}
              <p style={{ fontSize: '12px', color: '#71717a', margin: '2px 0 0 0' }}>{doc.fileName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Source Badge (if from multi-source) */}
        {doc.source && SOURCE_COLORS[doc.source] && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            padding: '10px 14px',
            background: SOURCE_COLORS[doc.source].bg,
            borderRadius: '8px',
            border: `1px solid ${SOURCE_COLORS[doc.source].text}20`,
          }}>
            <span style={{ color: SOURCE_COLORS[doc.source].text }}>
              <SourceIcon source={doc.source} size={18} />
            </span>
            <span style={{ color: SOURCE_COLORS[doc.source].text, fontWeight: 500, fontSize: '13px' }}>
              {SOURCE_OPTIONS.find(s => s.value === doc.source)?.label || doc.source}
            </span>
            {doc.contractStatus && (
              <span style={{
                marginLeft: 'auto',
                padding: '3px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                background: CONTRACT_STATUS_COLORS[doc.contractStatus]?.bg || '#27272a',
                color: CONTRACT_STATUS_COLORS[doc.contractStatus]?.text || '#a1a1aa',
              }}>
                {doc.contractStatus}
              </span>
            )}
          </div>
        )}

        {/* Contract/Partner/Team Info Section */}
        {(doc.clientName || doc.partnerName || doc.teamMemberName || doc.contractValue) && (
          <div style={{
            background: '#0a0a0a',
            borderRadius: '10px',
            padding: '14px',
            marginBottom: '16px',
          }}>
            {doc.clientName && (
              <div style={{ marginBottom: doc.contractValue ? '10px' : 0 }}>
                <p style={{ fontSize: '11px', color: '#71717a', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Client</p>
                <p style={{ fontSize: '14px', margin: 0, fontWeight: 500 }}>{doc.clientName}</p>
              </div>
            )}
            {doc.partnerName && (
              <div style={{ marginBottom: doc.contractValue ? '10px' : 0 }}>
                <p style={{ fontSize: '11px', color: '#71717a', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Partner</p>
                <p style={{ fontSize: '14px', margin: 0, fontWeight: 500 }}>{doc.partnerName}</p>
              </div>
            )}
            {doc.teamMemberName && (
              <div style={{ marginBottom: doc.contractValue ? '10px' : 0 }}>
                <p style={{ fontSize: '11px', color: '#71717a', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Team Member</p>
                <p style={{ fontSize: '14px', margin: 0, fontWeight: 500 }}>{doc.teamMemberName}</p>
              </div>
            )}
            {doc.contractValue !== undefined && doc.contractValue > 0 && (
              <div>
                <p style={{ fontSize: '11px', color: '#71717a', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Contract Value</p>
                <p style={{ fontSize: '14px', margin: 0, fontWeight: 600, color: '#10b981' }}>
                  ${doc.contractValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* File Info */}
        <div style={{
          background: '#0a0a0a',
          borderRadius: '10px',
          padding: '14px',
          marginBottom: '16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
        }}>
          <div>
            <p style={{ fontSize: '11px', color: '#71717a', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Size</p>
            <p style={{ fontSize: '13px', margin: 0 }}>{formatFileSize(doc.fileSize)}</p>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#71717a', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Type</p>
            <p style={{ fontSize: '13px', margin: 0 }}>{doc.fileType || 'Unknown'}</p>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#71717a', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Uploaded</p>
            <p style={{ fontSize: '13px', margin: 0 }}>{formatDate(doc.createdAt)}</p>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#71717a', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Updated</p>
            <p style={{ fontSize: '13px', margin: 0 }}>{formatDate(doc.updatedAt)}</p>
          </div>
        </div>

        {/* Editable Fields */}
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#0a0a0a',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#0a0a0a', border: '1px solid #27272a', borderRadius: '8px', color: category ? '#ffffff' : '#71717a', fontSize: '13px', outline: 'none' }}>
                  <option value="">None</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Year</label>
                <select value={year} onChange={(e) => setYear(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#0a0a0a', border: '1px solid #27272a', borderRadius: '8px', color: year ? '#ffffff' : '#71717a', fontSize: '13px', outline: 'none' }}>
                  <option value="">None</option>
                  {getYearOptions().map(y => <option key={y} value={String(y)}>{y}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Folder</label>
              <select value={folderId} onChange={(e) => setFolderId(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#0a0a0a', border: '1px solid #27272a', borderRadius: '8px', color: folderId ? '#ffffff' : '#71717a', fontSize: '13px', outline: 'none' }}>
                <option value="">No folder</option>
                {flatFolders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Visibility</label>
                <select value={visibility} onChange={(e) => setVisibility(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#0a0a0a', border: '1px solid #27272a', borderRadius: '8px', color: '#ffffff', fontSize: '13px', outline: 'none' }}>
                  {VISIBILITY_OPTIONS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Team Member</label>
                <select value={teamMemberId} onChange={(e) => setTeamMemberId(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#0a0a0a', border: '1px solid #27272a', borderRadius: '8px', color: teamMemberId ? '#ffffff' : '#71717a', fontSize: '13px', outline: 'none' }}>
                  <option value="">None</option>
                  {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Tags (comma-separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: '#0a0a0a', border: '1px solid #27272a', borderRadius: '8px', color: '#ffffff', fontSize: '13px', outline: 'none' }}
              />
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '16px' }}>
            {/* Description */}
            {doc.description && (
              <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '0 0 12px 0' }}>{doc.description}</p>
            )}

            {/* Metadata */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {doc.category && (
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 500,
                  background: CATEGORY_COLORS[doc.category]?.bg || CATEGORY_COLORS.OTHER.bg,
                  color: CATEGORY_COLORS[doc.category]?.text || CATEGORY_COLORS.OTHER.text,
                }}>
                  {doc.category}
                </span>
              )}
              {doc.year && (
                <span style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', color: '#a1a1aa' }}>
                  {doc.year}
                </span>
              )}
              <span style={{
                padding: '3px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                background: doc.visibility === 'ADMIN' ? 'rgba(239, 68, 68, 0.1)' : doc.visibility === 'TEAM' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                color: doc.visibility === 'ADMIN' ? '#ef4444' : doc.visibility === 'TEAM' ? '#60a5fa' : '#10b981',
              }}>
                {VISIBILITY_OPTIONS.find(v => v.value === doc.visibility)?.label || doc.visibility}
              </span>
            </div>

            {/* Folder */}
            {doc.folder && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#a1a1aa', marginBottom: '8px' }}>
                <FolderIcon size={14} color={doc.folder.color} />
                <span>{doc.folder.name}</span>
              </div>
            )}

            {/* Tags */}
            {Array.isArray(doc.tags) && doc.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                {doc.tags.map((tag, i) => (
                  <span key={i} style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    background: '#27272a',
                    color: '#a1a1aa',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '10px',
          paddingTop: '16px',
          borderTop: '1px solid #27272a',
          flexWrap: 'wrap',
        }}>
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  padding: '10px 20px',
                  background: '#27272a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  background: saving ? '#27272a' : '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDownload}
                style={{
                  padding: '10px 20px',
                  background: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <DownloadIcon size={14} />
                Download
              </button>
              {/* View Full Contract button for contract documents */}
              {doc.contractId && (doc.source === 'contracts' || doc.source === 'partner-contracts') && (
                <button
                  onClick={() => {
                    const contractPath = doc.source === 'partner-contracts'
                      ? `/admin/partners/contracts/${doc.contractId}`
                      : `/admin/contracts/${doc.contractId}`
                    window.open(contractPath, '_blank')
                  }}
                  style={{
                    padding: '10px 20px',
                    background: SOURCE_COLORS[doc.source]?.bg || '#27272a',
                    color: SOURCE_COLORS[doc.source]?.text || '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ExternalLinkIcon size={14} />
                  View Full Contract
                </button>
              )}
              {/* Only show Edit for company documents */}
              {(!doc.source || doc.source === 'company') && (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '10px 20px',
                    background: '#27272a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <EditIcon size={14} />
                  Edit
                </button>
              )}
              {/* Only show Delete for company documents */}
              {(!doc.source || doc.source === 'company') && (
                <button
                  onClick={onDelete}
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginLeft: 'auto',
                  }}
                >
                  <TrashIcon size={14} />
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
