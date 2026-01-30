'use client'

import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCreditCard,
  faDownload,
  faEye,
  faPalette,
  faSync,
  faUser,
  faMapMarkerAlt,
  faImage,
  faSearch,
  faCloudDownloadAlt,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons'

interface BookFadeBarber {
  id: string
  name: string
  slug: string
  businessName: string | null
  businessCity: string | null
  businessState: string | null
  profileImage: string | null
}

export default function AdminBusinessCardsPage() {
  const [isMobile, setIsMobile] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchingBarber, setFetchingBarber] = useState(false)
  const [searchingBarbers, setSearchingBarbers] = useState(false)

  // BookFade search
  const [barberSlug, setBarberSlug] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<BookFadeBarber[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [tagline, setTagline] = useState('')
  const [shopName, setShopName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [heroImage, setHeroImage] = useState('')
  const [themeColor, setThemeColor] = useState('#9a58fd')

  // Generated HTML
  const [frontHtml, setFrontHtml] = useState('')
  const [backHtml, setBackHtml] = useState('')
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front')

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch barber from BookFade by slug
  const fetchBarberFromBookFade = async (slugToFetch?: string) => {
    const targetSlug = slugToFetch || barberSlug
    if (!targetSlug) {
      alert('Enter a barber slug')
      return
    }

    setFetchingBarber(true)
    try {
      const res = await fetch(`/api/admin/bookfade/barbers?slug=${targetSlug}`)
      if (res.ok) {
        const data = await res.json()
        if (data.barber) {
          // Populate form with barber data
          setName(data.barber.name || '')
          setSlug(data.barber.slug || '')
          setTagline(data.barber.cardData?.tagline || '')
          setShopName(data.barber.businessName || '')
          setAddress(data.barber.businessAddress || '')
          setCity(data.barber.businessCity || '')
          setState(data.barber.businessState || '')
          setProfileImage(data.barber.profileImage || '')
          setHeroImage(data.barber.heroImage || '')
          setThemeColor(data.barber.themeColor || '#9a58fd')
          setShowSearchResults(false)
          setSearchResults([])
        } else {
          alert('Barber not found')
        }
      } else {
        alert('Failed to fetch barber from BookFade')
      }
    } catch (error) {
      console.error('Error fetching barber:', error)
      alert('Failed to fetch barber')
    } finally {
      setFetchingBarber(false)
    }
  }

  // Search barbers on BookFade
  const searchBarbers = async () => {
    if (!searchQuery) return

    setSearchingBarbers(true)
    try {
      const res = await fetch(`/api/admin/bookfade/barbers?search=${encodeURIComponent(searchQuery)}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.barbers || [])
        setShowSearchResults(true)
      }
    } catch (error) {
      console.error('Error searching barbers:', error)
    } finally {
      setSearchingBarbers(false)
    }
  }

  const selectBarber = (barber: BookFadeBarber) => {
    setBarberSlug(barber.slug)
    fetchBarberFromBookFade(barber.slug)
  }

  const generateCards = async () => {
    if (!name || !slug) {
      alert('Name and slug are required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/business-cards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          tagline,
          shopName,
          address,
          city,
          state,
          profileImage,
          heroImage,
          themeColor,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setFrontHtml(data.front)
        setBackHtml(data.back)
      } else {
        alert('Failed to generate cards')
      }
    } catch (error) {
      console.error('Error generating cards:', error)
      alert('Failed to generate cards')
    } finally {
      setLoading(false)
    }
  }

  const downloadHtml = (side: 'front' | 'back') => {
    const html = side === 'front' ? frontHtml : backHtml
    if (!html) return

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `business-card-${side}-${slug || 'card'}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const openPreview = (side: 'front' | 'back') => {
    const html = side === 'front' ? frontHtml : backHtml
    if (!html) return

    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(html)
      newWindow.document.close()
    }
  }

  const generateSlug = () => {
    if (name) {
      setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20))
    }
  }

  const clearForm = () => {
    setName('')
    setSlug('')
    setTagline('')
    setShopName('')
    setAddress('')
    setCity('')
    setState('')
    setProfileImage('')
    setHeroImage('')
    setThemeColor('#9a58fd')
    setFrontHtml('')
    setBackHtml('')
    setBarberSlug('')
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
        }}>Business Card Generator</h1>
        <p style={{
          color: '#a1a1aa',
          margin: 0,
          fontSize: isMobile ? '14px' : '16px'
        }}>Generate print-ready business cards for BookFade barbers</p>
      </div>

      {/* BookFade Import Section */}
      <div style={{
        background: '#18181b',
        border: '1px solid #3b82f6',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FontAwesomeIcon icon={faCloudDownloadAlt} style={{ color: '#3b82f6' }} />
          Import from BookFade
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
          {/* Fetch by Slug */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>
              Fetch by Slug (bookfade.app/b/...)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={barberSlug}
                onChange={(e) => setBarberSlug(e.target.value)}
                placeholder="kylerivers"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
                onKeyDown={(e) => e.key === 'Enter' && fetchBarberFromBookFade()}
              />
              <button
                onClick={() => fetchBarberFromBookFade()}
                disabled={fetchingBarber}
                style={{
                  padding: '10px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: fetchingBarber ? 'not-allowed' : 'pointer',
                  opacity: fetchingBarber ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {fetchingBarber ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <FontAwesomeIcon icon={faCloudDownloadAlt} />
                )}
                Fetch
              </button>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>
              Search Barbers
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, business..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
                onKeyDown={(e) => e.key === 'Enter' && searchBarbers()}
              />
              <button
                onClick={searchBarbers}
                disabled={searchingBarbers}
                style={{
                  padding: '10px 16px',
                  background: '#27272a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: searchingBarbers ? 'not-allowed' : 'pointer',
                }}
              >
                {searchingBarbers ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <FontAwesomeIcon icon={faSearch} />
                )}
              </button>
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                marginTop: '4px',
                maxHeight: '300px',
                overflow: 'auto',
                zIndex: 100,
              }}>
                {searchResults.map((barber) => (
                  <button
                    key={barber.id}
                    onClick={() => selectBarber(barber)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid #27272a',
                      color: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#27272a'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {barber.profileImage ? (
                      <img
                        src={barber.profileImage}
                        alt={barber.name}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 600,
                      }}>
                        {barber.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>{barber.name}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#71717a' }}>
                        {barber.businessName || barber.slug}
                        {barber.businessCity && ` - ${barber.businessCity}, ${barber.businessState}`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {showSearchResults && searchResults.length === 0 && searchQuery && (
          <p style={{ color: '#71717a', fontSize: '13px', marginTop: '12px', margin: '12px 0 0 0' }}>
            No barbers found matching "{searchQuery}"
          </p>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '24px',
      }}>
        {/* Form */}
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>
              <FontAwesomeIcon icon={faUser} style={{ marginRight: '10px', color: '#3b82f6' }} />
              Barber Info
            </h2>
            <button
              onClick={clearForm}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                color: '#71717a',
                border: '1px solid #27272a',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kyle Rivers"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Slug */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                Booking Slug * (bookfade.app/b/...)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="kylerivers"
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
                <button
                  onClick={generateSlug}
                  style={{
                    padding: '12px 16px',
                    background: '#27272a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#a1a1aa',
                    cursor: 'pointer',
                  }}
                  title="Generate from name"
                >
                  <FontAwesomeIcon icon={faSync} />
                </button>
              </div>
            </div>

            {/* Tagline */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Custom Fades & Beards"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Shop Name */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                Shop/Business Name
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="King's Grooming Lounge"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Address */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '12px',
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                  <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: '6px' }} />
                  Street Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="8500 Sunset Blvd"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Los Angeles"
                  style={{
                    padding: '12px 16px',
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="CA"
                  style={{
                    padding: '12px 16px',
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            {/* Images */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                <FontAwesomeIcon icon={faImage} style={{ marginRight: '6px' }} />
                Profile Image URL
              </label>
              <input
                type="url"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                placeholder="https://..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
              {profileImage && (
                <img src={profileImage} alt="Profile" style={{ width: '48px', height: '48px', borderRadius: '50%', marginTop: '8px', objectFit: 'cover' }} />
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                Hero/Background Image URL
              </label>
              <input
                type="url"
                value={heroImage}
                onChange={(e) => setHeroImage(e.target.value)}
                placeholder="https://..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Theme Color */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                <FontAwesomeIcon icon={faPalette} style={{ marginRight: '6px' }} />
                Theme Color
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  style={{
                    width: '48px',
                    height: '40px',
                    padding: '2px',
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                />
                <input
                  type="text"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  placeholder="#9a58fd"
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {['#9a58fd', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setThemeColor(color)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: color,
                      border: themeColor === color ? '2px solid white' : '2px solid transparent',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateCards}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                marginTop: '8px',
              }}
            >
              <FontAwesomeIcon icon={faCreditCard} style={{ marginRight: '8px' }} />
              {loading ? 'Generating...' : 'Generate Business Cards'}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>
              <FontAwesomeIcon icon={faEye} style={{ marginRight: '10px', color: '#10b981' }} />
              Preview
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setPreviewSide('front')}
                style={{
                  padding: '8px 16px',
                  background: previewSide === 'front' ? '#3b82f6' : '#27272a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Front
              </button>
              <button
                onClick={() => setPreviewSide('back')}
                style={{
                  padding: '8px 16px',
                  background: previewSide === 'back' ? '#3b82f6' : '#27272a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
            </div>
          </div>

          {/* Card Preview */}
          <div style={{
            background: '#09090b',
            borderRadius: '12px',
            padding: '24px',
            minHeight: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {(previewSide === 'front' ? frontHtml : backHtml) ? (
              <iframe
                srcDoc={previewSide === 'front' ? frontHtml : backHtml}
                style={{
                  width: '100%',
                  height: '280px',
                  border: 'none',
                  borderRadius: '8px',
                }}
                title={`Card ${previewSide}`}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#71717a' }}>
                <FontAwesomeIcon icon={faCreditCard} style={{ fontSize: '48px', marginBottom: '16px' }} />
                <p>Import a barber or fill in the form, then click "Generate"</p>
              </div>
            )}
          </div>

          {/* Download Actions */}
          {(frontHtml || backHtml) && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                onClick={() => openPreview('front')}
                disabled={!frontHtml}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#27272a',
                  color: frontHtml ? 'white' : '#71717a',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: frontHtml ? 'pointer' : 'not-allowed',
                }}
              >
                <FontAwesomeIcon icon={faEye} style={{ marginRight: '6px' }} />
                View Front
              </button>
              <button
                onClick={() => openPreview('back')}
                disabled={!backHtml}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#27272a',
                  color: backHtml ? 'white' : '#71717a',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: backHtml ? 'pointer' : 'not-allowed',
                }}
              >
                <FontAwesomeIcon icon={faEye} style={{ marginRight: '6px' }} />
                View Back
              </button>
            </div>
          )}

          {(frontHtml || backHtml) && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button
                onClick={() => downloadHtml('front')}
                disabled={!frontHtml}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: frontHtml ? '#10b981' : '#27272a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: frontHtml ? 'pointer' : 'not-allowed',
                  opacity: frontHtml ? 1 : 0.5,
                }}
              >
                <FontAwesomeIcon icon={faDownload} style={{ marginRight: '6px' }} />
                Download Front HTML
              </button>
              <button
                onClick={() => downloadHtml('back')}
                disabled={!backHtml}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: backHtml ? '#10b981' : '#27272a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: backHtml ? 'pointer' : 'not-allowed',
                  opacity: backHtml ? 1 : 0.5,
                }}
              >
                <FontAwesomeIcon icon={faDownload} style={{ marginRight: '6px' }} />
                Download Back HTML
              </button>
            </div>
          )}

          {/* Print Instructions */}
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: '#09090b',
            borderRadius: '8px',
            border: '1px solid #27272a',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', margin: '0 0 8px 0' }}>
              Print Instructions
            </h3>
            <ul style={{ fontSize: '13px', color: '#a1a1aa', margin: 0, paddingLeft: '20px' }}>
              <li>Card size: 3.75" x 2.25" (standard with bleed)</li>
              <li>Open HTML in Chrome, print to PDF</li>
              <li>Set margins to "None" and enable "Background graphics"</li>
              <li>Send PDF to print shop or use online service</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
