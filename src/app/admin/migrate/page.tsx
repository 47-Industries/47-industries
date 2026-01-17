'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface MigrationStatus {
  adminsNeedingMigration: number
  totalAdmins: number
  totalTeamMembers: number
  migrationNeeded: boolean
}

interface MigrationResult {
  success: boolean
  message: string
  results: {
    total: number
    migrated: number
    skipped: number
    errors: string[]
  }
}

export default function MigratePage() {
  const [status, setStatus] = useState<MigrationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [migrating, setMigrating] = useState(false)
  const [result, setResult] = useState<MigrationResult | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/migrate-admins')
      if (!res.ok) throw new Error('Failed to check status')
      const data = await res.json()
      setStatus(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const runMigration = async () => {
    if (!confirm('This will create team member records for all admins. Continue?')) return

    setMigrating(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/admin/migrate-admins', {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Migration failed')
      setResult(data)
      checkStatus() // Refresh status
    } catch (err: any) {
      setError(err.message)
    } finally {
      setMigrating(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '32px', color: '#fff' }}>
        <div style={{ textAlign: 'center', padding: '48px' }}>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', color: '#fff', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
        Admin Migration Tool
      </h1>
      <p style={{ color: '#a1a1aa', marginBottom: '32px' }}>
        Migrate existing admin accounts to team members for unified management
      </p>

      {error && (
        <div style={{
          background: '#ef444420',
          border: '1px solid #ef4444',
          color: '#ef4444',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
        }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{
          background: result.success ? '#10b98120' : '#ef444420',
          border: `1px solid ${result.success ? '#10b981' : '#ef4444'}`,
          color: result.success ? '#10b981' : '#ef4444',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
        }}>
          <p style={{ fontWeight: 600, marginBottom: '8px' }}>{result.message}</p>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Total admins: {result.results.total}</li>
            <li>Migrated: {result.results.migrated}</li>
            <li>Skipped (already had team member): {result.results.skipped}</li>
          </ul>
          {result.results.errors.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <p style={{ fontWeight: 600 }}>Errors:</p>
              <ul>
                {result.results.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {status && (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
            Current Status
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ textAlign: 'center', padding: '16px', background: '#27272a', borderRadius: '8px' }}>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>{status.totalAdmins}</p>
              <p style={{ color: '#71717a', fontSize: '14px' }}>Total Admins</p>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: '#27272a', borderRadius: '8px' }}>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{status.totalTeamMembers}</p>
              <p style={{ color: '#71717a', fontSize: '14px' }}>Team Members</p>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: '#27272a', borderRadius: '8px' }}>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: status.adminsNeedingMigration > 0 ? '#f59e0b' : '#10b981' }}>
                {status.adminsNeedingMigration}
              </p>
              <p style={{ color: '#71717a', fontSize: '14px' }}>Need Migration</p>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        {status?.migrationNeeded ? (
          <button
            onClick={runMigration}
            disabled={migrating}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: migrating ? 'not-allowed' : 'pointer',
              opacity: migrating ? 0.5 : 1,
            }}
          >
            {migrating ? 'Migrating...' : 'Run Migration'}
          </button>
        ) : (
          <div style={{
            padding: '12px 24px',
            background: '#10b98120',
            color: '#10b981',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
          }}>
            All admins are already team members
          </div>
        )}

        <button
          onClick={() => router.push('/admin/team')}
          style={{
            padding: '12px 24px',
            background: '#27272a',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Go to Team Page
        </button>
      </div>
    </div>
  )
}
