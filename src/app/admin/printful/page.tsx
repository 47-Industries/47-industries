'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PrintfulStatus {
  connected: boolean
  configured: boolean
  storeName?: string
  storeType?: string
  error?: string
  lastSyncedAt: string | null
  stats: {
    products: number
    totalOrders: number
    failedOrders: number
  }
  stores?: Array<{ id: number; name: string; type: string | null }>
}

export default function PrintfulDashboard() {
  const [status, setStatus] = useState<PrintfulStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{
    success: boolean
    message: string
    errors?: string[]
  } | null>(null)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/admin/printful/status')
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch Printful status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)

    try {
      const res = await fetch('/api/admin/printful/sync', { method: 'POST' })
      const data = await res.json()

      if (res.ok) {
        setSyncResult({
          success: true,
          message: data.message,
          errors: data.errors,
        })
        // Refresh status
        fetchStatus()
      } else {
        setSyncResult({
          success: false,
          message: data.error || 'Sync failed',
        })
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: 'Failed to sync products',
      })
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-text-secondary">Loading Printful status...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Printful Integration</h1>
          <p className="text-text-secondary">Manage print-on-demand products and orders</p>
        </div>
        <Link
          href="/admin/printful/orders"
          className="px-4 py-2 bg-surface border border-border rounded-lg hover:bg-surface-elevated transition-colors"
        >
          View Orders
        </Link>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Status Card */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${status?.connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <h3 className="font-medium">Connection Status</h3>
          </div>
          <p className="text-2xl font-bold mb-1">
            {status?.connected ? 'Connected' : 'Disconnected'}
          </p>
          {status?.storeName && (
            <p className="text-sm text-text-secondary">{status.storeName}</p>
          )}
          {status?.error && (
            <p className="text-sm text-red-400 mt-2">{status.error}</p>
          )}
        </div>

        {/* Products Card */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="font-medium">Synced Products</h3>
          </div>
          <p className="text-2xl font-bold mb-1">{status?.stats.products || 0}</p>
          <p className="text-sm text-text-secondary">Active products</p>
        </div>

        {/* Orders Card */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="font-medium">Total Orders</h3>
          </div>
          <p className="text-2xl font-bold mb-1">{status?.stats.totalOrders || 0}</p>
          <p className="text-sm text-text-secondary">Printful orders</p>
        </div>

        {/* Failed Orders Card */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-medium">Failed Orders</h3>
          </div>
          <p className={`text-2xl font-bold mb-1 ${(status?.stats.failedOrders || 0) > 0 ? 'text-red-400' : ''}`}>
            {status?.stats.failedOrders || 0}
          </p>
          {(status?.stats.failedOrders || 0) > 0 && (
            <Link href="/admin/printful/orders?status=FAILED" className="text-sm text-red-400 hover:underline">
              View failed orders
            </Link>
          )}
        </div>
      </div>

      {/* Sync Section */}
      <div className="bg-surface border border-border rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Product Sync</h2>
        <p className="text-text-secondary mb-6">
          Sync your Printful store products to your 47 Industries catalog. Products will be created or updated based on your Printful store.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={handleSync}
            disabled={syncing || !status?.connected}
            className="px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {syncing ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Syncing...
              </span>
            ) : (
              'Sync Products Now'
            )}
          </button>

          {status?.lastSyncedAt && (
            <p className="text-sm text-text-secondary">
              Last synced: {new Date(status.lastSyncedAt).toLocaleString()}
            </p>
          )}
        </div>

        {/* Sync Result */}
        {syncResult && (
          <div className={`mt-6 p-4 rounded-lg ${syncResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
            <p className={syncResult.success ? 'text-green-400' : 'text-red-400'}>
              {syncResult.message}
            </p>
            {syncResult.errors && syncResult.errors.length > 0 && (
              <ul className="mt-2 text-sm text-red-400 list-disc list-inside">
                {syncResult.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/printful/orders"
          className="bg-surface border border-border rounded-xl p-6 hover:bg-surface-elevated transition-colors"
        >
          <div className="flex items-center gap-3 mb-3">
            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="font-semibold">View Orders</h3>
          </div>
          <p className="text-sm text-text-secondary">
            Manage Printful orders, track shipments, and retry failed orders.
          </p>
        </Link>

        <Link
          href="/admin/products?fulfillment=PRINTFUL"
          className="bg-surface border border-border rounded-xl p-6 hover:bg-surface-elevated transition-colors"
        >
          <div className="flex items-center gap-3 mb-3">
            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="font-semibold">Printful Products</h3>
          </div>
          <p className="text-sm text-text-secondary">
            View and manage products synced from Printful.
          </p>
        </Link>

        <a
          href="https://www.printful.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-surface border border-border rounded-xl p-6 hover:bg-surface-elevated transition-colors"
        >
          <div className="flex items-center gap-3 mb-3">
            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <h3 className="font-semibold">Printful Dashboard</h3>
          </div>
          <p className="text-sm text-text-secondary">
            Open Printful dashboard to manage designs and fulfillment.
          </p>
        </a>
      </div>

      {/* Setup Instructions - No API Key */}
      {!status?.configured && (
        <div className="mt-8 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
          <h3 className="font-semibold text-yellow-400 mb-2">Setup Required</h3>
          <p className="text-text-secondary mb-4">
            To use Printful integration, add the following environment variables:
          </p>
          <pre className="bg-black/20 rounded-lg p-4 text-sm overflow-x-auto">
{`PRINTFUL_API_KEY=your-api-key
PRINTFUL_WEBHOOK_SECRET=your-webhook-secret`}
          </pre>
          <p className="text-sm text-text-secondary mt-4">
            Get your API key from{' '}
            <a
              href="https://www.printful.com/dashboard/developers"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Printful Developer Settings
            </a>
          </p>
        </div>
      )}

      {/* No API Store Found */}
      {status?.configured && !status?.connected && status?.stores && status.stores.length > 0 && (
        <div className="mt-8 bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <h3 className="font-semibold text-red-400 mb-2">Manual Order / API Store Required</h3>
          <p className="text-text-secondary mb-4">
            Your Printful account has {status.stores.length} store(s), but none are set up for API access.
            Platform integration stores (Shopify, Etsy, etc.) cannot be used with this integration.
          </p>

          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Your current stores:</p>
            <ul className="text-sm text-text-secondary space-y-1">
              {status.stores.map((store) => (
                <li key={store.id} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  {store.name} <span className="text-text-muted">({store.type || 'unknown'})</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-text-secondary mb-4">
            <strong>To fix this:</strong>
          </p>
          <ol className="text-sm text-text-secondary list-decimal list-inside space-y-2 mb-4">
            <li>Go to <a href="https://www.printful.com/dashboard/store" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Printful Dashboard &gt; Stores</a></li>
            <li>Click &quot;Add store&quot;</li>
            <li>Select &quot;Manual order platform / API&quot; (at the bottom)</li>
            <li>Name it &quot;47 Industries&quot;</li>
            <li>Add your products/designs to this new store</li>
            <li>Come back here and click &quot;Sync Products Now&quot;</li>
          </ol>
          <p className="text-xs text-text-muted">
            Tip: You can copy existing designs to the new store from Printful&apos;s product menu.
          </p>
        </div>
      )}
    </div>
  )
}
