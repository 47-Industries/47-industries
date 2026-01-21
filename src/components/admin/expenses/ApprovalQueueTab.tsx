'use client'

import { useState, useEffect, useCallback } from 'react'

interface ProposedBill {
  id: string
  source: string
  emailSubject: string | null
  emailFrom: string
  emailDate: string | null
  vendor: string | null
  vendorType: string | null
  amount: number | null
  dueDate: string | null
  isPaid: boolean
  confidence: number
  status: string
  matchedRecurringBillId: string | null
  createdAt: string
}

interface BankTransaction {
  id: string
  stripeTransactionId: string
  amount: number
  description: string | null
  merchantName: string | null
  transactedAt: string
  status: string
  financialAccount: {
    institutionName: string
    accountLast4: string | null
  }
}

// Unified item for display
interface ApprovalItem {
  id: string
  type: 'email' | 'bank'
  vendor: string
  description: string
  displayName: string | null // Clean name set by user
  amount: number | null
  date: string
  source: string
  confidence?: number
  status: string
  original: ProposedBill | BankTransaction
}

interface ApprovalQueueTabProps {
  onCountChange: (count: number) => void
}

export default function ApprovalQueueTab({ onCountChange }: ApprovalQueueTabProps) {
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [items, setItems] = useState<ApprovalItem[]>([])
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'SKIPPED' | 'ALL'>('PENDING')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'email' | 'bank'>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [processing, setProcessing] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [offset, setOffset] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const PAGE_SIZE = 100

  // Recurring expense options (per item)
  const [recurringOptions, setRecurringOptions] = useState<Record<string, {
    vendor: string
    createRecurring: boolean
    autoApprove: boolean
  }>>({})

  // Skip modal state
  const [skipModalItem, setSkipModalItem] = useState<ApprovalItem | null>(null)
  const [skipRuleType, setSkipRuleType] = useState<'NONE' | 'VENDOR' | 'VENDOR_AMOUNT' | 'DESCRIPTION_PATTERN'>('NONE')
  const [skipOnlyThisAccount, setSkipOnlyThisAccount] = useState(false)
  const [skipTransactionType, setSkipTransactionType] = useState<'BOTH' | 'INCOME' | 'EXPENSE'>('BOTH')
  const [skipAmountMode, setSkipAmountMode] = useState<'EXACT' | 'RANGE'>('EXACT')
  const [skipAmountMin, setSkipAmountMin] = useState('')
  const [skipAmountMax, setSkipAmountMax] = useState('')
  const [skipDisplayName, setSkipDisplayName] = useState('')
  const [skipVendorOverride, setSkipVendorOverride] = useState('') // Custom vendor name for rules
  const [skipAmountOverride, setSkipAmountOverride] = useState('') // Custom exact amount for rules
  const [skipPatternOverride, setSkipPatternOverride] = useState('') // Custom text pattern

  // Approve modal state
  const [approveModalItem, setApproveModalItem] = useState<ApprovalItem | null>(null)
  const [approveVendor, setApproveVendor] = useState('') // Vendor name for this bill
  const [approveVendorType, setApproveVendorType] = useState('OTHER')
  const [approveCreateRecurring, setApproveCreateRecurring] = useState(false)
  const [approveAutoApprove, setApproveAutoApprove] = useState(false)
  const [approveRuleType, setApproveRuleType] = useState<'NONE' | 'VENDOR' | 'VENDOR_AMOUNT' | 'DESCRIPTION_PATTERN'>('NONE')
  const [approveAmountMode, setApproveAmountMode] = useState<'EXACT' | 'RANGE'>('EXACT')
  const [approveAmountMin, setApproveAmountMin] = useState('')
  const [approveAmountMax, setApproveAmountMax] = useState('')
  const [approveVendorPattern, setApproveVendorPattern] = useState('') // Pattern to match for auto-approve
  const [approvePatternOverride, setApprovePatternOverride] = useState('') // Custom text pattern for DESCRIPTION_PATTERN
  const [approveDisplayName, setApproveDisplayName] = useState('') // Display name for future matches
  const [approveAutoRename, setApproveAutoRename] = useState(false) // Whether to auto-rename matches

  // Quick mode (Shift held)
  const [quickMode, setQuickMode] = useState(false)

  // Track Shift key for quick mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setQuickMode(true)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setQuickMode(false)
    }
    const handleBlur = () => setQuickMode(false)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  // Remove items from list locally (no scroll reset)
  const removeItemsFromList = (idsToRemove: string | string[]) => {
    const ids = Array.isArray(idsToRemove) ? idsToRemove : [idsToRemove]
    setItems(prev => prev.filter(item => !ids.includes(item.id)))
    setSelectedIds(prev => {
      const next = new Set(prev)
      ids.forEach(id => next.delete(id))
      return next
    })
    // Update count
    if (onCountChange) {
      setTotalCount(prev => {
        const newCount = Math.max(0, prev - ids.length)
        onCountChange(newCount)
        return newCount
      })
    }
  }

  useEffect(() => {
    // Reset and fetch when status filter changes
    setOffset(0)
    setItems([])
    fetchItems(0, true)
  }, [statusFilter])

  const transformItems = (data: any): ApprovalItem[] => {
    // Transform email bills
    const emailItems: ApprovalItem[] = (data.proposedBills || []).map((bill: ProposedBill) => ({
      id: `email-${bill.id}`,
      type: 'email' as const,
      vendor: bill.vendor || 'Unknown Vendor',
      description: bill.emailSubject || bill.emailFrom,
      displayName: null,
      amount: bill.amount,
      date: bill.emailDate || bill.createdAt,
      source: bill.source,
      confidence: bill.confidence,
      status: bill.status,
      original: bill
    }))

    // Transform bank transactions
    const bankItems: ApprovalItem[] = (data.bankTransactions || []).map((txn: any) => ({
      id: `bank-${txn.id}`,
      type: 'bank' as const,
      vendor: txn.displayName || txn.merchantName || txn.description || 'Bank Transaction',
      description: txn.description || '',
      displayName: txn.displayName || null,
      amount: Math.abs(txn.amount),
      date: txn.transactedAt,
      source: `${txn.financialAccount.institutionName}${txn.financialAccount.accountLast4 ? ` ****${txn.financialAccount.accountLast4}` : ''}`,
      status: txn.approvalStatus || 'PENDING',
      original: txn
    }))

    // Combine and sort by date
    return [...emailItems, ...bankItems].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }

  const fetchItems = async (fetchOffset: number = 0, isInitial: boolean = false) => {
    if (isInitial) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const res = await fetch(`/api/admin/proposed-bills?status=${statusFilter}&limit=${PAGE_SIZE}&offset=${fetchOffset}`)
      if (res.ok) {
        const data = await res.json()
        const newItems = transformItems(data)

        if (isInitial) {
          setItems(newItems)
        } else {
          // Append new items, avoiding duplicates
          setItems(prev => {
            const existingIds = new Set(prev.map(i => i.id))
            const uniqueNew = newItems.filter(i => !existingIds.has(i.id))
            return [...prev, ...uniqueNew]
          })
        }

        setTotalCount(data.total || 0)
        setHasMore(newItems.length === PAGE_SIZE && (fetchOffset + newItems.length) < (data.total || 0))
        setOffset(fetchOffset + newItems.length)
        onCountChange(data.pendingCount || 0)
      }
    } catch (err) {
      setError('Failed to fetch items')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchItems(offset, false)
    }
  }

  const getRecurringOptions = (item: ApprovalItem) => {
    return recurringOptions[item.id] || {
      vendor: item.vendor,
      createRecurring: false,
      autoApprove: false
    }
  }

  const setRecurringOption = (itemId: string, key: string, value: any) => {
    setRecurringOptions(prev => ({
      ...prev,
      [itemId]: {
        ...getRecurringOptions({ id: itemId } as ApprovalItem),
        [key]: value
      }
    }))
  }

  const handleApprove = async (item: ApprovalItem, enableAutoApprove: boolean = false) => {
    setProcessing(item.id)
    setError('')
    setSuccess('')

    try {
      let res: Response
      const opts = getRecurringOptions(item)

      if (item.type === 'email') {
        const billId = item.id.replace('email-', '')
        res = await fetch(`/api/admin/proposed-bills/${billId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enableAutoApprove })
        })
      } else {
        const txnId = item.id.replace('bank-', '')
        res = await fetch(`/api/admin/financial-connections/transactions/${txnId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendor: opts.vendor,
            createRecurring: opts.createRecurring,
            autoApprove: opts.autoApprove
          })
        })
      }

      if (res.ok) {
        const data = await res.json()
        if (data.recurringCreated) {
          setSuccess('Expense approved and recurring expense created')
        } else {
          setSuccess('Expense approved')
        }
        removeItemsFromList(item.id)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to approve')
      }
    } catch (err) {
      setError('Failed to approve')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (item: ApprovalItem, reason?: string) => {
    setProcessing(item.id)
    try {
      const billId = item.id.replace('email-', '')
      const res = await fetch(`/api/admin/proposed-bills/${billId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      if (res.ok) {
        removeItemsFromList(item.id)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to reject')
      }
    } catch (err) {
      setError('Failed to reject')
    } finally {
      setProcessing(null)
    }
  }

  const openSkipModal = (item: ApprovalItem) => {
    setSkipModalItem(item)
    setSkipRuleType('NONE')
    setSkipOnlyThisAccount(false)
    // Determine if income or expense based on amount (positive = income for bank)
    const isIncome = (item.original as any).amount > 0
    setSkipTransactionType(isIncome ? 'INCOME' : 'EXPENSE')
    setSkipAmountMode('EXACT')
    setSkipAmountMin('')
    setSkipAmountMax('')
    setSkipDisplayName('') // Reset display name
    // Initialize override fields with current values
    setSkipVendorOverride(item.vendor)
    setSkipAmountOverride(item.amount?.toString() || '')
    // Extract first word of description for default pattern
    const firstWord = (item.description || item.vendor).split(' ')[0]
    setSkipPatternOverride(firstWord)
  }

  const openApproveModal = (item: ApprovalItem) => {
    setApproveModalItem(item)
    setApproveVendor(item.vendor) // Default vendor name for this bill
    setApproveVendorType('OTHER')
    setApproveCreateRecurring(false)
    setApproveAutoApprove(false)
    setApproveRuleType('NONE')
    setApproveAmountMode('EXACT')
    setApproveAmountMin('')
    setApproveAmountMax('')
    // Extract pattern from description for matching
    const desc = item.description || item.vendor
    const pattern = desc.split(' ').slice(0, 3).join(' ').replace(/\d{4,}/g, '').trim()
    setApproveVendorPattern(pattern)
    // Extract first word for text pattern default
    const firstWord = desc.split(' ')[0]
    setApprovePatternOverride(firstWord)
    setApproveDisplayName('') // Empty = no auto-rename
    setApproveAutoRename(false)
  }

  const handleApproveFromModal = async () => {
    if (!approveModalItem) return

    setProcessing(approveModalItem.id)
    setError('')
    setSuccess('')

    try {
      let res: Response

      // Determine the pattern to use based on rule type
      const patternToUse = approveRuleType === 'DESCRIPTION_PATTERN'
        ? approvePatternOverride.trim()
        : approveVendorPattern.trim()

      if (approveModalItem.type === 'email') {
        // Email bills now get the same full options as bank transactions
        const billId = approveModalItem.id.replace('email-', '')
        res = await fetch(`/api/admin/proposed-bills/${billId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendor: approveVendor,
            vendorType: approveVendorType,
            createRecurring: approveCreateRecurring,
            autoApprove: approveAutoApprove,
            createAutoApproveRule: approveRuleType !== 'NONE',
            ruleType: approveRuleType,
            amountMode: approveAmountMode,
            amountMin: approveAmountMode === 'RANGE' && approveAmountMin ? parseFloat(approveAmountMin) : null,
            amountMax: approveAmountMode === 'RANGE' && approveAmountMax ? parseFloat(approveAmountMax) : null,
            vendorPattern: patternToUse || null,
            patternOverride: approveRuleType === 'DESCRIPTION_PATTERN' ? approvePatternOverride.trim() : null,
            displayName: approveAutoRename && approveDisplayName.trim() ? approveDisplayName.trim() : null
          })
        })
      } else {
        const txnId = approveModalItem.id.replace('bank-', '')
        res = await fetch(`/api/admin/financial-connections/transactions/${txnId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendor: approveVendor,
            vendorType: approveVendorType,
            createRecurring: approveCreateRecurring,
            autoApprove: approveAutoApprove,
            createAutoApproveRule: approveRuleType !== 'NONE',
            ruleType: approveRuleType,
            amountMode: approveAmountMode,
            amountMin: approveAmountMode === 'RANGE' && approveAmountMin ? parseFloat(approveAmountMin) : null,
            amountMax: approveAmountMode === 'RANGE' && approveAmountMax ? parseFloat(approveAmountMax) : null,
            // Separate pattern and display name
            vendorPattern: patternToUse || null,
            patternOverride: approveRuleType === 'DESCRIPTION_PATTERN' ? approvePatternOverride.trim() : null,
            displayName: approveAutoRename && approveDisplayName.trim() ? approveDisplayName.trim() : null,
            autoRename: approveAutoRename
          })
        })
      }

      if (res.ok) {
        const data = await res.json()
        const itemId = approveModalItem.id
        if (data.recurringCreated) {
          setSuccess('Expense approved and recurring expense created')
        } else if (data.ruleCreated) {
          setSuccess(`Expense approved. Auto-approve rule created - ${data.additionalApproved || 0} additional item(s) also approved.`)
        } else {
          setSuccess('Expense approved')
        }
        setApproveModalItem(null)
        // Remove this item plus any that were auto-approved (refetch to get accurate state if rules applied)
        if (data.additionalApproved > 0) {
          fetchItems(0, true) // Need full refresh when bulk auto-approved
        } else {
          removeItemsFromList(itemId)
        }
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to approve')
      }
    } catch (err) {
      setError('Failed to approve')
    } finally {
      setProcessing(null)
    }
  }

  // Quick skip - instantly skips without modal (no rule created)
  const handleQuickSkip = async (item: ApprovalItem) => {
    setProcessing(item.id)
    setError('')
    try {
      let res: Response

      if (item.type === 'email') {
        const billId = item.id.replace('email-', '')
        res = await fetch(`/api/admin/proposed-bills/${billId}/skip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            createRule: false,
            reason: 'Quick skipped'
          })
        })
      } else {
        const txnId = item.id.replace('bank-', '')
        res = await fetch(`/api/admin/financial-connections/transactions/${txnId}/skip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            createRule: false,
            ruleType: 'NONE'
          })
        })
      }

      if (res.ok) {
        setSuccess('Skipped')
        removeItemsFromList(item.id)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to skip')
      }
    } catch (err) {
      setError('Failed to skip')
    } finally {
      setProcessing(null)
    }
  }

  const handleSkip = async (createRule: boolean = false) => {
    if (!skipModalItem) return

    setProcessing(skipModalItem.id)
    setError('')
    try {
      let res: Response

      if (skipModalItem.type === 'email') {
        // Skip email bill
        const billId = skipModalItem.id.replace('email-', '')
        res = await fetch(`/api/admin/proposed-bills/${billId}/skip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            createRule: createRule && skipRuleType !== 'NONE',
            ruleType: skipRuleType,
            vendorPattern: skipVendorOverride.trim() || skipModalItem.vendor,
            reason: 'Skipped via approval queue'
          })
        })
      } else {
        // Skip bank transaction
        const txnId = skipModalItem.id.replace('bank-', '')
        res = await fetch(`/api/admin/financial-connections/transactions/${txnId}/skip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            createRule: createRule && skipRuleType !== 'NONE',
            ruleType: skipRuleType,
            scopeToAccount: skipOnlyThisAccount,
            transactionType: skipTransactionType !== 'BOTH' ? skipTransactionType : null,
            amountMode: skipAmountMode,
            amountMin: skipAmountMode === 'RANGE' && skipAmountMin ? parseFloat(skipAmountMin) : null,
            amountMax: skipAmountMode === 'RANGE' && skipAmountMax ? parseFloat(skipAmountMax) : null,
            displayName: skipDisplayName.trim() || null,
            vendorOverride: skipVendorOverride.trim() || null,
            amountOverride: skipAmountOverride ? parseFloat(skipAmountOverride) : null,
            patternOverride: skipPatternOverride.trim() || null
          })
        })
      }

      if (res.ok) {
        const data = await res.json()
        const itemId = skipModalItem.id
        if (data.ruleCreated || data.additionalSkipped > 0) {
          setSuccess(`Skipped. Rule applied - ${data.additionalSkipped || 0} additional item(s) also skipped.`)
        } else {
          setSuccess('Skipped')
        }
        setSkipModalItem(null)
        // Remove this item (and refetch if rule affected others)
        if (data.additionalSkipped > 0) {
          fetchItems(0, true) // Need full refresh when bulk skipped
        } else {
          removeItemsFromList(itemId)
        }
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to skip')
      }
    } catch (err) {
      setError('Failed to skip')
    } finally {
      setProcessing(null)
    }
  }

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return
    setProcessing('bulk')
    setError('')

    let approved = 0
    let failed = 0
    const approvedIds: string[] = []

    for (const id of selectedIds) {
      const item = items.find(i => i.id === id)
      if (!item) continue

      try {
        let res: Response
        if (item.type === 'email') {
          const billId = id.replace('email-', '')
          res = await fetch(`/api/admin/proposed-bills/${billId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          })
        } else {
          const txnId = id.replace('bank-', '')
          res = await fetch(`/api/admin/financial-connections/transactions/${txnId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          })
        }

        if (res.ok) {
          approved++
          approvedIds.push(id)
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    setSelectedIds(new Set())
    setSuccess(`Approved ${approved} items${failed > 0 ? `, ${failed} failed` : ''}`)
    // Remove approved items locally without scroll reset
    if (approvedIds.length > 0) {
      removeItemsFromList(approvedIds)
    }
    setProcessing(null)
  }

  const handleBulkSkip = async () => {
    if (selectedIds.size === 0) return
    setProcessing('bulk')
    setError('')

    let skipped = 0
    let failed = 0
    const skippedIds: string[] = []

    for (const id of selectedIds) {
      const item = items.find(i => i.id === id)
      if (!item) continue

      try {
        let res: Response
        if (item.type === 'email') {
          const billId = id.replace('email-', '')
          res = await fetch(`/api/admin/proposed-bills/${billId}/skip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ createRule: false, reason: 'Bulk skipped' })
          })
        } else {
          const txnId = id.replace('bank-', '')
          res = await fetch(`/api/admin/financial-connections/transactions/${txnId}/skip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ createRule: false, ruleType: 'NONE' })
          })
        }

        if (res.ok) {
          skipped++
          skippedIds.push(id)
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    setSelectedIds(new Set())
    setSuccess(`Skipped ${skipped} items${failed > 0 ? `, ${failed} failed` : ''}`)
    // Remove skipped items locally without scroll reset
    if (skippedIds.length > 0) {
      removeItemsFromList(skippedIds)
    }
    setProcessing(null)
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    const filtered = filteredItems
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(i => i.id)))
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return '#71717a'
    if (confidence >= 80) return '#10b981'
    if (confidence >= 50) return '#f59e0b'
    return '#ef4444'
  }

  // Filter items by source
  const filteredItems = items.filter(item => {
    if (sourceFilter === 'all') return true
    return item.type === sourceFilter
  })

  const pendingItems = filteredItems.filter(i => i.status === 'PENDING')

  return (
    <div>
      {/* Quick Mode Indicator */}
      {quickMode && (
        <div style={{
          background: 'rgba(251,191,36,0.15)',
          border: '1px solid rgba(251,191,36,0.4)',
          color: '#fbbf24',
          padding: '10px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 500
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          Quick Mode Active - Click Skip or Approve to instantly process (no confirmations)
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>x</button>
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          {success}
          <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}>x</button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Source Filter */}
          <div style={{ display: 'flex', gap: '4px', background: '#18181b', borderRadius: '6px', padding: '4px' }}>
            {(['all', 'email', 'bank'] as const).map(source => (
              <button
                key={source}
                onClick={() => setSourceFilter(source)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  background: sourceFilter === source ? '#3b82f6' : 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {source === 'all' ? 'All Sources' : source === 'email' ? 'Email Bills' : 'Bank Transactions'}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', gap: '4px', background: '#18181b', borderRadius: '6px', padding: '4px' }}>
            {(['PENDING', 'APPROVED', 'SKIPPED', 'ALL'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  background: statusFilter === status ? '#3b82f6' : 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {statusFilter === 'PENDING' && selectedIds.size > 0 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleBulkApprove}
              disabled={processing === 'bulk'}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: '#10b981',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                opacity: processing === 'bulk' ? 0.5 : 1
              }}
            >
              Approve {selectedIds.size} Selected
            </button>
            <button
              onClick={handleBulkSkip}
              disabled={processing === 'bulk'}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #71717a',
                background: 'transparent',
                color: '#a1a1aa',
                cursor: 'pointer',
                fontSize: '13px',
                opacity: processing === 'bulk' ? 0.5 : 1
              }}
            >
              Skip {selectedIds.size} Selected
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#71717a' }}>Loading...</div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#71717a' }}>
          No {statusFilter.toLowerCase()} items to review
        </div>
      ) : (
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 100px 100px 100px 160px', gap: '12px', padding: '12px 16px', background: '#0a0a0a', fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>
            {statusFilter === 'PENDING' && (
              <div>
                <input
                  type="checkbox"
                  checked={selectedIds.size === pendingItems.length && pendingItems.length > 0}
                  onChange={selectAll}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            )}
            {statusFilter !== 'PENDING' && <div></div>}
            <div>Vendor / Description</div>
            <div>Amount</div>
            <div>Date</div>
            <div>Source</div>
            <div>Actions</div>
          </div>

          {/* Rows */}
          {filteredItems.map(item => (
            <div key={item.id}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr 100px 100px 100px 160px',
                  gap: '12px',
                  padding: '14px 16px',
                  borderTop: '1px solid #27272a',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                {statusFilter === 'PENDING' && item.status === 'PENDING' && (
                  <div onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                )}
                {(statusFilter !== 'PENDING' || item.status !== 'PENDING') && <div></div>}

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '3px',
                      background: item.type === 'email' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                      color: item.type === 'email' ? '#ef4444' : '#3b82f6',
                      fontSize: '10px',
                      fontWeight: 600
                    }}>
                      {item.type === 'email' ? 'EMAIL' : 'BANK'}
                    </span>
                    <span style={{ fontWeight: 500 }}>{item.vendor}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#71717a', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.displayName && item.description !== item.displayName ? (
                      <span title={item.description}>{item.description}</span>
                    ) : (
                      item.description
                    )}
                  </div>
                </div>

                <div style={{ fontWeight: 600 }}>{formatCurrency(item.amount)}</div>

                <div style={{ fontSize: '13px', color: '#a1a1aa' }}>{formatDate(item.date)}</div>

                <div style={{ fontSize: '12px', color: '#71717a' }}>{item.source}</div>

                <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                  {item.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => quickMode ? handleApprove(item, false) : openApproveModal(item)}
                        disabled={processing === item.id}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: quickMode ? '1px solid #fbbf24' : 'none',
                          background: quickMode ? 'rgba(251,191,36,0.2)' : '#10b981',
                          color: quickMode ? '#fbbf24' : '#fff',
                          cursor: 'pointer',
                          fontSize: '12px',
                          opacity: processing === item.id ? 0.5 : 1
                        }}
                      >
                        Approve
                      </button>
                      {item.type === 'email' && (
                        <button
                          onClick={() => handleReject(item)}
                          disabled={processing === item.id}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: '1px solid #ef4444',
                            background: 'transparent',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '12px',
                            opacity: processing === item.id ? 0.5 : 1
                          }}
                        >
                          Reject
                        </button>
                      )}
                      {item.type === 'bank' && (
                        <button
                          onClick={() => quickMode ? handleQuickSkip(item) : openSkipModal(item)}
                          disabled={processing === item.id}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: quickMode ? '1px solid #fbbf24' : '1px solid #71717a',
                            background: quickMode ? 'rgba(251,191,36,0.1)' : 'transparent',
                            color: quickMode ? '#fbbf24' : '#a1a1aa',
                            cursor: 'pointer',
                            fontSize: '12px',
                            opacity: processing === item.id ? 0.5 : 1
                          }}
                        >
                          Skip
                        </button>
                      )}
                    </>
                  ) : (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      background: item.status === 'APPROVED' ? 'rgba(16,185,129,0.1)' : item.status === 'SKIPPED' ? 'rgba(113,113,122,0.2)' : 'rgba(239,68,68,0.1)',
                      color: item.status === 'APPROVED' ? '#10b981' : item.status === 'SKIPPED' ? '#a1a1aa' : '#ef4444',
                      fontSize: '11px',
                      fontWeight: 500
                    }}>
                      {item.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === item.id && (
                <div style={{ padding: '16px', background: '#0a0a0a', borderTop: '1px solid #27272a' }}>
                  {item.type === 'email' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>From</div>
                        <div style={{ fontSize: '13px' }}>{(item.original as ProposedBill).emailFrom}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Confidence</div>
                        <div style={{ fontSize: '13px', color: getConfidenceColor(item.confidence) }}>
                          {item.confidence}%
                        </div>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Subject</div>
                        <div style={{ fontSize: '13px' }}>{(item.original as ProposedBill).emailSubject || '-'}</div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Bank Account</div>
                          <div style={{ fontSize: '13px' }}>{item.source}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Transaction ID</div>
                          <div style={{ fontSize: '13px', fontFamily: 'monospace' }}>
                            {(item.original as BankTransaction).stripeTransactionId.slice(0, 20)}...
                          </div>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Description</div>
                          <div style={{ fontSize: '13px' }}>{(item.original as BankTransaction).description || '-'}</div>
                        </div>
                      </div>

                      {/* Recurring Expense Options for Bank Transactions */}
                      {item.status === 'PENDING' && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #27272a' }}>
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Vendor Name</div>
                            <input
                              type="text"
                              value={getRecurringOptions(item).vendor}
                              onChange={(e) => setRecurringOption(item.id, 'vendor', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid #3f3f46',
                                background: '#0a0a0a',
                                color: '#fff',
                                fontSize: '13px'
                              }}
                              placeholder="Enter vendor name..."
                            />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={getRecurringOptions(item).createRecurring}
                                onChange={(e) => setRecurringOption(item.id, 'createRecurring', e.target.checked)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 500 }}>Create as Recurring Expense</div>
                                <div style={{ fontSize: '12px', color: '#71717a' }}>Track this as a recurring company expense</div>
                              </div>
                            </label>

                            {getRecurringOptions(item).createRecurring && (
                              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginLeft: '26px' }}>
                                <input
                                  type="checkbox"
                                  checked={getRecurringOptions(item).autoApprove}
                                  onChange={(e) => setRecurringOption(item.id, 'autoApprove', e.target.checked)}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: 500 }}>Auto-approve future transactions</div>
                                  <div style={{ fontSize: '12px', color: '#71717a' }}>
                                    Future transactions matching this vendor/amount will be automatically approved
                                  </div>
                                </div>
                              </label>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Auto-Approve Option for Email Bills */}
                  {item.status === 'PENDING' && item.type === 'email' && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #27272a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>
                            Enable Auto-Approve for Future Bills
                          </div>
                          <div style={{ fontSize: '12px', color: '#71717a' }}>
                            Future bills from this vendor will be automatically approved
                          </div>
                        </div>
                        <button
                          onClick={() => handleApprove(item, true)}
                          disabled={processing === item.id}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#3b82f6',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 500,
                            opacity: processing === item.id ? 0.5 : 1
                          }}
                        >
                          Approve + Auto-Approve
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Load More */}
          {hasMore && (
            <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid #27272a' }}>
              <button
                onClick={loadMore}
                disabled={loadingMore}
                style={{
                  padding: '10px 24px',
                  borderRadius: '6px',
                  border: '1px solid #3f3f46',
                  background: 'transparent',
                  color: '#a1a1aa',
                  cursor: loadingMore ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  opacity: loadingMore ? 0.5 : 1
                }}
              >
                {loadingMore ? 'Loading...' : `Load More (${items.length} of ${totalCount})`}
              </button>
            </div>
          )}

          {/* Count indicator */}
          {!hasMore && items.length > 0 && (
            <div style={{ padding: '12px 16px', textAlign: 'center', borderTop: '1px solid #27272a', color: '#71717a', fontSize: '12px' }}>
              Showing all {items.length} items
            </div>
          )}
        </div>
      )}

      {/* Skip Modal */}
      {skipModalItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setSkipModalItem(null)}>
          <div
            style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '480px',
              width: '90%'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>Skip Transaction</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#a1a1aa' }}>
              {skipModalItem.description}
            </p>

            {/* Display Name (Rename) */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                Display Name (optional)
              </div>
              <input
                type="text"
                value={skipDisplayName}
                onChange={e => setSkipDisplayName(e.target.value)}
                placeholder="e.g., Publix Payroll"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0a0a0a',
                  border: '1px solid #3f3f46',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: '11px', color: '#71717a', marginTop: '6px' }}>
                Set a clean name for this transaction (and matching ones if creating a rule)
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '12px' }}>
                Skip future transactions like this?
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '10px', background: skipRuleType === 'NONE' ? 'rgba(59,130,246,0.1)' : '#0a0a0a', borderRadius: '8px', border: skipRuleType === 'NONE' ? '1px solid #3b82f6' : '1px solid #27272a' }}>
                  <input
                    type="radio"
                    name="skipRule"
                    checked={skipRuleType === 'NONE'}
                    onChange={() => setSkipRuleType('NONE')}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>Skip just this one</div>
                    <div style={{ fontSize: '12px', color: '#71717a' }}>No rule - similar transactions will still show up</div>
                  </div>
                </label>

                <div
                  onClick={() => setSkipRuleType('VENDOR')}
                  style={{ padding: '10px', background: skipRuleType === 'VENDOR' ? 'rgba(59,130,246,0.1)' : '#0a0a0a', borderRadius: '8px', border: skipRuleType === 'VENDOR' ? '1px solid #3b82f6' : '1px solid #27272a', cursor: 'pointer' }}
                >
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="skipRule"
                      checked={skipRuleType === 'VENDOR'}
                      onChange={() => setSkipRuleType('VENDOR')}
                      style={{ marginTop: '3px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>Skip by vendor (any amount)</div>
                      <div style={{ fontSize: '12px', color: '#71717a', marginBottom: skipRuleType === 'VENDOR' ? '8px' : 0 }}>All transactions matching this vendor name</div>
                    </div>
                  </label>
                  {skipRuleType === 'VENDOR' && (
                    <div style={{ marginTop: '8px', marginLeft: '24px' }} onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={skipVendorOverride}
                        onChange={e => setSkipVendorOverride(e.target.value)}
                        placeholder="Vendor name to match..."
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          background: '#18181b',
                          border: '1px solid #3f3f46',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  )}
                </div>

                <div
                  onClick={() => setSkipRuleType('VENDOR_AMOUNT')}
                  style={{ padding: '10px', background: skipRuleType === 'VENDOR_AMOUNT' ? 'rgba(59,130,246,0.1)' : '#0a0a0a', borderRadius: '8px', border: skipRuleType === 'VENDOR_AMOUNT' ? '1px solid #3b82f6' : '1px solid #27272a', cursor: 'pointer' }}
                >
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="skipRule"
                      checked={skipRuleType === 'VENDOR_AMOUNT'}
                      onChange={() => setSkipRuleType('VENDOR_AMOUNT')}
                      style={{ marginTop: '3px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>Skip by vendor + amount</div>
                      <div style={{ fontSize: '12px', color: '#71717a', marginBottom: skipRuleType === 'VENDOR_AMOUNT' ? '8px' : 0 }}>Transactions matching vendor and amount</div>
                    </div>
                  </label>
                  {skipRuleType === 'VENDOR_AMOUNT' && (
                    <div style={{ marginTop: '8px', marginLeft: '24px', display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={skipVendorOverride}
                        onChange={e => setSkipVendorOverride(e.target.value)}
                        placeholder="Vendor name..."
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          background: '#18181b',
                          border: '1px solid #3f3f46',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '13px'
                        }}
                      />
                      <input
                        type="number"
                        value={skipAmountOverride}
                        onChange={e => setSkipAmountOverride(e.target.value)}
                        placeholder="Amount"
                        style={{
                          width: '100px',
                          padding: '8px 10px',
                          background: '#18181b',
                          border: '1px solid #3f3f46',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                  )}
                </div>

                <div
                  onClick={() => setSkipRuleType('DESCRIPTION_PATTERN')}
                  style={{ padding: '10px', background: skipRuleType === 'DESCRIPTION_PATTERN' ? 'rgba(59,130,246,0.1)' : '#0a0a0a', borderRadius: '8px', border: skipRuleType === 'DESCRIPTION_PATTERN' ? '1px solid #3b82f6' : '1px solid #27272a', cursor: 'pointer' }}
                >
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="skipRule"
                      checked={skipRuleType === 'DESCRIPTION_PATTERN'}
                      onChange={() => setSkipRuleType('DESCRIPTION_PATTERN')}
                      style={{ marginTop: '3px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>Skip by text pattern</div>
                      <div style={{ fontSize: '12px', color: '#71717a', marginBottom: skipRuleType === 'DESCRIPTION_PATTERN' ? '8px' : 0 }}>Anything containing this text</div>
                    </div>
                  </label>
                  {skipRuleType === 'DESCRIPTION_PATTERN' && (
                    <div style={{ marginTop: '8px', marginLeft: '24px' }} onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={skipPatternOverride}
                        onChange={e => setSkipPatternOverride(e.target.value)}
                        placeholder="Text pattern to match..."
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          background: '#18181b',
                          border: '1px solid #3f3f46',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                      <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>
                        Case-insensitive. Matches if description contains this text.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Advanced options - only show when a rule type is selected */}
              {skipRuleType !== 'NONE' && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Transaction type filter */}
                  <div style={{ padding: '10px', background: '#0a0a0a', borderRadius: '8px', border: '1px solid #27272a' }}>
                    <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '8px' }}>Transaction Type</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {(['BOTH', 'INCOME', 'EXPENSE'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setSkipTransactionType(type)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: skipTransactionType === type ? '1px solid #3b82f6' : '1px solid #3f3f46',
                            background: skipTransactionType === type ? 'rgba(59,130,246,0.1)' : 'transparent',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {type === 'BOTH' ? 'Both' : type === 'INCOME' ? 'Income (+)' : 'Expense (-)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount range (for VENDOR_AMOUNT) */}
                  {skipRuleType === 'VENDOR_AMOUNT' && (
                    <div style={{ padding: '10px', background: '#0a0a0a', borderRadius: '8px', border: '1px solid #27272a' }}>
                      <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '8px' }}>Amount Matching</div>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                        <button
                          onClick={() => setSkipAmountMode('EXACT')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: skipAmountMode === 'EXACT' ? '1px solid #3b82f6' : '1px solid #3f3f46',
                            background: skipAmountMode === 'EXACT' ? 'rgba(59,130,246,0.1)' : 'transparent',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ~{formatCurrency(skipModalItem.amount)} (±5%)
                        </button>
                        <button
                          onClick={() => setSkipAmountMode('RANGE')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: skipAmountMode === 'RANGE' ? '1px solid #3b82f6' : '1px solid #3f3f46',
                            background: skipAmountMode === 'RANGE' ? 'rgba(59,130,246,0.1)' : 'transparent',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Custom Range
                        </button>
                      </div>
                      {skipAmountMode === 'RANGE' && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="number"
                            placeholder="Min"
                            value={skipAmountMin}
                            onChange={(e) => setSkipAmountMin(e.target.value)}
                            style={{
                              width: '80px',
                              padding: '6px 8px',
                              borderRadius: '4px',
                              border: '1px solid #3f3f46',
                              background: '#18181b',
                              color: '#fff',
                              fontSize: '12px'
                            }}
                          />
                          <span style={{ color: '#71717a' }}>to</span>
                          <input
                            type="number"
                            placeholder="Max"
                            value={skipAmountMax}
                            onChange={(e) => setSkipAmountMax(e.target.value)}
                            style={{
                              width: '80px',
                              padding: '6px 8px',
                              borderRadius: '4px',
                              border: '1px solid #3f3f46',
                              background: '#18181b',
                              color: '#fff',
                              fontSize: '12px'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Account scope */}
                  <div style={{ padding: '10px', background: '#0a0a0a', borderRadius: '8px', border: '1px solid #27272a' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={skipOnlyThisAccount}
                        onChange={(e) => setSkipOnlyThisAccount(e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>Only from this account</div>
                        <div style={{ fontSize: '12px', color: '#71717a' }}>Limit rule to {skipModalItem.source} only</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSkipModalItem(null)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: '1px solid #3f3f46',
                  background: 'transparent',
                  color: '#a1a1aa',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSkip(skipRuleType !== 'NONE')}
                disabled={processing === skipModalItem.id}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#3b82f6',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  opacity: processing === skipModalItem.id ? 0.5 : 1
                }}
              >
                {skipRuleType === 'NONE' ? 'Skip Transaction' : 'Skip + Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveModalItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setApproveModalItem(null)}>
          <div
            style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '480px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>Approve Transaction</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#a1a1aa' }}>
              {approveModalItem.description}
            </p>
            <p style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: 600, color: '#10b981' }}>
              {formatCurrency(approveModalItem.amount)}
            </p>

            {/* Vendor Name */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '6px' }}>Vendor Name</div>
              <input
                type="text"
                value={approveVendor}
                onChange={e => setApproveVendor(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0a0a0a',
                  border: '1px solid #3f3f46',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter vendor name..."
              />
            </div>

            {/* Vendor Type */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '6px' }}>Category</div>
              <select
                value={approveVendorType}
                onChange={e => setApproveVendorType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0a0a0a',
                  border: '1px solid #3f3f46',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              >
                <option value="OTHER">Other</option>
                <option value="SAAS">SaaS / Software</option>
                <option value="UTILITY">Utility</option>
                <option value="OFFICE">Office / Supplies</option>
                <option value="MARKETING">Marketing</option>
                <option value="PAYROLL">Payroll</option>
                <option value="PROFESSIONAL">Professional Services</option>
                <option value="INSURANCE">Insurance</option>
                <option value="TAX">Tax</option>
              </select>
            </div>

            {/* Create Recurring */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '10px', background: approveCreateRecurring ? 'rgba(59,130,246,0.1)' : '#0a0a0a', borderRadius: '8px', border: approveCreateRecurring ? '1px solid #3b82f6' : '1px solid #27272a' }}>
                <input
                  type="checkbox"
                  checked={approveCreateRecurring}
                  onChange={(e) => setApproveCreateRecurring(e.target.checked)}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>Create as Recurring Expense</div>
                  <div style={{ fontSize: '12px', color: '#71717a' }}>Track this as a recurring company expense</div>
                </div>
              </label>
            </div>

            {/* Auto-approve future similar transactions */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '12px' }}>
                Auto-approve future similar transactions?
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '10px', background: approveRuleType === 'NONE' ? 'rgba(59,130,246,0.1)' : '#0a0a0a', borderRadius: '8px', border: approveRuleType === 'NONE' ? '1px solid #3b82f6' : '1px solid #27272a' }}>
                  <input
                    type="radio"
                    name="approveRule"
                    checked={approveRuleType === 'NONE'}
                    onChange={() => setApproveRuleType('NONE')}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>No auto-approve</div>
                    <div style={{ fontSize: '12px', color: '#71717a' }}>Future similar transactions will need manual approval</div>
                  </div>
                </label>

                <div
                  onClick={() => setApproveRuleType('VENDOR')}
                  style={{ padding: '10px', background: approveRuleType === 'VENDOR' ? 'rgba(59,130,246,0.1)' : '#0a0a0a', borderRadius: '8px', border: approveRuleType === 'VENDOR' ? '1px solid #3b82f6' : '1px solid #27272a', cursor: 'pointer' }}
                >
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="approveRule"
                      checked={approveRuleType === 'VENDOR'}
                      onChange={() => setApproveRuleType('VENDOR')}
                      style={{ marginTop: '3px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>Auto-approve by vendor (any amount)</div>
                      <div style={{ fontSize: '12px', color: '#71717a' }}>Transactions containing this text</div>
                    </div>
                  </label>
                  {approveRuleType === 'VENDOR' && (
                    <div style={{ marginTop: '10px', marginLeft: '24px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ fontSize: '11px', color: '#71717a', marginBottom: '4px' }}>Text to match (filter by):</div>
                      <input
                        type="text"
                        value={approveVendorPattern}
                        onChange={e => setApproveVendorPattern(e.target.value)}
                        placeholder="Text pattern to match..."
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          background: '#18181b',
                          border: '1px solid #3f3f46',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  )}
                </div>

                <div
                  onClick={() => setApproveRuleType('VENDOR_AMOUNT')}
                  style={{ padding: '10px', background: approveRuleType === 'VENDOR_AMOUNT' ? 'rgba(59,130,246,0.1)' : '#0a0a0a', borderRadius: '8px', border: approveRuleType === 'VENDOR_AMOUNT' ? '1px solid #3b82f6' : '1px solid #27272a', cursor: 'pointer' }}
                >
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="approveRule"
                      checked={approveRuleType === 'VENDOR_AMOUNT'}
                      onChange={() => setApproveRuleType('VENDOR_AMOUNT')}
                      style={{ marginTop: '3px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>Auto-approve by vendor + amount</div>
                      <div style={{ fontSize: '12px', color: '#71717a' }}>Transactions matching text and amount</div>
                    </div>
                  </label>
                  {approveRuleType === 'VENDOR_AMOUNT' && (
                    <div style={{ marginTop: '10px', marginLeft: '24px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ fontSize: '11px', color: '#71717a', marginBottom: '4px' }}>Text to match (filter by):</div>
                      <input
                        type="text"
                        value={approveVendorPattern}
                        onChange={e => setApproveVendorPattern(e.target.value)}
                        placeholder="Text pattern to match..."
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          background: '#18181b',
                          border: '1px solid #3f3f46',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                          marginBottom: '10px'
                        }}
                      />
                      <div style={{ fontSize: '11px', color: '#71717a', marginBottom: '4px' }}>Amount matching:</div>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <button
                          onClick={() => setApproveAmountMode('EXACT')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: approveAmountMode === 'EXACT' ? '1px solid #3b82f6' : '1px solid #3f3f46',
                            background: approveAmountMode === 'EXACT' ? 'rgba(59,130,246,0.1)' : 'transparent',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ~{formatCurrency(approveModalItem.amount)} (5%)
                        </button>
                        <button
                          onClick={() => setApproveAmountMode('RANGE')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: approveAmountMode === 'RANGE' ? '1px solid #3b82f6' : '1px solid #3f3f46',
                            background: approveAmountMode === 'RANGE' ? 'rgba(59,130,246,0.1)' : 'transparent',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Custom Range
                        </button>
                      </div>
                      {approveAmountMode === 'RANGE' && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="number"
                            placeholder="Min"
                            value={approveAmountMin}
                            onChange={(e) => setApproveAmountMin(e.target.value)}
                            style={{
                              width: '80px',
                              padding: '6px 8px',
                              borderRadius: '4px',
                              border: '1px solid #3f3f46',
                              background: '#18181b',
                              color: '#fff',
                              fontSize: '12px'
                            }}
                          />
                          <span style={{ color: '#71717a' }}>to</span>
                          <input
                            type="number"
                            placeholder="Max"
                            value={approveAmountMax}
                            onChange={(e) => setApproveAmountMax(e.target.value)}
                            style={{
                              width: '80px',
                              padding: '6px 8px',
                              borderRadius: '4px',
                              border: '1px solid #3f3f46',
                              background: '#18181b',
                              color: '#fff',
                              fontSize: '12px'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div
                  onClick={() => setApproveRuleType('DESCRIPTION_PATTERN')}
                  style={{ padding: '10px', background: approveRuleType === 'DESCRIPTION_PATTERN' ? 'rgba(59,130,246,0.1)' : '#0a0a0a', borderRadius: '8px', border: approveRuleType === 'DESCRIPTION_PATTERN' ? '1px solid #3b82f6' : '1px solid #27272a', cursor: 'pointer' }}
                >
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="approveRule"
                      checked={approveRuleType === 'DESCRIPTION_PATTERN'}
                      onChange={() => setApproveRuleType('DESCRIPTION_PATTERN')}
                      style={{ marginTop: '3px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>Auto-approve by text pattern</div>
                      <div style={{ fontSize: '12px', color: '#71717a', marginBottom: approveRuleType === 'DESCRIPTION_PATTERN' ? '8px' : 0 }}>Anything containing this text</div>
                    </div>
                  </label>
                  {approveRuleType === 'DESCRIPTION_PATTERN' && (
                    <div style={{ marginTop: '8px', marginLeft: '24px' }} onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={approvePatternOverride}
                        onChange={e => setApprovePatternOverride(e.target.value)}
                        placeholder="Text pattern to match..."
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          background: '#18181b',
                          border: '1px solid #3f3f46',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                      <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>
                        Case-insensitive. Matches if description contains this text.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Auto-rename option - only show when a rule is selected */}
              {approveRuleType !== 'NONE' && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#0a0a0a', borderRadius: '8px', border: '1px solid #27272a' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={approveAutoRename}
                      onChange={(e) => setApproveAutoRename(e.target.checked)}
                      style={{ marginTop: '3px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>Auto-rename matching transactions</div>
                      <div style={{ fontSize: '12px', color: '#71717a', marginBottom: approveAutoRename ? '8px' : 0 }}>
                        Automatically set a display name for transactions that match this rule
                      </div>
                      {approveAutoRename && (
                        <input
                          type="text"
                          value={approveDisplayName}
                          onChange={e => setApproveDisplayName(e.target.value)}
                          placeholder="Display name for matches (e.g., Publix Payroll)"
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            background: '#18181b',
                            border: '1px solid #3f3f46',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '13px',
                            boxSizing: 'border-box'
                          }}
                        />
                      )}
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setApproveModalItem(null)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: '1px solid #3f3f46',
                  background: 'transparent',
                  color: '#a1a1aa',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleApproveFromModal}
                disabled={processing === approveModalItem.id}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#10b981',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  opacity: processing === approveModalItem.id ? 0.5 : 1
                }}
              >
                {approveRuleType === 'NONE' ? 'Approve' : 'Approve + Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
