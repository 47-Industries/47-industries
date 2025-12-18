'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface OAuthApp {
  id: string
  name: string
  clientId: string
  clientSecret: string
  redirectUris: string[]
  scopes: string[]
  description: string | null
  websiteUrl: string | null
  active: boolean
  createdAt: string
  _count: {
    accessTokens: number
  }
}

export default function OAuthApplicationsPage() {
  const [apps, setApps] = useState<OAuthApp[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingApp, setEditingApp] = useState<OAuthApp | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    websiteUrl: '',
    redirectUris: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showSecret, setShowSecret] = useState<string | null>(null)

  useEffect(() => {
    fetchApps()
  }, [])

  const fetchApps = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/oauth/applications')
      if (res.ok) {
        const data = await res.json()
        setApps(data.applications)
      }
    } catch (error) {
      console.error('Failed to fetch OAuth applications:', error)
    }
    setLoading(false)
  }

  const openCreateModal = () => {
    setEditingApp(null)
    setFormData({
      name: '',
      description: '',
      websiteUrl: '',
      redirectUris: '',
    })
    setError('')
    setShowModal(true)
  }

  const openEditModal = (app: OAuthApp) => {
    setEditingApp(app)
    setFormData({
      name: app.name,
      description: app.description || '',
      websiteUrl: app.websiteUrl || '',
      redirectUris: app.redirectUris.join('\n'),
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      const redirectUrisArray = formData.redirectUris
        .split('\n')
        .map(uri => uri.trim())
        .filter(uri => uri.length > 0)

      if (redirectUrisArray.length === 0) {
        setError('At least one redirect URI is required')
        setSaving(false)
        return
      }

      const url = editingApp
        ? `/api/admin/oauth/applications/${editingApp.id}`
        : '/api/admin/oauth/applications'

      const method = editingApp ? 'PATCH' : 'POST'

      const body = {
        name: formData.name,
        description: formData.description || null,
        websiteUrl: formData.websiteUrl || null,
        redirectUris: redirectUrisArray,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save application')

      setShowModal(false)
      fetchApps()

      // Show secret for newly created apps
      if (!editingApp) {
        setShowSecret(data.application.id)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (app: OAuthApp) => {
    if (!confirm(`Are you sure you want to delete "${app.name}"? This will revoke all access tokens and cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/oauth/applications/${app.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete application')
      fetchApps()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const toggleActive = async (app: OAuthApp) => {
    try {
      const res = await fetch(`/api/admin/oauth/applications/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !app.active }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      fetchApps()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <div style={{ padding: '24px', color: '#fff', minHeight: '100vh', background: '#000' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
          OAuth Applications
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '14px' }}>
          Manage OAuth 2.0 applications that can authenticate using 47 Industries accounts
        </p>
      </div>

      {/* Create Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <p style={{ color: '#a1a1aa', fontSize: '14px' }}>
            {apps.length} application{apps.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          + New Application
        </button>
      </div>

      {/* Applications List */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#a1a1aa' }}>
          Loading applications...
        </div>
      ) : apps.length === 0 ? (
        <div style={{ background: '#1a1a1a', border: '1px solid #27272a', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
          <svg className="w-16 h-16 mx-auto mb-4 text-text-secondary" style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#a1a1aa' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No OAuth applications</h3>
          <p style={{ color: '#a1a1aa', marginBottom: '16px' }}>
            Create an OAuth application to allow external services to authenticate using 47 Industries accounts
          </p>
          <button
            onClick={openCreateModal}
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Create First Application
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {apps.map(app => (
            <div
              key={app.id}
              style={{
                background: '#1a1a1a',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{app.name}</h3>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: app.active ? '#10b981' : '#ef4444',
                      color: '#fff',
                    }}>
                      {app.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {app.description && (
                    <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '8px' }}>{app.description}</p>
                  )}
                  {app.websiteUrl && (
                    <a href={app.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: '14px', textDecoration: 'none' }}>
                      {app.websiteUrl}
                    </a>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => openEditModal(app)}
                    style={{
                      padding: '6px 12px',
                      background: '#27272a',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleActive(app)}
                    style={{
                      padding: '6px 12px',
                      background: app.active ? '#ef4444' : '#10b981',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {app.active ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDelete(app)}
                    style={{
                      padding: '6px 12px',
                      background: '#dc2626',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Client Credentials */}
              <div style={{ background: '#0a0a0a', border: '1px solid #27272a', borderRadius: '8px', padding: '16px', marginTop: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#a1a1aa', marginBottom: '4px' }}>
                    Client ID
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <code style={{ flex: 1, padding: '8px', background: '#000', border: '1px solid #27272a', borderRadius: '4px', fontSize: '13px', fontFamily: 'monospace' }}>
                      {app.clientId}
                    </code>
                    <button
                      onClick={() => copyToClipboard(app.clientId)}
                      style={{ padding: '8px 12px', background: '#27272a', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#a1a1aa', marginBottom: '4px' }}>
                    Client Secret
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <code style={{ flex: 1, padding: '8px', background: '#000', border: '1px solid #27272a', borderRadius: '4px', fontSize: '13px', fontFamily: 'monospace' }}>
                      {showSecret === app.id ? app.clientSecret : '••••••••••••••••••••••••••••'}
                    </code>
                    <button
                      onClick={() => setShowSecret(showSecret === app.id ? null : app.id)}
                      style={{ padding: '8px 12px', background: '#27272a', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
                    >
                      {showSecret === app.id ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => copyToClipboard(app.clientSecret)}
                      style={{ padding: '8px 12px', background: '#27272a', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#a1a1aa', marginBottom: '4px' }}>
                    Redirect URIs
                  </label>
                  {app.redirectUris.map((uri, i) => (
                    <div key={i} style={{ padding: '6px 8px', background: '#000', border: '1px solid #27272a', borderRadius: '4px', fontSize: '13px', fontFamily: 'monospace', marginBottom: '4px' }}>
                      {uri}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px', color: '#a1a1aa' }}>
                <span>{app._count.accessTokens} active tokens</span>
                <span>Created {new Date(app.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '20px',
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid #27272a',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #27272a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600' }}>
                {editingApp ? 'Edit Application' : 'Create OAuth Application'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a1a1aa',
                  fontSize: '24px',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              {error && (
                <div style={{
                  padding: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  color: '#ef4444',
                  marginBottom: '16px',
                  fontSize: '14px',
                }}>
                  {error}
                </div>
              )}

              {/* Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Application Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="LeadChopper"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #3f3f46',
                    background: '#0a0a0a',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Lead generation and email automation platform"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #3f3f46',
                    background: '#0a0a0a',
                    color: '#fff',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Website URL */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Website URL
                </label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                  placeholder="https://leadchopper.47industries.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #3f3f46',
                    background: '#0a0a0a',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                />
              </div>

              {/* Redirect URIs */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Redirect URIs * (one per line)
                </label>
                <textarea
                  value={formData.redirectUris}
                  onChange={(e) => setFormData(prev => ({ ...prev, redirectUris: e.target.value }))}
                  placeholder={'https://leadchopper.47industries.com/api/auth/callback/47industries'}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #3f3f46',
                    background: '#0a0a0a',
                    color: '#fff',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    resize: 'vertical',
                  }}
                />
                <p style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>
                  These are the allowed callback URLs after authentication
                </p>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #27272a',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#27272a',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
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
                  background: '#3b82f6',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.5 : 1,
                }}
              >
                {saving ? 'Saving...' : editingApp ? 'Save Changes' : 'Create Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
