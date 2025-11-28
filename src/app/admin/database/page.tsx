'use client'

import { useState, useEffect } from 'react'

const TABLES = [
  'User',
  'Account',
  'Session',
  'Product',
  'Category',
  'Order',
  'OrderItem',
  'CartItem',
  'CustomRequest',
  'ServiceInquiry',
  'Review',
  'DiscountCode',
  'Address',
  'Page',
  'Media',
  'Setting',
  'PageView'
]

export default function DatabasePage() {
  const [selectedTable, setSelectedTable] = useState('User')
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    // Fetch counts for all tables
    fetch('/api/admin/database/counts')
      .then(res => res.json())
      .then(data => {
        if (data.counts) setCounts(data.counts)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchTableData()
  }, [selectedTable])

  const fetchTableData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/database?table=${selectedTable}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to fetch')
      setData(json.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching data')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const columns = data.length > 0 ? Object.keys(data[0]) : []

  return (
    <div style={{ padding: '24px', color: '#fff', minHeight: '100vh', background: '#000' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
        Database Viewer
      </h1>

      {/* Table selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
        {TABLES.map(table => (
          <button
            key={table}
            onClick={() => setSelectedTable(table)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              background: selectedTable === table ? '#3b82f6' : '#27272a',
              color: '#fff',
            }}
          >
            {table} {counts[table] !== undefined && `(${counts[table]})`}
          </button>
        ))}
      </div>

      {/* Data display */}
      <div style={{
        background: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #3f3f46',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #3f3f46',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600' }}>
            {selectedTable} Table
          </h2>
          <span style={{ color: '#a1a1aa', fontSize: '14px' }}>
            {data.length} records
          </span>
        </div>

        {loading && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#a1a1aa' }}>
            Loading...
          </div>
        )}

        {error && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
            {error}
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#a1a1aa' }}>
            No records found
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#27272a' }}>
                  {columns.map(col => (
                    <th key={col} style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      borderBottom: '1px solid #3f3f46',
                      whiteSpace: 'nowrap',
                      color: '#a1a1aa',
                      fontWeight: '500'
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #27272a' }}>
                    {columns.map(col => (
                      <td key={col} style={{
                        padding: '12px 16px',
                        maxWidth: '300px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: '#e4e4e7'
                      }}>
                        {formatValue(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
