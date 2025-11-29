'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ShippingRate {
  id: string
  name: string
  description?: string
  baseRate: number
  perItemRate: number
  perPoundRate: number
  freeShippingMin?: number
  minDays: number
  maxDays: number
  carrier?: string
  serviceCode?: string
  active: boolean
  sortOrder: number
}

interface ShippingZone {
  id: string
  name: string
  countries: string[]
  states?: string[]
  zipCodes?: string
  active: boolean
  priority: number
  rates: ShippingRate[]
}

interface BusinessAddress {
  name: string
  company: string
  address1: string
  address2: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
  email: string
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
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
]

const CARRIERS = ['USPS', 'UPS', 'FedEx', 'DHL']

export default function ShippingSettingsPage() {
  const [zones, setZones] = useState<ShippingZone[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState<'zones' | 'business'>('zones')

  const [showZoneModal, setShowZoneModal] = useState(false)
  const [showRateModal, setShowRateModal] = useState(false)
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null)
  const [editingRate, setEditingRate] = useState<{ zoneId: string; rate: ShippingRate | null } | null>(null)

  const [businessAddress, setBusinessAddress] = useState<BusinessAddress>({
    name: '',
    company: '47 Industries',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    phone: '',
    email: '',
  })

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [zonesRes, settingsRes] = await Promise.all([
        fetch('/api/admin/shipping/zones'),
        fetch('/api/admin/settings?keys=business_address'),
      ])

      if (zonesRes.ok) {
        const data = await zonesRes.json()
        setZones(data)
      }

      if (settingsRes.ok) {
        const settings = await settingsRes.json()
        if (settings.business_address) {
          setBusinessAddress(JSON.parse(settings.business_address))
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBusinessAddress = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'business_address',
          value: JSON.stringify(businessAddress),
        }),
      })

      if (res.ok) {
        alert('Business address saved!')
      } else {
        alert('Failed to save')
      }
    } catch (error) {
      console.error('Error saving:', error)
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveZone = async (zone: Partial<ShippingZone>) => {
    try {
      setSaving(true)
      const method = editingZone?.id ? 'PUT' : 'POST'
      const url = editingZone?.id
        ? `/api/admin/shipping/zones/${editingZone.id}`
        : '/api/admin/shipping/zones'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zone),
      })

      if (res.ok) {
        fetchData()
        setShowZoneModal(false)
        setEditingZone(null)
      } else {
        alert('Failed to save zone')
      }
    } catch (error) {
      console.error('Error saving zone:', error)
      alert('Failed to save zone')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm('Delete this shipping zone and all its rates?')) return

    try {
      const res = await fetch(`/api/admin/shipping/zones/${zoneId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchData()
      } else {
        alert('Failed to delete zone')
      }
    } catch (error) {
      console.error('Error deleting zone:', error)
    }
  }

  const handleSaveRate = async (rate: Partial<ShippingRate>) => {
    if (!editingRate) return

    try {
      setSaving(true)
      const method = editingRate.rate?.id ? 'PUT' : 'POST'
      const url = editingRate.rate?.id
        ? `/api/admin/shipping/rates/${editingRate.rate.id}`
        : `/api/admin/shipping/zones/${editingRate.zoneId}/rates`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rate),
      })

      if (res.ok) {
        fetchData()
        setShowRateModal(false)
        setEditingRate(null)
      } else {
        alert('Failed to save rate')
      }
    } catch (error) {
      console.error('Error saving rate:', error)
      alert('Failed to save rate')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRate = async (rateId: string) => {
    if (!confirm('Delete this shipping rate?')) return

    try {
      const res = await fetch(`/api/admin/shipping/rates/${rateId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchData()
      } else {
        alert('Failed to delete rate')
      }
    } catch (error) {
      console.error('Error deleting rate:', error)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: '#0a0a0a',
    border: '1px solid #27272a',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '6px',
    color: '#a1a1aa',
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#71717a' }}>
        Loading shipping settings...
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link
          href="/admin/settings"
          style={{ color: '#71717a', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}
        >
          ← Back to Settings
        </Link>
        <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: 700, margin: 0 }}>
          Shipping Settings
        </h1>
        <p style={{ color: '#71717a', margin: '8px 0 0 0' }}>
          Configure shipping zones, rates, and business address
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('zones')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'zones' ? '#3b82f6' : '#27272a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Shipping Zones & Rates
        </button>
        <button
          onClick={() => setActiveTab('business')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'business' ? '#3b82f6' : '#27272a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Business Address (Ship From)
        </button>
      </div>

      {activeTab === 'zones' && (
        <div>
          {/* Add Zone Button */}
          <div style={{ marginBottom: '24px' }}>
            <button
              onClick={() => {
                setEditingZone(null)
                setShowZoneModal(true)
              }}
              style={{
                padding: '12px 24px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              + Add Shipping Zone
            </button>
          </div>

          {/* Zones List */}
          {zones.length === 0 ? (
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '16px',
              padding: '48px 24px',
              textAlign: 'center',
            }}>
              <p style={{ color: '#71717a', margin: 0 }}>
                No shipping zones configured. Add a zone to set up shipping rates.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  style={{
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '16px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Zone Header */}
                  <div style={{
                    padding: '20px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #27272a',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{zone.name}</h3>
                        <span style={{
                          padding: '2px 8px',
                          background: zone.active ? '#10b98120' : '#71717a20',
                          color: zone.active ? '#10b981' : '#71717a',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}>
                          {zone.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p style={{ color: '#71717a', margin: '4px 0 0 0', fontSize: '14px' }}>
                        {zone.countries.join(', ')}
                        {zone.states && zone.states.length > 0 && ` • ${zone.states.length} states`}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setEditingZone(zone)
                          setShowZoneModal(true)
                        }}
                        style={{
                          padding: '8px 16px',
                          background: '#27272a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteZone(zone.id)}
                        style={{
                          padding: '8px 16px',
                          background: '#ef444420',
                          color: '#ef4444',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Rates */}
                  <div style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#a1a1aa' }}>Shipping Rates</span>
                      <button
                        onClick={() => {
                          setEditingRate({ zoneId: zone.id, rate: null })
                          setShowRateModal(true)
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#27272a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        + Add Rate
                      </button>
                    </div>

                    {zone.rates.length === 0 ? (
                      <p style={{ color: '#71717a', fontSize: '14px', margin: 0 }}>No rates configured</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {zone.rates.map((rate) => (
                          <div
                            key={rate.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '12px 16px',
                              background: '#09090b',
                              borderRadius: '8px',
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: 500 }}>{rate.name}</span>
                              {rate.carrier && (
                                <span style={{ color: '#71717a', marginLeft: '8px', fontSize: '13px' }}>
                                  ({rate.carrier})
                                </span>
                              )}
                              <div style={{ fontSize: '13px', color: '#71717a', marginTop: '2px' }}>
                                ${Number(rate.baseRate).toFixed(2)} base
                                {Number(rate.perItemRate) > 0 && ` + $${Number(rate.perItemRate).toFixed(2)}/item`}
                                {Number(rate.perPoundRate) > 0 && ` + $${Number(rate.perPoundRate).toFixed(2)}/lb`}
                                {rate.freeShippingMin && ` • Free over $${Number(rate.freeShippingMin).toFixed(0)}`}
                              </div>
                              <div style={{ fontSize: '12px', color: '#71717a' }}>
                                {rate.minDays}-{rate.maxDays} business days
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => {
                                  setEditingRate({ zoneId: zone.id, rate })
                                  setShowRateModal(true)
                                }}
                                style={{
                                  padding: '6px 12px',
                                  background: '#27272a',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteRate(rate.id)}
                                style={{
                                  padding: '6px 12px',
                                  background: '#ef444420',
                                  color: '#ef4444',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'business' && (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', margin: '0 0 20px 0' }}>
            Ship From Address
          </h2>
          <p style={{ color: '#71717a', marginBottom: '24px', margin: '0 0 24px 0', fontSize: '14px' }}>
            This address will be used as the return/sender address when purchasing shipping labels.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Contact Name</label>
              <input
                type="text"
                value={businessAddress.name}
                onChange={(e) => setBusinessAddress({ ...businessAddress, name: e.target.value })}
                style={inputStyle}
                placeholder="Your name"
              />
            </div>
            <div>
              <label style={labelStyle}>Company</label>
              <input
                type="text"
                value={businessAddress.company}
                onChange={(e) => setBusinessAddress({ ...businessAddress, company: e.target.value })}
                style={inputStyle}
                placeholder="47 Industries"
              />
            </div>
            <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
              <label style={labelStyle}>Address Line 1</label>
              <input
                type="text"
                value={businessAddress.address1}
                onChange={(e) => setBusinessAddress({ ...businessAddress, address1: e.target.value })}
                style={inputStyle}
                placeholder="Street address"
              />
            </div>
            <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
              <label style={labelStyle}>Address Line 2</label>
              <input
                type="text"
                value={businessAddress.address2}
                onChange={(e) => setBusinessAddress({ ...businessAddress, address2: e.target.value })}
                style={inputStyle}
                placeholder="Apt, suite, etc. (optional)"
              />
            </div>
            <div>
              <label style={labelStyle}>City</label>
              <input
                type="text"
                value={businessAddress.city}
                onChange={(e) => setBusinessAddress({ ...businessAddress, city: e.target.value })}
                style={inputStyle}
                placeholder="City"
              />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <select
                value={businessAddress.state}
                onChange={(e) => setBusinessAddress({ ...businessAddress, state: e.target.value })}
                style={inputStyle}
              >
                <option value="">Select state</option>
                {US_STATES.map((state) => (
                  <option key={state.code} value={state.code}>{state.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>ZIP Code</label>
              <input
                type="text"
                value={businessAddress.zipCode}
                onChange={(e) => setBusinessAddress({ ...businessAddress, zipCode: e.target.value })}
                style={inputStyle}
                placeholder="12345"
              />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input
                type="tel"
                value={businessAddress.phone}
                onChange={(e) => setBusinessAddress({ ...businessAddress, phone: e.target.value })}
                style={inputStyle}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={businessAddress.email}
                onChange={(e) => setBusinessAddress({ ...businessAddress, email: e.target.value })}
                style={inputStyle}
                placeholder="shipping@47industries.com"
              />
            </div>
          </div>

          <button
            onClick={handleSaveBusinessAddress}
            disabled={saving}
            style={{
              marginTop: '24px',
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save Address'}
          </button>
        </div>
      )}

      {/* Zone Modal */}
      {showZoneModal && (
        <ZoneModal
          zone={editingZone}
          onSave={handleSaveZone}
          onClose={() => {
            setShowZoneModal(false)
            setEditingZone(null)
          }}
          saving={saving}
        />
      )}

      {/* Rate Modal */}
      {showRateModal && editingRate && (
        <RateModal
          rate={editingRate.rate}
          onSave={handleSaveRate}
          onClose={() => {
            setShowRateModal(false)
            setEditingRate(null)
          }}
          saving={saving}
        />
      )}
    </div>
  )
}

// Zone Modal Component
function ZoneModal({
  zone,
  onSave,
  onClose,
  saving,
}: {
  zone: ShippingZone | null
  onSave: (zone: Partial<ShippingZone>) => void
  onClose: () => void
  saving: boolean
}) {
  const [formData, setFormData] = useState({
    name: zone?.name || '',
    countries: zone?.countries || ['US'],
    states: zone?.states || [],
    zipCodes: zone?.zipCodes || '',
    active: zone?.active ?? true,
    priority: zone?.priority || 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: '#0a0a0a',
    border: '1px solid #27272a',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
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
          {zone ? 'Edit Shipping Zone' : 'Add Shipping Zone'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#a1a1aa' }}>
              Zone Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={inputStyle}
              placeholder="e.g., United States, West Coast, International"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#a1a1aa' }}>
              Countries (comma-separated codes)
            </label>
            <input
              type="text"
              required
              value={formData.countries.join(', ')}
              onChange={(e) => setFormData({ ...formData, countries: e.target.value.split(',').map(c => c.trim().toUpperCase()) })}
              style={inputStyle}
              placeholder="US, CA"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#a1a1aa' }}>
              Specific States (optional, comma-separated)
            </label>
            <input
              type="text"
              value={formData.states?.join(', ') || ''}
              onChange={(e) => setFormData({ ...formData, states: e.target.value ? e.target.value.split(',').map(s => s.trim().toUpperCase()) : [] })}
              style={inputStyle}
              placeholder="CA, NY, TX (leave empty for all states)"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#a1a1aa' }}>
              ZIP Code Ranges (optional)
            </label>
            <input
              type="text"
              value={formData.zipCodes}
              onChange={(e) => setFormData({ ...formData, zipCodes: e.target.value })}
              style={inputStyle}
              placeholder="90000-90999, 91000-91999"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#a1a1aa' }}>
              Priority (higher = checked first)
            </label>
            <input
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                style={{ marginRight: '8px' }}
              />
              <span style={{ fontSize: '14px' }}>Active</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                background: '#27272a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                padding: '12px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Zone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Rate Modal Component
function RateModal({
  rate,
  onSave,
  onClose,
  saving,
}: {
  rate: ShippingRate | null
  onSave: (rate: Partial<ShippingRate>) => void
  onClose: () => void
  saving: boolean
}) {
  const [formData, setFormData] = useState({
    name: rate?.name || '',
    description: rate?.description || '',
    baseRate: rate?.baseRate?.toString() || '0',
    perItemRate: rate?.perItemRate?.toString() || '0',
    perPoundRate: rate?.perPoundRate?.toString() || '0',
    freeShippingMin: rate?.freeShippingMin?.toString() || '',
    minDays: rate?.minDays || 3,
    maxDays: rate?.maxDays || 7,
    carrier: rate?.carrier || '',
    serviceCode: rate?.serviceCode || '',
    active: rate?.active ?? true,
    sortOrder: rate?.sortOrder || 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      baseRate: parseFloat(formData.baseRate) || 0,
      perItemRate: parseFloat(formData.perItemRate) || 0,
      perPoundRate: parseFloat(formData.perPoundRate) || 0,
      freeShippingMin: formData.freeShippingMin ? parseFloat(formData.freeShippingMin) : undefined,
    })
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: '#0a0a0a',
    border: '1px solid #27272a',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
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
          {rate ? 'Edit Shipping Rate' : 'Add Shipping Rate'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#a1a1aa' }}>
              Rate Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={inputStyle}
              placeholder="e.g., Standard, Express, Overnight"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#a1a1aa' }}>
              Description (optional)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={inputStyle}
              placeholder="5-7 business days"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#a1a1aa' }}>
                Base Rate ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.baseRate}
                onChange={(e) => setFormData({ ...formData, baseRate: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#a1a1aa' }}>
                Per Item ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.perItemRate}
                onChange={(e) => setFormData({ ...formData, perItemRate: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#a1a1aa' }}>
                Per Pound ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.perPoundRate}
                onChange={(e) => setFormData({ ...formData, perPoundRate: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#a1a1aa' }}>
                Free Shipping Over ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.freeShippingMin}
                onChange={(e) => setFormData({ ...formData, freeShippingMin: e.target.value })}
                style={inputStyle}
                placeholder="Leave empty for none"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#a1a1aa' }}>
                Min Days
              </label>
              <input
                type="number"
                min="1"
                value={formData.minDays}
                onChange={(e) => setFormData({ ...formData, minDays: parseInt(e.target.value) || 1 })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#a1a1aa' }}>
                Max Days
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxDays}
                onChange={(e) => setFormData({ ...formData, maxDays: parseInt(e.target.value) || 1 })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#a1a1aa' }}>
                Carrier (optional)
              </label>
              <select
                value={formData.carrier}
                onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                style={inputStyle}
              >
                <option value="">Select carrier</option>
                {CARRIERS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#a1a1aa' }}>
                Service Code
              </label>
              <input
                type="text"
                value={formData.serviceCode}
                onChange={(e) => setFormData({ ...formData, serviceCode: e.target.value })}
                style={inputStyle}
                placeholder="e.g., usps_priority"
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                style={{ marginRight: '8px' }}
              />
              <span style={{ fontSize: '14px' }}>Active</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                background: '#27272a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                padding: '12px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Rate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
