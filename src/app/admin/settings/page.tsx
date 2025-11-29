'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTruck,
  faPercent,
  faCheckCircle,
  faTimesCircle,
  faExternalLinkAlt,
  faStore,
  faCube,
  faEnvelope,
  faCreditCard,
  faCloud,
  faBell,
  faGlobe,
  faCode,
  faMobileAlt,
} from '@fortawesome/free-solid-svg-icons'

interface Settings {
  siteName: string
  siteDescription: string
  contactEmail: string
  contactPhone: string
  address: string
  socialTwitter: string
  socialFacebook: string
  socialInstagram: string
  socialLinkedin: string
  // Store settings
  shopEnabled: boolean
  custom3DPrintingEnabled: boolean
  webDevServicesEnabled: boolean
  appDevServicesEnabled: boolean
  // Notification settings
  orderNotificationEmail: string
  inquiryNotificationEmail: string
  lowStockThreshold: number
  // MotoRev settings
  motorevEnabled: boolean
  motorevWebsiteUrl: string
  motorevAppStoreUrl: string
  motorevLaunchDate: string
}

interface ShippoStatus {
  configured: boolean
  testResult?: {
    success: boolean
    message: string
  }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    siteName: '47 Industries',
    siteDescription: '3D printing and custom solutions',
    contactEmail: 'contact@47industries.com',
    contactPhone: '',
    address: '',
    socialTwitter: '',
    socialFacebook: '',
    socialInstagram: '',
    socialLinkedin: '',
    // Store settings
    shopEnabled: true,
    custom3DPrintingEnabled: true,
    webDevServicesEnabled: true,
    appDevServicesEnabled: true,
    // Notification settings
    orderNotificationEmail: '',
    inquiryNotificationEmail: '',
    lowStockThreshold: 5,
    // MotoRev settings
    motorevEnabled: true,
    motorevWebsiteUrl: 'https://motorevapp.com',
    motorevAppStoreUrl: '',
    motorevLaunchDate: '2025-10-17',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [isMobile, setIsMobile] = useState(false)
  const [shippoStatus, setShippoStatus] = useState<ShippoStatus>({ configured: false })
  const [taxRateCount, setTaxRateCount] = useState(0)
  const [hasBusinessAddress, setHasBusinessAddress] = useState(false)
  const [stripeConfigured, setStripeConfigured] = useState(false)
  const [zohoConnected, setZohoConnected] = useState(false)
  const [r2Configured, setR2Configured] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchSettings()
    checkShippoStatus()
    fetchTaxRates()
    checkBusinessAddress()
    checkIntegrations()
  }, [])

  const checkIntegrations = async () => {
    // Check Stripe
    try {
      const stripeRes = await fetch('/api/admin/integrations/stripe')
      if (stripeRes.ok) {
        const data = await stripeRes.json()
        setStripeConfigured(data.configured)
      }
    } catch (e) {
      console.error('Error checking Stripe:', e)
    }

    // Check Zoho
    try {
      const zohoRes = await fetch('/api/admin/email/inbox')
      const zohoData = await zohoRes.json()
      setZohoConnected(!zohoData.needsAuth)
    } catch (e) {
      console.error('Error checking Zoho:', e)
    }

    // Check R2
    try {
      const r2Res = await fetch('/api/admin/integrations/r2')
      if (r2Res.ok) {
        const data = await r2Res.json()
        setR2Configured(data.configured)
      }
    } catch (e) {
      console.error('Error checking R2:', e)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(prev => ({ ...prev, ...data }))
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkShippoStatus = async () => {
    try {
      const res = await fetch('/api/admin/shipping/status')
      if (res.ok) {
        const data = await res.json()
        setShippoStatus(data)
      }
    } catch (error) {
      console.error('Error checking Shippo status:', error)
    }
  }

  const fetchTaxRates = async () => {
    try {
      const res = await fetch('/api/admin/tax/rates')
      if (res.ok) {
        const data = await res.json()
        setTaxRateCount(data.length)
      }
    } catch (error) {
      console.error('Error fetching tax rates:', error)
    }
  }

  const checkBusinessAddress = async () => {
    try {
      const res = await fetch('/api/admin/settings?keys=business_address')
      if (res.ok) {
        const data = await res.json()
        setHasBusinessAddress(!!data.business_address)
      }
    } catch (error) {
      console.error('Error checking business address:', error)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        alert('Settings saved successfully!')
      } else {
        alert('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'services', label: 'Services' },
    { id: 'contact', label: 'Contact' },
    { id: 'social', label: 'Social' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'shipping', label: 'Shipping & Tax' },
    { id: 'integrations', label: 'Integrations' },
  ]

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: '#09090b',
    border: '1px solid #27272a',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
  }

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#a1a1aa',
  }

  const fieldStyle = {
    marginBottom: '20px',
  }

  if (loading) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ color: '#71717a' }}>Loading settings...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: isMobile ? '28px' : '36px',
          fontWeight: 700,
          marginBottom: '8px',
          margin: 0
        }}>Settings</h1>
        <p style={{
          color: '#a1a1aa',
          margin: 0,
          fontSize: isMobile ? '14px' : '16px'
        }}>Configure your site settings</p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.id ? '#3b82f6' : '#18181b',
              color: activeTab === tab.id ? 'white' : '#a1a1aa',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '16px',
        padding: '24px',
      }}>
        {activeTab === 'general' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', margin: '0 0 24px 0' }}>
              General Settings
            </h2>
            <div style={fieldStyle}>
              <label style={labelStyle}>Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Site Description</label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', margin: '0 0 8px 0' }}>
              Services & Features
            </h2>
            <p style={{ color: '#71717a', marginBottom: '24px', margin: '0 0 24px 0', fontSize: '14px' }}>
              Enable or disable different sections of your website
            </p>

            {/* Shop */}
            <div style={{
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: '#3b82f620',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <FontAwesomeIcon icon={faStore} style={{ color: '#3b82f6', fontSize: '18px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Shop / E-Commerce</h3>
                  <p style={{ color: '#71717a', margin: 0, fontSize: '13px' }}>Product catalog and checkout</p>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.shopEnabled}
                  onChange={(e) => setSettings({ ...settings, shopEnabled: e.target.checked })}
                  style={{ display: 'none' }}
                />
                <div style={{
                  width: '44px',
                  height: '24px',
                  background: settings.shopEnabled ? '#3b82f6' : '#27272a',
                  borderRadius: '12px',
                  position: 'relative',
                  transition: 'background 0.2s',
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    background: 'white',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '2px',
                    left: settings.shopEnabled ? '22px' : '2px',
                    transition: 'left 0.2s',
                  }} />
                </div>
              </label>
            </div>

            {/* Custom 3D Printing */}
            <div style={{
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: '#8b5cf620',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <FontAwesomeIcon icon={faCube} style={{ color: '#8b5cf6', fontSize: '18px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Custom 3D Printing</h3>
                  <p style={{ color: '#71717a', margin: 0, fontSize: '13px' }}>Quote request form for custom prints</p>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.custom3DPrintingEnabled}
                  onChange={(e) => setSettings({ ...settings, custom3DPrintingEnabled: e.target.checked })}
                  style={{ display: 'none' }}
                />
                <div style={{
                  width: '44px',
                  height: '24px',
                  background: settings.custom3DPrintingEnabled ? '#3b82f6' : '#27272a',
                  borderRadius: '12px',
                  position: 'relative',
                  transition: 'background 0.2s',
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    background: 'white',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '2px',
                    left: settings.custom3DPrintingEnabled ? '22px' : '2px',
                    transition: 'left 0.2s',
                  }} />
                </div>
              </label>
            </div>

            {/* Web Development */}
            <div style={{
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: '#10b98120',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <FontAwesomeIcon icon={faCode} style={{ color: '#10b981', fontSize: '18px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Web Development Services</h3>
                  <p style={{ color: '#71717a', margin: 0, fontSize: '13px' }}>Web dev consultation and projects</p>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.webDevServicesEnabled}
                  onChange={(e) => setSettings({ ...settings, webDevServicesEnabled: e.target.checked })}
                  style={{ display: 'none' }}
                />
                <div style={{
                  width: '44px',
                  height: '24px',
                  background: settings.webDevServicesEnabled ? '#3b82f6' : '#27272a',
                  borderRadius: '12px',
                  position: 'relative',
                  transition: 'background 0.2s',
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    background: 'white',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '2px',
                    left: settings.webDevServicesEnabled ? '22px' : '2px',
                    transition: 'left 0.2s',
                  }} />
                </div>
              </label>
            </div>

            {/* App Development */}
            <div style={{
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: '#f59e0b20',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <FontAwesomeIcon icon={faMobileAlt} style={{ color: '#f59e0b', fontSize: '18px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>App Development Services</h3>
                  <p style={{ color: '#71717a', margin: 0, fontSize: '13px' }}>Mobile & desktop app development</p>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.appDevServicesEnabled}
                  onChange={(e) => setSettings({ ...settings, appDevServicesEnabled: e.target.checked })}
                  style={{ display: 'none' }}
                />
                <div style={{
                  width: '44px',
                  height: '24px',
                  background: settings.appDevServicesEnabled ? '#3b82f6' : '#27272a',
                  borderRadius: '12px',
                  position: 'relative',
                  transition: 'background 0.2s',
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    background: 'white',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '2px',
                    left: settings.appDevServicesEnabled ? '22px' : '2px',
                    transition: 'left 0.2s',
                  }} />
                </div>
              </label>
            </div>

            {/* MotoRev */}
            <div style={{
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: '#ef444420',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <FontAwesomeIcon icon={faGlobe} style={{ color: '#ef4444', fontSize: '18px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>MotoRev Page</h3>
                  <p style={{ color: '#71717a', margin: 0, fontSize: '13px' }}>Motorcycle app showcase page</p>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.motorevEnabled}
                  onChange={(e) => setSettings({ ...settings, motorevEnabled: e.target.checked })}
                  style={{ display: 'none' }}
                />
                <div style={{
                  width: '44px',
                  height: '24px',
                  background: settings.motorevEnabled ? '#3b82f6' : '#27272a',
                  borderRadius: '12px',
                  position: 'relative',
                  transition: 'background 0.2s',
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    background: 'white',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '2px',
                    left: settings.motorevEnabled ? '22px' : '2px',
                    transition: 'left 0.2s',
                  }} />
                </div>
              </label>
            </div>

            {/* MotoRev Settings */}
            {settings.motorevEnabled && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #27272a' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>MotoRev Settings</h3>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Website URL</label>
                  <input
                    type="url"
                    value={settings.motorevWebsiteUrl}
                    onChange={(e) => setSettings({ ...settings, motorevWebsiteUrl: e.target.value })}
                    placeholder="https://motorevapp.com"
                    style={inputStyle}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>App Store URL</label>
                  <input
                    type="url"
                    value={settings.motorevAppStoreUrl}
                    onChange={(e) => setSettings({ ...settings, motorevAppStoreUrl: e.target.value })}
                    placeholder="https://apps.apple.com/..."
                    style={inputStyle}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Launch Date</label>
                  <input
                    type="date"
                    value={settings.motorevLaunchDate}
                    onChange={(e) => setSettings({ ...settings, motorevLaunchDate: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contact' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', margin: '0 0 24px 0' }}>
              Contact Information
            </h2>
            <div style={fieldStyle}>
              <label style={labelStyle}>Contact Email</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Contact Phone</label>
              <input
                type="tel"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Business Address</label>
              <textarea
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', margin: '0 0 24px 0' }}>
              Social Media Links
            </h2>
            <div style={fieldStyle}>
              <label style={labelStyle}>Twitter/X</label>
              <input
                type="url"
                value={settings.socialTwitter}
                onChange={(e) => setSettings({ ...settings, socialTwitter: e.target.value })}
                placeholder="https://twitter.com/47industries"
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Facebook</label>
              <input
                type="url"
                value={settings.socialFacebook}
                onChange={(e) => setSettings({ ...settings, socialFacebook: e.target.value })}
                placeholder="https://facebook.com/47industries"
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Instagram</label>
              <input
                type="url"
                value={settings.socialInstagram}
                onChange={(e) => setSettings({ ...settings, socialInstagram: e.target.value })}
                placeholder="https://instagram.com/47industries"
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>LinkedIn</label>
              <input
                type="url"
                value={settings.socialLinkedin}
                onChange={(e) => setSettings({ ...settings, socialLinkedin: e.target.value })}
                placeholder="https://linkedin.com/company/47industries"
                style={inputStyle}
              />
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', margin: '0 0 8px 0' }}>
              Notification Settings
            </h2>
            <p style={{ color: '#71717a', marginBottom: '24px', margin: '0 0 24px 0', fontSize: '14px' }}>
              Configure where notifications are sent for different events
            </p>

            <div style={fieldStyle}>
              <label style={labelStyle}>Order Notification Email</label>
              <input
                type="email"
                value={settings.orderNotificationEmail}
                onChange={(e) => setSettings({ ...settings, orderNotificationEmail: e.target.value })}
                placeholder="orders@47industries.com"
                style={inputStyle}
              />
              <p style={{ color: '#71717a', marginTop: '6px', fontSize: '13px' }}>
                Receive notifications when new orders are placed
              </p>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Inquiry Notification Email</label>
              <input
                type="email"
                value={settings.inquiryNotificationEmail}
                onChange={(e) => setSettings({ ...settings, inquiryNotificationEmail: e.target.value })}
                placeholder="inquiries@47industries.com"
                style={inputStyle}
              />
              <p style={{ color: '#71717a', marginTop: '6px', fontSize: '13px' }}>
                Receive notifications for custom 3D printing quotes and service inquiries
              </p>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Low Stock Alert Threshold</label>
              <input
                type="number"
                min="1"
                value={settings.lowStockThreshold}
                onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) || 5 })}
                style={{ ...inputStyle, maxWidth: '150px' }}
              />
              <p style={{ color: '#71717a', marginTop: '6px', fontSize: '13px' }}>
                Get notified when product stock falls below this number
              </p>
            </div>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', margin: '0 0 8px 0' }}>
              Shipping & Tax Settings
            </h2>
            <p style={{ color: '#71717a', marginBottom: '24px', margin: '0 0 24px 0', fontSize: '14px' }}>
              Configure real-time shipping rates via Shippo and location-based tax calculation
            </p>

            {/* Shippo Integration Card */}
            <div style={{
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: shippoStatus.configured ? '#10b98120' : '#f59e0b20',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <FontAwesomeIcon
                      icon={faTruck}
                      style={{ fontSize: '20px', color: shippoStatus.configured ? '#10b981' : '#f59e0b' }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Shippo Shipping</h3>
                      <span style={{
                        padding: '2px 8px',
                        background: shippoStatus.configured ? '#10b98120' : '#f59e0b20',
                        color: shippoStatus.configured ? '#10b981' : '#f59e0b',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <FontAwesomeIcon icon={shippoStatus.configured ? faCheckCircle : faTimesCircle} style={{ fontSize: '10px' }} />
                        {shippoStatus.configured ? 'Connected' : 'Not Configured'}
                      </span>
                    </div>
                    <p style={{ color: '#71717a', margin: 0, fontSize: '14px' }}>
                      {shippoStatus.configured
                        ? 'Real-time rates from USPS, UPS, FedEx and more. Buy shipping labels directly from orders.'
                        : 'Add your SHIPPO_API_KEY to environment variables to enable real-time shipping rates.'}
                    </p>
                    {hasBusinessAddress && (
                      <p style={{ color: '#3b82f6', margin: '8px 0 0 0', fontSize: '13px' }}>
                        Ship-from address configured
                      </p>
                    )}
                    {!hasBusinessAddress && shippoStatus.configured && (
                      <p style={{ color: '#f59e0b', margin: '8px 0 0 0', fontSize: '13px' }}>
                        Set up your ship-from address to purchase labels
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  href="/admin/settings/shipping"
                  style={{
                    padding: '10px 20px',
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Configure Shipping
                  <FontAwesomeIcon icon={faExternalLinkAlt} style={{ fontSize: '12px' }} />
                </Link>
              </div>
            </div>

            {/* Tax Settings Card */}
            <div style={{
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: taxRateCount > 0 ? '#10b98120' : '#71717a20',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <FontAwesomeIcon
                      icon={faPercent}
                      style={{ fontSize: '20px', color: taxRateCount > 0 ? '#10b981' : '#71717a' }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Tax Rates</h3>
                      <span style={{
                        padding: '2px 8px',
                        background: taxRateCount > 0 ? '#10b98120' : '#71717a20',
                        color: taxRateCount > 0 ? '#10b981' : '#71717a',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}>
                        {taxRateCount} {taxRateCount === 1 ? 'rate' : 'rates'} configured
                      </span>
                    </div>
                    <p style={{ color: '#71717a', margin: 0, fontSize: '14px' }}>
                      Location-based tax calculation by country, state, city, or ZIP code. Supports compound taxes.
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/settings/tax"
                  style={{
                    padding: '10px 20px',
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Configure Tax
                  <FontAwesomeIcon icon={faExternalLinkAlt} style={{ fontSize: '12px' }} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', margin: '0 0 8px 0' }}>
              Integrations
            </h2>
            <p style={{ color: '#71717a', marginBottom: '24px', margin: '0 0 24px 0', fontSize: '14px' }}>
              Third-party services connected to your website
            </p>

            {/* Stripe */}
            <div style={{
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: stripeConfigured ? '#10b98120' : '#f59e0b20',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <FontAwesomeIcon icon={faCreditCard} style={{ fontSize: '20px', color: stripeConfigured ? '#10b981' : '#f59e0b' }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Stripe Payments</h3>
                      <span style={{
                        padding: '2px 8px',
                        background: stripeConfigured ? '#10b98120' : '#f59e0b20',
                        color: stripeConfigured ? '#10b981' : '#f59e0b',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <FontAwesomeIcon icon={stripeConfigured ? faCheckCircle : faTimesCircle} style={{ fontSize: '10px' }} />
                        {stripeConfigured ? 'Connected' : 'Not Configured'}
                      </span>
                    </div>
                    <p style={{ color: '#71717a', margin: 0, fontSize: '14px' }}>
                      {stripeConfigured ? 'Accept credit card payments via Stripe' : 'Add STRIPE_SECRET_KEY to enable payments'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Zoho Mail */}
            <div style={{
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: zohoConnected ? '#10b98120' : '#f59e0b20',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <FontAwesomeIcon icon={faEnvelope} style={{ fontSize: '20px', color: zohoConnected ? '#10b981' : '#f59e0b' }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Zoho Mail</h3>
                      <span style={{
                        padding: '2px 8px',
                        background: zohoConnected ? '#10b98120' : '#f59e0b20',
                        color: zohoConnected ? '#10b981' : '#f59e0b',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <FontAwesomeIcon icon={zohoConnected ? faCheckCircle : faTimesCircle} style={{ fontSize: '10px' }} />
                        {zohoConnected ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                    <p style={{ color: '#71717a', margin: 0, fontSize: '14px' }}>
                      {zohoConnected ? 'Send and receive emails from admin console' : 'Connect Zoho to manage email'}
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/email"
                  style={{
                    padding: '10px 20px',
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {zohoConnected ? 'Go to Email' : 'Connect'}
                  <FontAwesomeIcon icon={faExternalLinkAlt} style={{ fontSize: '12px' }} />
                </Link>
              </div>
            </div>

            {/* Cloudflare R2 */}
            <div style={{
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: r2Configured ? '#10b98120' : '#71717a20',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <FontAwesomeIcon icon={faCloud} style={{ fontSize: '20px', color: r2Configured ? '#10b981' : '#71717a' }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Cloudflare R2 Storage</h3>
                      <span style={{
                        padding: '2px 8px',
                        background: r2Configured ? '#10b98120' : '#71717a20',
                        color: r2Configured ? '#10b981' : '#71717a',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <FontAwesomeIcon icon={r2Configured ? faCheckCircle : faTimesCircle} style={{ fontSize: '10px' }} />
                        {r2Configured ? 'Connected' : 'Not Configured'}
                      </span>
                    </div>
                    <p style={{ color: '#71717a', margin: 0, fontSize: '14px' }}>
                      {r2Configured ? 'File uploads stored in Cloudflare R2' : 'Add R2 credentials in environment variables'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button - only show for editable tabs */}
        {!['shipping', 'integrations'].includes(activeTab) && (
          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #27272a' }}>
            <button
              onClick={saveSettings}
              disabled={saving}
              style={{
                padding: '12px 24px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
