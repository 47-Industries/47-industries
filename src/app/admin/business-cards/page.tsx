'use client'

import { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCreditCard,
  faDownload,
  faEye,
  faPalette,
  faUser,
  faMapMarkerAlt,
  faImage,
  faSearch,
  faCloudDownloadAlt,
  faSpinner,
  faQrcode,
  faSave,
  faTrash,
  faFolderOpen,
  faGlobe,
  faEnvelope,
  faPhone,
  faBuilding,
  faIdBadge,
} from '@fortawesome/free-solid-svg-icons'
import { BRAND_CARD_DEFAULTS } from '@/config/brands'
import { CARD_LAYOUTS, type CardLayout, type CardBrand } from '@/lib/business-card-generator'

interface BookFadeBarber {
  id: string
  name: string
  slug: string
  businessName: string | null
  businessCity: string | null
  businessState: string | null
  profileImage: string | null
}

interface TeamMember {
  id: string
  name: string | null
  email: string | null
  username: string | null
  role: string
  image: string | null
  title: string | null
  phone: string | null
  workEmail: string | null
}

interface SavedDesign {
  id: string
  name: string
  brand: CardBrand | null
  cardData: Record<string, unknown>
  createdAt: string
}

type BrandTab = 'FORTY_SEVEN_INDUSTRIES' | 'MOTOREV' | 'BOOKFADE' | 'CUSTOM'

const BRAND_TABS: { key: BrandTab; label: string; color: string }[] = [
  { key: 'FORTY_SEVEN_INDUSTRIES', label: '47 Industries', color: '#3b82f6' },
  { key: 'MOTOREV', label: 'MotoRev', color: '#ef4444' },
  { key: 'BOOKFADE', label: 'BookFade', color: '#9a58fd' },
  { key: 'CUSTOM', label: 'Custom', color: '#71717a' },
]

