'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface TaxRate {
  id: string
  name: string
  country: string
  state: string | null
  zipCode: string | null
  city: string | null
  rate: number
  isCompound: boolean
  includeShipping: boolean
  priority: number
  active: boolean
}

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'District of Columbia' },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: '#09090b',
  border: '1px solid #27272a',
  borderRadius: '8px',
  color: 'white',
  fontSize: '14px',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 500,
  marginBottom: '8px',
}

export default function TaxSettingsPage() {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [loading, setLoading] = useState(true)
  const [showRateModal, setShowRateModal] = useState(false)
  const [editingRate, setEditingRate] = useState<TaxRate | null>(null)

  // Rate form state
  const [rateName, setRateName] = useState('')
  const [rateCountry, setRateCountry] = useState('US')
  const [rateState, setRateState] = useState('')
  const [rateCity, setRateCity] = useState('')
  const [rateZipCode, setRateZipCode] = useState('')
  const [rateValue, setRateValue] = useState('')
  const [rateIsCompound, setRateIsCompound] = useState(false)
  const [rateIncludeShipping, setRateIncludeShipping] = useState(false)
  const [ratePriority, setRatePriority] = useState('0')
  const [rateActive, setRateActive] = useState(true)

  useEffect(() => {
    fetchTaxRates()
  }, [])

  const fetchTaxRates = async () => {
    try {
      const res = await fetch('/api/admin/tax/rates')
      if (res.ok) {
        const data = await res.json()
        setTaxRates(data)
      }
    } catch (error) {
      console.error('Error fetching tax rates:', error)
    } finally {
      setLoading(false)
    }
  }

  const openRateModal = (rate?: TaxRate) => {
    if (rate) {
      setEditingRate(rate)
      setRateName(rate.name)
      setRateCountry(rate.country)
      setRateState(rate.state || '')
      setRateCity(rate.city || '')
      setRateZipCode(rate.zipCode || '')
      setRateValue((Number(rate.rate) * 100).toFixed(2))
      setRateIsCompound(rate.isCompound)
      setRateIncludeShipping(rate.includeShipping)
      setRatePriority(rate.priority.toString())
      setRateActive(rate.active)
    } else {
      setEditingRate(null)
      setRateName('')
      setRateCountry('US')
      setRateState('')
      setRateCity('')
      setRateZipCode('')
      setRateValue('')
      setRateIsCompound(false)
      setRateIncludeShipping(false)
      setRatePriority('0')
      setRateActive(true)
    }
    setShowRateModal(true)
  }

  const handleSaveRate = async () => {
    const rateDecimal = parseFloat(rateValue) / 100

    const data = {
      name: rateName,
      country: rateCountry,
      state: rateState || null,
      city: rateCity || null,
      zipCode: rateZipCode || null,
      rate: rateDecimal,
      isCompound: rateIsCompound,
      includeShipping: rateIncludeShipping,
      priority: parseInt(ratePriority) || 0,
      active: rateActive,
    }

    try {
      const url = editingRate
        ? `/api/admin/tax/rates/${editingRate.id}`
        : '/api/admin/tax/rates'
      const method = editingRate ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setShowRateModal(false)
        fetchTaxRates()
      }
    } catch (error) {
      console.error('Error saving tax rate:', error)
    }
  }

  const handleDeleteRate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tax rate?')) return

    try {
      const res = await fetch(`/api/admin/tax/rates/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchTaxRates()
      }
    } catch (error) {
      console.error('Error deleting tax rate:', error)
    }
  }

  const formatPercent = (rate: number) => {
    return `${(Number(rate) * 100).toFixed(2)}%`
  }

  const getStateName = (code: string | null) => {
    if (!code) return '-'
    return US_STATES.find(s => s.code === code)?.name || code
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #27272a',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/admin/settings" style={{
          padding: '8px',
          background: '#27272a',
          borderRadius: '8px',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
        }}>
          ←
        </Link>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>Tax Settings</h1>
          <p style={{ color: '#71717a', margin: '4px 0 0 0' }}>Configure tax rates by location</p>
        </div>
      </div>

      {/* Info Card */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', margin: '0 0 12px 0' }}>
          Tax Calculation
        </h2>
        <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '12px', margin: '0 0 12px 0' }}>
          Tax rates are applied based on the customer&apos;s shipping address. The system uses the most
          specific matching rate (zip code &gt; city &gt; state &gt; country).
        </p>
        <div style={{ color: '#71717a', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <p style={{ margin: 0 }}><strong style={{ color: 'white' }}>Priority:</strong> Higher priority rates are evaluated first when multiple rates match.</p>
          <p style={{ margin: 0 }}><strong style={{ color: 'white' }}>Compound:</strong> Compound rates are calculated on top of the subtotal + other taxes.</p>
          <p style={{ margin: 0 }}><strong style={{ color: 'white' }}>Include Shipping:</strong> When enabled, the shipping cost is included in the taxable amount.</p>
        </div>
      </div>

      {/* Tax Rates */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Tax Rates</h2>
            <p style={{ color: '#71717a', fontSize: '14px', margin: '4px 0 0 0' }}>
              {taxRates.length} tax rate{taxRates.length !== 1 ? 's' : ''} configured
            </p>
          </div>
          <button
            onClick={() => openRateModal()}
            style={{
              padding: '10px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            + Add Tax Rate
          </button>
        </div>

        {taxRates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#71717a' }}>
            No tax rates configured. Add a rate to get started.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #27272a' }}>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#71717a', fontWeight: 500, fontSize: '14px' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#71717a', fontWeight: 500, fontSize: '14px' }}>Location</th>
                  <th style={{ textAlign: 'right', padding: '12px', color: '#71717a', fontWeight: 500, fontSize: '14px' }}>Rate</th>
                  <th style={{ textAlign: 'center', padding: '12px', color: '#71717a', fontWeight: 500, fontSize: '14px' }}>Options</th>
                  <th style={{ textAlign: 'center', padding: '12px', color: '#71717a', fontWeight: 500, fontSize: '14px' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '12px', color: '#71717a', fontWeight: 500, fontSize: '14px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {taxRates.map((rate) => (
                  <tr key={rate.id} style={{ borderBottom: '1px solid #27272a' }}>
                    <td style={{ padding: '12px', fontWeight: 500 }}>{rate.name}</td>
                    <td style={{ padding: '12px' }}>
                      <div>{rate.country}</div>
                      {rate.state && <div style={{ fontSize: '14px', color: '#a1a1aa' }}>{getStateName(rate.state)}</div>}
                      {rate.city && <div style={{ fontSize: '13px', color: '#71717a' }}>{rate.city}</div>}
                      {rate.zipCode && <div style={{ fontSize: '12px', color: '#71717a' }}>ZIP: {rate.zipCode}</div>}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}>
                      {formatPercent(rate.rate)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {rate.isCompound && (
                          <span style={{ fontSize: '11px', background: '#8b5cf620', color: '#8b5cf6', padding: '2px 8px', borderRadius: '4px' }}>
                            Compound
                          </span>
                        )}
                        {rate.includeShipping && (
                          <span style={{ fontSize: '11px', background: '#3b82f620', color: '#3b82f6', padding: '2px 8px', borderRadius: '4px' }}>
                            +Shipping
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: '12px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: rate.active ? '#10b98120' : '#71717a20',
                        color: rate.active ? '#10b981' : '#71717a',
                      }}>
                        {rate.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => openRateModal(rate)}
                          style={{
                            padding: '6px 12px',
                            background: '#27272a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRate(rate.id)}
                          style={{
                            padding: '6px 12px',
                            background: 'transparent',
                            color: '#ef4444',
                            border: '1px solid #ef4444',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Add Presets */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', margin: '0 0 12px 0' }}>
          Common Tax Rates
        </h2>
        <p style={{ color: '#71717a', fontSize: '14px', marginBottom: '16px', margin: '0 0 16px 0' }}>
          Quickly add tax rates for common US states
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
          {[
            { state: 'CA', rate: '7.25', name: 'California' },
            { state: 'TX', rate: '6.25', name: 'Texas' },
            { state: 'NY', rate: '4.00', name: 'New York' },
            { state: 'FL', rate: '6.00', name: 'Florida' },
            { state: 'WA', rate: '6.50', name: 'Washington' },
            { state: 'IL', rate: '6.25', name: 'Illinois' },
            { state: 'PA', rate: '6.00', name: 'Pennsylvania' },
            { state: 'OH', rate: '5.75', name: 'Ohio' },
          ].map((preset) => {
            const exists = taxRates.some(r => r.state === preset.state)
            return (
              <button
                key={preset.state}
                disabled={exists}
                onClick={() => {
                  setEditingRate(null)
                  setRateName(`${preset.name} State Tax`)
                  setRateCountry('US')
                  setRateState(preset.state)
                  setRateCity('')
                  setRateZipCode('')
                  setRateValue(preset.rate)
                  setRateIsCompound(false)
                  setRateIncludeShipping(false)
                  setRatePriority('0')
                  setRateActive(true)
                  setShowRateModal(true)
                }}
                style={{
                  padding: '10px 16px',
                  background: exists ? '#27272a' : '#09090b',
                  color: exists ? '#71717a' : 'white',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: exists ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                }}
              >
                {preset.name} ({preset.rate}%)
                {exists && <span style={{ marginLeft: '8px', color: '#10b981' }}>Added</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Rate Modal */}
      {showRateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', margin: '0 0 20px 0' }}>
              {editingRate ? 'Edit Tax Rate' : 'Add Tax Rate'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Rate Name</label>
                <input
                  type="text"
                  value={rateName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRateName(e.target.value)}
                  style={inputStyle}
                  placeholder="e.g., California State Tax"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Country</label>
                  <select
                    value={rateCountry}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRateCountry(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>State (optional)</label>
                  <select
                    value={rateState}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRateState(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">All States</option>
                    {US_STATES.map((state) => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>City (optional)</label>
                  <input
                    type="text"
                    value={rateCity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRateCity(e.target.value)}
                    style={inputStyle}
                    placeholder="e.g., Los Angeles"
                  />
                </div>

                <div>
                  <label style={labelStyle}>ZIP Codes (optional)</label>
                  <input
                    type="text"
                    value={rateZipCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRateZipCode(e.target.value)}
                    style={inputStyle}
                    placeholder="e.g., 90001-90099, 90210"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={rateValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRateValue(e.target.value)}
                    style={inputStyle}
                    placeholder="e.g., 8.25"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Priority</label>
                  <input
                    type="number"
                    value={ratePriority}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRatePriority(e.target.value)}
                    style={inputStyle}
                    placeholder="0"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rateIsCompound}
                    onChange={(e) => setRateIsCompound(e.target.checked)}
                    style={{ width: '18px', height: '18px', marginRight: '10px', accentColor: '#3b82f6' }}
                  />
                  <div>
                    <div style={{ fontWeight: 500 }}>Compound Tax</div>
                    <div style={{ fontSize: '13px', color: '#71717a' }}>Calculate on subtotal + other taxes</div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rateIncludeShipping}
                    onChange={(e) => setRateIncludeShipping(e.target.checked)}
                    style={{ width: '18px', height: '18px', marginRight: '10px', accentColor: '#3b82f6' }}
                  />
                  <div>
                    <div style={{ fontWeight: 500 }}>Include Shipping</div>
                    <div style={{ fontSize: '13px', color: '#71717a' }}>Apply tax to shipping costs</div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rateActive}
                    onChange={(e) => setRateActive(e.target.checked)}
                    style={{ width: '18px', height: '18px', marginRight: '10px', accentColor: '#3b82f6' }}
                  />
                  <div>
                    <div style={{ fontWeight: 500 }}>Active</div>
                    <div style={{ fontSize: '13px', color: '#71717a' }}>Enable this tax rate</div>
                  </div>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setShowRateModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#27272a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRate}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {editingRate ? 'Update' : 'Create'} Tax Rate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