export default function AdminBusinessCardsPage() {
  const [isMobile, setIsMobile] = useState(false)
  const [loading, setLoading] = useState(false)
  const [savingDesign, setSavingDesign] = useState(false)

  // Brand selection
  const [selectedBrand, setSelectedBrand] = useState<BrandTab>('FORTY_SEVEN_INDUSTRIES')

  // Layout selection
  const [selectedLayout, setSelectedLayout] = useState<CardLayout>('standard')

  // BookFade import
  const [barberSlug, setBarberSlug] = useState('')
  const [fetchingBarber, setFetchingBarber] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<BookFadeBarber[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchingBarbers, setSearchingBarbers] = useState(false)

  // Team member import
  const [teamSearchQuery, setTeamSearchQuery] = useState('')
  const [teamSearchResults, setTeamSearchResults] = useState<TeamMember[]>([])
  const [showTeamResults, setShowTeamResults] = useState(false)
  const [searchingTeam, setSearchingTeam] = useState(false)

  // Saved designs
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([])
  const [loadingDesigns, setLoadingDesigns] = useState(false)
  const [showSavedDesigns, setShowSavedDesigns] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [logoImage, setLogoImage] = useState('')
  const [backgroundImage, setBackgroundImage] = useState('')
  const [themeColor, setThemeColor] = useState('#3b82f6')

  // QR Code
  const [qrEnabled, setQrEnabled] = useState(false)
  const [qrUrl, setQrUrl] = useState('')
  const [qrLabel, setQrLabel] = useState('Scan to Visit')

  // Legacy BookFade fields
  const [slug, setSlug] = useState('')

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

  // Load brand defaults when brand changes
  useEffect(() => {
    const defaults = BRAND_CARD_DEFAULTS[selectedBrand]
    if (defaults) {
      setCompany(defaults.company || '')
      setThemeColor(defaults.themeColor || '#3b82f6')
      setLogoImage(defaults.logoImage || '')
      setSelectedLayout(defaults.layout || 'standard')
      setWebsite(defaults.website || '')

      if (defaults.qrCode) {
        setQrEnabled(defaults.qrCode.enabled)
        setQrUrl(defaults.qrCode.url || '')
        setQrLabel(defaults.qrCode.label || 'Scan to Visit')
      } else {
        setQrEnabled(false)
        setQrUrl('')
        setQrLabel('Scan to Visit')
      }
    }
  }, [selectedBrand])

  // Fetch saved designs
  const fetchSavedDesigns = useCallback(async () => {
    setLoadingDesigns(true)
    try {
      const res = await fetch('/api/admin/business-cards/designs')
      if (res.ok) {
        const data = await res.json()
        setSavedDesigns(data.designs || [])
      }
    } catch (error) {
      console.error('Error fetching designs:', error)
    } finally {
      setLoadingDesigns(false)
    }
  }, [])

  useEffect(() => {
    fetchSavedDesigns()
  }, [fetchSavedDesigns])

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
          setName(data.barber.name || '')
          setSlug(data.barber.slug || '')
          setTitle(data.barber.cardData?.tagline || 'Professional Barber')
          setCompany(data.barber.businessName || '')
          setAddress(data.barber.businessAddress || '')
          setCity(data.barber.businessCity || '')
          setState(data.barber.businessState || '')
          setProfileImage(data.barber.profileImage || '')
          setBackgroundImage(data.barber.heroImage || '')
          setThemeColor(data.barber.themeColor || '#9a58fd')

          // Set QR code for BookFade
          setQrEnabled(true)
          setQrUrl(`https://bookfade.app/b/${data.barber.slug}`)
          setQrLabel('Scan to Book')

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

  // Search team members
  const searchTeamMembers = async () => {
    if (!teamSearchQuery) return

    setSearchingTeam(true)
    try {
      const res = await fetch(`/api/admin/users/lookup?search=${encodeURIComponent(teamSearchQuery)}`)
      if (res.ok) {
        const data = await res.json()
        setTeamSearchResults(data.users || [])
        setShowTeamResults(true)
      }
    } catch (error) {
      console.error('Error searching team:', error)
    } finally {
      setSearchingTeam(false)
    }
  }

  const selectTeamMember = (member: TeamMember) => {
    setName(member.name || '')
    // Use work email from TeamMember, fall back to personal email
    setEmail(member.workEmail || member.email || '')
    setPhone(member.phone || '')
    setTitle(member.title || getRoleTitle(member.role))
    setProfileImage(member.image || '')
    setShowTeamResults(false)
    setTeamSearchResults([])
  }

  const getRoleTitle = (role: string): string => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Founder'
      case 'ADMIN':
        return 'Team Member'
      default:
        return ''
    }
  }

  // Load saved design
  const loadDesign = (design: SavedDesign) => {
    const data = design.cardData
    setName((data.name as string) || '')
    setTitle((data.title as string) || '')
    setCompany((data.company as string) || '')
    setEmail((data.email as string) || '')
    setPhone((data.phone as string) || '')
    setWebsite((data.website as string) || '')
    setAddress((data.address as string) || '')
    setCity((data.city as string) || '')
    setState((data.state as string) || '')
    setProfileImage((data.profileImage as string) || '')
    setLogoImage((data.logoImage as string) || '')
    setBackgroundImage((data.backgroundImage as string) || '')
    setThemeColor((data.themeColor as string) || '#3b82f6')
    setSelectedLayout((data.layout as CardLayout) || 'standard')
    setSlug((data.slug as string) || '')

    const qrCode = data.qrCode as { enabled?: boolean; url?: string; label?: string } | undefined
    if (qrCode) {
      setQrEnabled(qrCode.enabled || false)
      setQrUrl(qrCode.url || '')
      setQrLabel(qrCode.label || 'Scan to Visit')
    }

    if (design.brand) {
      setSelectedBrand(design.brand as BrandTab)
    }

    setShowSavedDesigns(false)
  }

  // Save current design
  const saveDesign = async () => {
    if (!name) {
      alert('Please enter a name before saving')
      return
    }

    setSavingDesign(true)
    try {
      const cardData = {
        name,
        title,
        company,
        email,
        phone,
        website,
        address,
        city,
        state,
        profileImage,
        logoImage,
        backgroundImage,
        themeColor,
        layout: selectedLayout,
        slug,
        qrCode: {
          enabled: qrEnabled,
          url: qrUrl,
          label: qrLabel,
        },
      }

      const displayName = `${name}${company ? ` - ${company}` : ''}`

      const res = await fetch('/api/admin/business-cards/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: displayName,
          brand: selectedBrand !== 'CUSTOM' ? selectedBrand : null,
          cardData,
        }),
      })

      if (res.ok) {
        fetchSavedDesigns()
        alert('Design saved!')
      } else {
        alert('Failed to save design')
      }
    } catch (error) {
      console.error('Error saving design:', error)
      alert('Failed to save design')
    } finally {
      setSavingDesign(false)
    }
  }

  // Delete saved design
  const deleteDesign = async (id: string) => {
    if (!confirm('Delete this saved design?')) return

    try {
      const res = await fetch(`/api/admin/business-cards/designs/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchSavedDesigns()
      }
    } catch (error) {
      console.error('Error deleting design:', error)
    }
  }

  // Generate cards
  const generateCards = async () => {
    if (!name) {
      alert('Name is required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/business-cards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          title,
          company,
          email,
          phone,
          website,
          profileImage,
          logoImage,
          backgroundImage,
          themeColor,
          layout: selectedLayout,
          brand: selectedBrand,
          slug,
          address,
          city,
          state,
          heroImage: backgroundImage,
          qrCode: {
            enabled: qrEnabled,
            url: qrUrl,
            label: qrLabel,
          },
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
    const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    a.download = `business-card-${side}-${safeName || 'card'}.html`
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

  const clearForm = () => {
    setName('')
    setTitle('')
    setCompany(BRAND_CARD_DEFAULTS[selectedBrand]?.company || '')
    setEmail('')
    setPhone('')
    setWebsite(BRAND_CARD_DEFAULTS[selectedBrand]?.website || '')
    setAddress('')
    setCity('')
    setState('')
    setProfileImage('')
    setLogoImage(BRAND_CARD_DEFAULTS[selectedBrand]?.logoImage || '')
    setBackgroundImage('')
    setThemeColor(BRAND_CARD_DEFAULTS[selectedBrand]?.themeColor || '#3b82f6')
    setSlug('')
    setBarberSlug('')
    setFrontHtml('')
    setBackHtml('')

    const defaults = BRAND_CARD_DEFAULTS[selectedBrand]
    if (defaults?.qrCode) {
      setQrEnabled(defaults.qrCode.enabled)
      setQrUrl(defaults.qrCode.url)
      setQrLabel(defaults.qrCode.label)
    } else {
      setQrEnabled(false)
      setQrUrl('')
      setQrLabel('Scan to Visit')
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: '#09090b',
    border: '1px solid #27272a',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    color: '#a1a1aa',
    marginBottom: '6px',
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
        }}>Create custom business cards for any brand or individual</p>
      </div>

      {/* Brand Selector Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        {BRAND_TABS.map((brand) => (
          <button
            key={brand.key}
            onClick={() => setSelectedBrand(brand.key)}
            style={{
              padding: '10px 20px',
              background: selectedBrand === brand.key ? brand.color : '#27272a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {brand.label}
          </button>
        ))}
      </div>

      {/* Import Section - Conditional based on brand */}
      {(selectedBrand === 'BOOKFADE' || selectedBrand === 'FORTY_SEVEN_INDUSTRIES') && (
        <div style={{
          background: '#18181b',
          border: `1px solid ${BRAND_TABS.find(b => b.key === selectedBrand)?.color || '#3b82f6'}`,
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FontAwesomeIcon icon={faCloudDownloadAlt} style={{ color: BRAND_TABS.find(b => b.key === selectedBrand)?.color }} />
            {selectedBrand === 'BOOKFADE' ? 'Import from BookFade' : 'Import from Team'}
          </h2>

          {selectedBrand === 'BOOKFADE' && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
              {/* Fetch by Slug */}
              <div>
                <label style={labelStyle}>Fetch by Slug (bookfade.app/b/...)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={barberSlug}
                    onChange={(e) => setBarberSlug(e.target.value)}
                    placeholder="kylerivers"
                    style={{ ...inputStyle, flex: 1 }}
                    onKeyDown={(e) => e.key === 'Enter' && fetchBarberFromBookFade()}
                  />
                  <button
                    onClick={() => fetchBarberFromBookFade()}
                    disabled={fetchingBarber}
                    style={{
                      padding: '10px 16px',
                      background: '#9a58fd',
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
                    {fetchingBarber ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCloudDownloadAlt} />}
                    Fetch
                  </button>
                </div>
              </div>

              {/* Search Barbers */}
              <div style={{ position: 'relative' }}>
                <label style={labelStyle}>Search Barbers</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, business..."
                    style={{ ...inputStyle, flex: 1 }}
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
                    {searchingBarbers ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSearch} />}
                  </button>
                </div>

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
                      >
                        {barber.profileImage ? (
                          <img
                            src={barber.profileImage}
                            alt={barber.name}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: '#9a58fd',
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
          )}

          {selectedBrand === 'FORTY_SEVEN_INDUSTRIES' && (
            <div style={{ position: 'relative' }}>
              <label style={labelStyle}>Search Team Members</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  style={{ ...inputStyle, flex: 1, maxWidth: '400px' }}
                  onKeyDown={(e) => e.key === 'Enter' && searchTeamMembers()}
                />
                <button
                  onClick={searchTeamMembers}
                  disabled={searchingTeam}
                  style={{
                    padding: '10px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: searchingTeam ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {searchingTeam ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSearch} />}
                  Search
                </button>
              </div>

              {showTeamResults && teamSearchResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  maxWidth: '500px',
                  background: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  marginTop: '4px',
                  maxHeight: '300px',
                  overflow: 'auto',
                  zIndex: 100,
                }}>
                  {teamSearchResults.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => selectTeamMember(member)}
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
                    >
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name || ''}
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
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
                          {(member.name || 'U').charAt(0)}
                        </div>
                      )}
                      <div>
                        <p style={{ margin: 0, fontWeight: 500 }}>{member.name || 'Unknown'}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#71717a' }}>
                          {member.email} - {member.role.replace('_', ' ')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Layout Selector */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>
          Card Layout
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '12px',
        }}>
          {CARD_LAYOUTS.map((layout) => (
            <button
              key={layout.id}
              onClick={() => setSelectedLayout(layout.id)}
              style={{
                padding: '16px',
                background: selectedLayout === layout.id ? '#27272a' : '#09090b',
                border: selectedLayout === layout.id ? `2px solid ${themeColor}` : '2px solid #27272a',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                {layout.name}
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#71717a' }}>
                {layout.description}
              </p>
              {layout.hasQrCodeByDefault && (
                <span style={{
                  display: 'inline-block',
                  marginTop: '8px',
                  padding: '2px 6px',
                  background: '#3b82f6',
                  borderRadius: '4px',
                  fontSize: '10px',
                  color: '#fff',
                }}>
                  QR Default
                </span>
              )}
            </button>
          ))}
        </div>
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
              <FontAwesomeIcon icon={faUser} style={{ marginRight: '10px', color: themeColor }} />
              Card Details
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowSavedDesigns(!showSavedDesigns)}
                style={{
                  padding: '6px 12px',
                  background: showSavedDesigns ? '#3b82f6' : 'transparent',
                  color: showSavedDesigns ? 'white' : '#71717a',
                  border: '1px solid #27272a',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FontAwesomeIcon icon={faFolderOpen} />
                Saved
              </button>
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
          </div>

          {/* Saved Designs Dropdown */}
          {showSavedDesigns && (
            <div style={{
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              maxHeight: '200px',
              overflow: 'auto',
            }}>
              {loadingDesigns ? (
                <p style={{ color: '#71717a', textAlign: 'center', margin: 0 }}>Loading...</p>
              ) : savedDesigns.length === 0 ? (
                <p style={{ color: '#71717a', textAlign: 'center', margin: 0 }}>No saved designs</p>
              ) : (
                savedDesigns.map((design) => (
                  <div
                    key={design.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px',
                      borderRadius: '6px',
                      marginBottom: '4px',
                    }}
                  >
                    <button
                      onClick={() => loadDesign(design)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        textAlign: 'left',
                        cursor: 'pointer',
                        flex: 1,
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{design.name}</span>
                      {design.brand && (
                        <span style={{ marginLeft: '8px', fontSize: '11px', color: '#71717a' }}>
                          ({design.brand.replace('_', ' ')})
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => deleteDesign(design.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px 8px',
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Name */}
            <div>
              <label style={labelStyle}>
                <FontAwesomeIcon icon={faUser} style={{ marginRight: '6px' }} />
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kyle Rivers"
                style={inputStyle}
              />
            </div>

            {/* Title */}
            <div>
              <label style={labelStyle}>
                <FontAwesomeIcon icon={faIdBadge} style={{ marginRight: '6px' }} />
                Title / Role
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Founder, CEO, Professional Barber..."
                style={inputStyle}
              />
            </div>

            {/* Company */}
            <div>
              <label style={labelStyle}>
                <FontAwesomeIcon icon={faBuilding} style={{ marginRight: '6px' }} />
                Company / Business Name
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="47 Industries"
                style={inputStyle}
              />
            </div>

            {/* Contact Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>
                  <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: '6px' }} />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kyle@47industries.com"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  <FontAwesomeIcon icon={faPhone} style={{ marginRight: '6px' }} />
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <label style={labelStyle}>
                <FontAwesomeIcon icon={faGlobe} style={{ marginRight: '6px' }} />
                Website
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="47industries.com"
                style={inputStyle}
              />
            </div>

            {/* Address */}
            <div>
              <label style={labelStyle}>
                <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: '6px' }} />
                Address (Optional)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St"
                style={{ ...inputStyle, marginBottom: '8px' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Los Angeles"
                  style={inputStyle}
                />
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="CA"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* QR Code Section */}
            <div style={{
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '16px',
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: qrEnabled ? '12px' : 0 }}>
                <input
                  type="checkbox"
                  checked={qrEnabled}
                  onChange={(e) => setQrEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: themeColor }}
                />
                <FontAwesomeIcon icon={faQrcode} style={{ color: themeColor }} />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Enable QR Code</span>
              </label>

              {qrEnabled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>QR Code URL</label>
                    <input
                      type="url"
                      value={qrUrl}
                      onChange={(e) => setQrUrl(e.target.value)}
                      placeholder="https://47industries.com"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>QR Label</label>
                    <input
                      type="text"
                      value={qrLabel}
                      onChange={(e) => setQrLabel(e.target.value)}
                      placeholder="Scan to Visit"
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Images */}
            <div>
              <label style={labelStyle}>
                <FontAwesomeIcon icon={faImage} style={{ marginRight: '6px' }} />
                Profile Image URL
              </label>
              <input
                type="url"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                placeholder="https://..."
                style={inputStyle}
              />
              {profileImage && (
                <img src={profileImage} alt="Profile" style={{ width: '48px', height: '48px', borderRadius: '50%', marginTop: '8px', objectFit: 'cover' }} />
              )}
            </div>

            <div>
              <label style={labelStyle}>Logo Image URL (for back)</label>
              <input
                type="url"
                value={logoImage}
                onChange={(e) => setLogoImage(e.target.value)}
                placeholder="https://..."
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Background/Hero Image URL</label>
              <input
                type="url"
                value={backgroundImage}
                onChange={(e) => setBackgroundImage(e.target.value)}
                placeholder="https://..."
                style={inputStyle}
              />
            </div>

            {/* Theme Color */}
            <div>
              <label style={labelStyle}>
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
                  placeholder="#3b82f6"
                  style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {['#3b82f6', '#9a58fd', '#ef4444', '#10b981', '#f59e0b', '#ec4899'].map((color) => (
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

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={generateCards}
                disabled={loading}
                style={{
                  flex: 2,
                  padding: '14px',
                  background: themeColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <FontAwesomeIcon icon={faCreditCard} style={{ marginRight: '8px' }} />
                {loading ? 'Generating...' : 'Generate Cards'}
              </button>
              <button
                onClick={saveDesign}
                disabled={savingDesign || !name}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#27272a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: (savingDesign || !name) ? 'not-allowed' : 'pointer',
                  opacity: (savingDesign || !name) ? 0.5 : 1,
                }}
              >
                <FontAwesomeIcon icon={faSave} style={{ marginRight: '8px' }} />
                {savingDesign ? 'Saving...' : 'Save'}
              </button>
            </div>
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
                  background: previewSide === 'front' ? themeColor : '#27272a',
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
                  background: previewSide === 'back' ? themeColor : '#27272a',
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
                <p>Fill in the form and click "Generate Cards"</p>
              </div>
            )}
          </div>

          {/* Download Actions */}
          {(frontHtml || backHtml) && (
            <>
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
                  Download Front
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
                  Download Back
                </button>
              </div>
            </>
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
