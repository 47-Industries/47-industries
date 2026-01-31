// Universal Business Card Generator for 47 Industries
// Supports multiple brands, layouts, and customization options

// ============================================
// TYPES & INTERFACES
// ============================================

export type CardLayout = 'standard' | 'qr-focus' | 'minimal' | 'photo-hero'
export type CardBrand = 'FORTY_SEVEN_INDUSTRIES' | 'MOTOREV' | 'BOOKFADE' | 'CUSTOM'
export type SocialType = 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'facebook' | 'youtube' | 'custom'

export interface SocialLink {
  type: SocialType
  handle?: string
  url?: string
}

export interface QRCodeConfig {
  enabled: boolean
  url: string
  label?: string
}

export interface BusinessCardData {
  // Identity
  name: string
  title?: string           // "CEO", "Founder", "Professional Barber"
  company?: string         // "47 Industries", "MotoRev", shop name
  companyTagline?: string  // "Software & 3D Printing", "Motorcycle Tracking App"

  // Contact (all optional)
  email?: string
  phone?: string
  website?: string         // Custom URL for card

  // Social (optional)
  socialLinks?: SocialLink[]

  // Images
  profileImage?: string
  logoImage?: string       // Company/brand logo
  backgroundImage?: string

  // QR Code (optional)
  qrCode?: QRCodeConfig

  // Styling
  themeColor?: string
  layout: CardLayout

  // Brand context (for defaults)
  brand?: CardBrand

  // Legacy fields for backward compatibility with BookFade
  slug?: string            // BookFade booking slug
  tagline?: string         // Kept for compatibility (alias for title)
  shopName?: string        // Alias for company
  address?: string
  city?: string
  state?: string
  heroImage?: string       // Alias for backgroundImage
}

// Legacy interface for backward compatibility
export interface BarberCardData {
  name: string
  slug: string
  tagline?: string
  shopName?: string
  address?: string
  city?: string
  state?: string
  profileImage?: string
  heroImage?: string
  themeColor?: string
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_THEME_COLORS: Record<CardBrand, string> = {
  FORTY_SEVEN_INDUSTRIES: '#3b82f6',
  MOTOREV: '#ef4444',
  BOOKFADE: '#9a58fd',
  CUSTOM: '#3b82f6',
}

const DEFAULT_PROFILE_IMAGE = 'https://files.47industries.com/defaults/avatar.png'

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getThemeColor(data: BusinessCardData): string {
  if (data.themeColor) return data.themeColor
  if (data.brand) return DEFAULT_THEME_COLORS[data.brand]
  return DEFAULT_THEME_COLORS.CUSTOM
}

function getCompanyName(data: BusinessCardData): string {
  return data.company || data.shopName || ''
}

function getBackgroundImage(data: BusinessCardData): string | undefined {
  return data.backgroundImage || data.heroImage
}

function formatAddress(data: BusinessCardData): string {
  let addressLine = ''
  if (data.address) {
    addressLine = data.address
    if (data.city || data.state) {
      addressLine += '<br>'
      if (data.city) addressLine += data.city
      if (data.city && data.state) addressLine += ', '
      if (data.state) addressLine += data.state
    }
  } else if (data.city || data.state) {
    if (data.city) addressLine += data.city
    if (data.city && data.state) addressLine += ', '
    if (data.state) addressLine += data.state
  }
  return addressLine
}

function getQRCodeUrl(url: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&format=png`
}

// Convert legacy BarberCardData to new BusinessCardData
export function convertLegacyData(barberData: BarberCardData): BusinessCardData {
  return {
    name: barberData.name,
    title: barberData.tagline || 'Professional Barber',
    company: barberData.shopName,
    profileImage: barberData.profileImage,
    backgroundImage: barberData.heroImage,
    themeColor: barberData.themeColor,
    layout: 'qr-focus',
    brand: 'BOOKFADE',
    slug: barberData.slug,
    tagline: barberData.tagline,
    shopName: barberData.shopName,
    address: barberData.address,
    city: barberData.city,
    state: barberData.state,
    heroImage: barberData.heroImage,
    qrCode: {
      enabled: true,
      url: `https://bookfade.app/b/${barberData.slug}`,
      label: 'Scan to Book',
    },
  }
}

// ============================================
// BASE HTML STRUCTURE
// ============================================

function getBaseStyles(themeColor: string): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: 3.75in 2.25in;
      margin: 0;
    }

    body {
      font-family: 'Inter', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }

    .card {
      width: 3.75in;
      height: 2.25in;
      padding: 0.125in;
      position: relative;
      overflow: hidden;
    }

    .card-inner {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
    }

    @media print {
      body {
        padding: 0;
        min-height: auto;
      }
      .card {
        box-shadow: none;
      }
    }
  `
}

function wrapInHtmlDocument(title: string, styles: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        ${styles}
    </style>
</head>
<body>
    ${body}
</body>
</html>`
}

// ============================================
// LAYOUT: STANDARD (Classic Business Card)
// ============================================

function generateStandardFront(data: BusinessCardData): string {
  const themeColor = getThemeColor(data)
  const profileImage = data.profileImage || DEFAULT_PROFILE_IMAGE
  const companyName = getCompanyName(data)
  const title = data.title || data.tagline || ''

  const styles = `
    ${getBaseStyles(themeColor)}

    .card {
      background: #000;
    }

    .card-inner {
      background: linear-gradient(135deg, #18181b 0%, #09090b 100%);
      border-radius: 4px;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .top-section {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .profile-photo {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid ${themeColor};
    }

    .info {
      flex: 1;
    }

    .name {
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 2px;
      letter-spacing: -0.3px;
    }

    .title {
      font-size: 11px;
      color: ${themeColor};
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    .bottom-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .contact-item {
      font-size: 10px;
      color: #a1a1aa;
    }

    .company-name {
      font-size: 13px;
      color: #fff;
      font-weight: 500;
    }

    .logo {
      height: 28px;
      object-fit: contain;
      border-radius: 6px;
    }
  `

  const contactItems = []
  if (data.email) contactItems.push(`<span class="contact-item">${data.email}</span>`)
  if (data.phone) contactItems.push(`<span class="contact-item">${data.phone}</span>`)
  if (data.website) contactItems.push(`<span class="contact-item">${data.website}</span>`)

  const body = `
    <div class="card">
      <div class="card-inner">
        <div class="top-section">
          <img src="${profileImage}" alt="${data.name}" class="profile-photo">
          <div class="info">
            <h1 class="name">${data.name}</h1>
            ${title ? `<p class="title">${title}</p>` : ''}
          </div>
        </div>
        <div class="bottom-section">
          <div class="contact-info">
            ${companyName ? `<span class="company-name">${companyName}</span>` : ''}
            ${contactItems.join('\n            ')}
          </div>
          ${data.logoImage ? `<img src="${data.logoImage}" alt="Logo" class="logo">` : ''}
        </div>
      </div>
    </div>
  `

  return wrapInHtmlDocument(`${data.name} - Business Card Front`, styles, body)
}

function generateStandardBack(data: BusinessCardData): string {
  const themeColor = getThemeColor(data)
  const companyName = getCompanyName(data)
  const addressLine = formatAddress(data)

  const styles = `
    ${getBaseStyles(themeColor)}

    .card {
      background: #0a0a0a;
    }

    .card-inner {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 4px;
      padding: 20px 24px;
      display: flex;
      align-items: center;
      justify-content: ${data.qrCode?.enabled ? 'space-between' : 'center'};
      gap: 24px;
    }

    .left-section {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 16px;
      ${!data.qrCode?.enabled ? 'align-items: center; text-align: center;' : ''}
    }

    .brand-block {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .logo-large {
      height: 36px;
      object-fit: contain;
      border-radius: 6px;
    }

    .company-name-large {
      font-size: 18px;
      font-weight: 700;
      color: #fff;
    }

    .tagline {
      font-size: 11px;
      color: #a1a1aa;
      letter-spacing: 0.5px;
    }

    .address-block {
      font-size: 11px;
      color: #71717a;
      line-height: 1.5;
    }

    .website-large {
      font-size: 14px;
      font-weight: 600;
      color: ${themeColor};
    }

    .right-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .qr-code {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      background: #fff;
      padding: 4px;
    }

    .qr-code img {
      width: 100%;
      height: 100%;
      border-radius: 4px;
    }

    .scan-text {
      font-size: 9px;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  `

  const qrSection = data.qrCode?.enabled ? `
    <div class="right-section">
      <div class="qr-code">
        <img src="${getQRCodeUrl(data.qrCode.url)}" alt="QR Code">
      </div>
      <span class="scan-text">${data.qrCode.label || 'Scan to Visit'}</span>
    </div>
  ` : ''

  const taglineText = data.companyTagline || data.tagline || ''

  const body = `
    <div class="card">
      <div class="card-inner">
        <div class="left-section">
          <div class="brand-block">
            ${data.logoImage ? `<img src="${data.logoImage}" alt="Logo" class="logo-large">` : `<span class="company-name-large">${companyName || data.name}</span>`}
            ${taglineText ? `<span class="tagline">${taglineText}</span>` : ''}
          </div>
          ${addressLine ? `<p class="address-block">${addressLine}</p>` : ''}
          ${data.website ? `<span class="website-large">${data.website}</span>` : ''}
        </div>
        ${qrSection}
      </div>
    </div>
  `

  return wrapInHtmlDocument(`${data.name} - Business Card Back`, styles, body)
}

// ============================================
// LAYOUT: QR-FOCUS (BookFade Style)
// ============================================

function generateQrFocusFront(data: BusinessCardData): string {
  const themeColor = getThemeColor(data)
  const profileImage = data.profileImage || DEFAULT_PROFILE_IMAGE
  const companyName = getCompanyName(data)
  const title = data.title || data.tagline || 'Professional Barber'
  const backgroundImage = getBackgroundImage(data)

  const heroSection = backgroundImage
    ? `<img src="${backgroundImage}" alt="" class="hero-bg">`
    : ''

  const styles = `
    ${getBaseStyles(themeColor)}

    .card {
      background: #000;
    }

    .hero-bg {
      position: absolute;
      top: -10%;
      left: -10%;
      width: 120%;
      height: 120%;
      object-fit: cover;
      opacity: 0.45;
    }

    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(145deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 100%);
    }

    .content {
      position: relative;
      z-index: 10;
      padding: 18px 22px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .top-row {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }

    .profile-photo {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      object-fit: cover;
      border: 2.5px solid ${themeColor};
    }

    .info {
      flex: 1;
      padding-top: 4px;
    }

    .name {
      font-size: 22px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 3px;
      letter-spacing: -0.3px;
    }

    .title {
      font-size: 10px;
      color: ${themeColor};
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .bottom-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .shop-name {
      font-size: 12px;
      color: #a1a1aa;
      font-weight: 500;
    }

    .booking-cta {
      display: flex;
      align-items: center;
      gap: 6px;
      background: ${themeColor};
      padding: 6px 12px;
      border-radius: 6px;
    }

    .booking-cta span {
      font-size: 11px;
      color: #fff;
      font-weight: 600;
    }
  `

  const ctaText = data.qrCode?.label?.replace('Scan to ', '') || 'Book Online'

  const body = `
    <div class="card">
      <div class="card-inner">
        ${heroSection}
        <div class="overlay"></div>
        <div class="content">
          <div class="top-row">
            <img src="${profileImage}" alt="${data.name}" class="profile-photo">
            <div class="info">
              <h1 class="name">${data.name}</h1>
              <p class="title">${title}</p>
            </div>
          </div>
          <div class="bottom-row">
            <span class="shop-name">${companyName}</span>
            <div class="booking-cta">
              <span>${ctaText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  return wrapInHtmlDocument(`${data.name} - Business Card Front`, styles, body)
}

function generateQrFocusBack(data: BusinessCardData): string {
  const themeColor = getThemeColor(data)
  const companyName = getCompanyName(data) || data.name
  const addressLine = formatAddress(data)

  // Build display URL (without https://)
  let displayUrl = data.website || ''
  if (data.qrCode?.url) {
    displayUrl = data.qrCode.url.replace(/^https?:\/\//, '')
  } else if (data.slug) {
    displayUrl = `bookfade.app/b/${data.slug}`
  }

  const fullUrl = data.qrCode?.url || (data.slug ? `https://bookfade.app/b/${data.slug}` : data.website || '')

  const styles = `
    ${getBaseStyles(themeColor)}

    .card {
      background: #0a0a0a;
    }

    .card-inner {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 4px;
      padding: 16px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }

    .left-section {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 16px;
    }

    .location-block h3 {
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 4px;
    }

    .location-block p {
      font-size: 11px;
      color: #a1a1aa;
      line-height: 1.5;
    }

    .booking-url {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .booking-url .label {
      font-size: 9px;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 1.2px;
    }

    .booking-url .url {
      font-size: 14px;
      font-weight: 600;
      color: ${themeColor};
    }

    .right-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .qr-code {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      background: #fff;
      padding: 4px;
    }

    .qr-code img {
      width: 100%;
      height: 100%;
      border-radius: 4px;
    }

    .scan-text {
      font-size: 9px;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  `

  const urlLabel = data.qrCode?.label?.replace('Scan to ', '') || 'Book Your Appointment'

  const qrSection = (data.qrCode?.enabled !== false && fullUrl) ? `
    <div class="right-section">
      <div class="qr-code">
        <img src="${getQRCodeUrl(fullUrl)}" alt="Scan to book">
      </div>
      <span class="scan-text">${data.qrCode?.label || 'Scan to Book'}</span>
    </div>
  ` : ''

  // Build contact info
  const contactLines = []
  if (data.email) contactLines.push(data.email)
  if (data.phone) contactLines.push(data.phone)

  const body = `
    <div class="card">
      <div class="card-inner">
        <div class="left-section">
          <div class="location-block">
            <h3>${companyName}</h3>
            ${addressLine ? `<p>${addressLine}</p>` : ''}
            ${contactLines.length > 0 ? `<p style="margin-top: 6px;">${contactLines.join(' | ')}</p>` : ''}
          </div>
          ${displayUrl ? `
          <div class="booking-url">
            <span class="label">${urlLabel}</span>
            <span class="url">${displayUrl}</span>
          </div>
          ` : ''}
        </div>
        ${qrSection}
      </div>
    </div>
  `

  return wrapInHtmlDocument(`${data.name} - Business Card Back`, styles, body)
}

// ============================================
// LAYOUT: MINIMAL (Clean, Text-Focused)
// ============================================

function generateMinimalFront(data: BusinessCardData): string {
  const themeColor = getThemeColor(data)
  const title = data.title || data.tagline || ''
  const profileImage = data.profileImage || DEFAULT_PROFILE_IMAGE

  const styles = `
    ${getBaseStyles(themeColor)}

    .card {
      background: #000;
    }

    .card-inner {
      background: #09090b;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 20px;
    }

    .profile-photo {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid ${themeColor};
      margin-bottom: 12px;
    }

    .name {
      font-size: 22px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 4px;
      letter-spacing: -0.5px;
    }

    .title {
      font-size: 11px;
      color: ${themeColor};
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .divider {
      width: 40px;
      height: 2px;
      background: ${themeColor};
      margin: 12px 0;
    }

    .company {
      font-size: 12px;
      color: #fff;
      font-weight: 500;
    }

    .tagline {
      font-size: 10px;
      color: #71717a;
      margin-top: 4px;
    }
  `

  const companyName = getCompanyName(data)

  const body = `
    <div class="card">
      <div class="card-inner">
        <img src="${profileImage}" alt="${data.name}" class="profile-photo">
        <h1 class="name">${data.name}</h1>
        ${title ? `<p class="title">${title}</p>` : ''}
        ${companyName ? `
        <div class="divider"></div>
        <p class="company">${companyName}</p>
        ${data.companyTagline ? `<p class="tagline">${data.companyTagline}</p>` : ''}
        ` : ''}
      </div>
    </div>
  `

  return wrapInHtmlDocument(`${data.name} - Business Card Front`, styles, body)
}

function generateMinimalBack(data: BusinessCardData): string {
  const themeColor = getThemeColor(data)

  const styles = `
    ${getBaseStyles(themeColor)}

    .card {
      background: #000;
    }

    .card-inner {
      background: #09090b;
      height: 100%;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding: 24px 32px;
    }

    .contact-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .contact-item {
      font-size: 11px;
      color: #a1a1aa;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .contact-item .label {
      font-size: 9px;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 1px;
      width: 50px;
    }

    .contact-item .value {
      color: #fff;
      font-weight: 500;
    }

    .logo-section {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
    }

    .logo {
      height: 32px;
      object-fit: contain;
      border-radius: 6px;
    }

    .qr-small {
      width: 50px;
      height: 50px;
      border-radius: 6px;
      background: #fff;
      padding: 3px;
    }

    .qr-small img {
      width: 100%;
      height: 100%;
      border-radius: 3px;
    }
  `

  const contactItems = []
  if (data.email) contactItems.push({ label: 'Email', value: data.email })
  if (data.phone) contactItems.push({ label: 'Phone', value: data.phone })
  if (data.website) contactItems.push({ label: 'Web', value: data.website })

  const addressLine = formatAddress(data)
  if (addressLine) contactItems.push({ label: 'Loc', value: addressLine.replace('<br>', ', ') })

  const qrSection = data.qrCode?.enabled && data.qrCode.url ? `
    <div class="qr-small">
      <img src="${getQRCodeUrl(data.qrCode.url)}" alt="QR">
    </div>
  ` : ''

  const body = `
    <div class="card">
      <div class="card-inner">
        <div class="contact-section">
          ${contactItems.map(item => `
            <div class="contact-item">
              <span class="label">${item.label}</span>
              <span class="value">${item.value}</span>
            </div>
          `).join('')}
        </div>
        <div class="logo-section">
          ${data.logoImage ? `<img src="${data.logoImage}" alt="Logo" class="logo">` : ''}
          ${qrSection}
        </div>
      </div>
    </div>
  `

  return wrapInHtmlDocument(`${data.name} - Business Card Back`, styles, body)
}

// ============================================
// LAYOUT: PHOTO-HERO (Full Bleed Photo)
// ============================================

function generatePhotoHeroFront(data: BusinessCardData): string {
  const themeColor = getThemeColor(data)
  const backgroundImage = getBackgroundImage(data) || data.profileImage || DEFAULT_PROFILE_IMAGE
  const title = data.title || data.tagline || ''

  const styles = `
    ${getBaseStyles(themeColor)}

    .card {
      background: #000;
    }

    .card-inner {
      position: relative;
    }

    .hero-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%);
    }

    .content {
      position: relative;
      z-index: 10;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 20px 24px;
    }

    .name {
      font-size: 26px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 4px;
      letter-spacing: -0.5px;
      text-shadow: 0 2px 8px rgba(0,0,0,0.5);
    }

    .title {
      font-size: 11px;
      color: ${themeColor};
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
      text-shadow: 0 1px 4px rgba(0,0,0,0.5);
    }

    .company {
      font-size: 12px;
      color: rgba(255,255,255,0.8);
      margin-top: 8px;
      text-shadow: 0 1px 4px rgba(0,0,0,0.5);
    }
  `

  const companyName = getCompanyName(data)

  const body = `
    <div class="card">
      <div class="card-inner">
        <img src="${backgroundImage}" alt="" class="hero-image">
        <div class="overlay"></div>
        <div class="content">
          <h1 class="name">${data.name}</h1>
          ${title ? `<p class="title">${title}</p>` : ''}
          ${companyName ? `<p class="company">${companyName}</p>` : ''}
        </div>
      </div>
    </div>
  `

  return wrapInHtmlDocument(`${data.name} - Business Card Front`, styles, body)
}

function generatePhotoHeroBack(data: BusinessCardData): string {
  const themeColor = getThemeColor(data)
  const companyName = getCompanyName(data)

  const styles = `
    ${getBaseStyles(themeColor)}

    .card {
      background: #000;
    }

    .card-inner {
      background: linear-gradient(135deg, #18181b 0%, #09090b 100%);
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 24px;
    }

    .info-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex: 1;
    }

    .brand-block {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo {
      height: 32px;
      object-fit: contain;
      border-radius: 6px;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .company-name {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
    }

    .company-tagline {
      font-size: 10px;
      color: #71717a;
      margin-top: 2px;
    }

    .contact-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .contact-item {
      font-size: 11px;
      color: #a1a1aa;
    }

    .website {
      font-size: 13px;
      font-weight: 600;
      color: ${themeColor};
    }

    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .qr-code {
      width: 72px;
      height: 72px;
      border-radius: 8px;
      background: #fff;
      padding: 4px;
    }

    .qr-code img {
      width: 100%;
      height: 100%;
      border-radius: 4px;
    }

    .scan-text {
      font-size: 8px;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  `

  const contactItems = []
  if (data.email) contactItems.push(data.email)
  if (data.phone) contactItems.push(data.phone)
  const addressLine = formatAddress(data)
  if (addressLine) contactItems.push(addressLine.replace('<br>', ', '))

  const qrSection = data.qrCode?.enabled && data.qrCode.url ? `
    <div class="qr-section">
      <div class="qr-code">
        <img src="${getQRCodeUrl(data.qrCode.url)}" alt="QR">
      </div>
      <span class="scan-text">${data.qrCode.label || 'Scan to Visit'}</span>
    </div>
  ` : ''

  const body = `
    <div class="card">
      <div class="card-inner">
        <div class="info-section">
          <div class="brand-block">
            ${data.logoImage ? `<img src="${data.logoImage}" alt="Logo" class="logo">` : ''}
            <div class="brand-text">
              <span class="company-name">${companyName || data.name}</span>
              ${data.companyTagline ? `<span class="company-tagline">${data.companyTagline}</span>` : ''}
            </div>
          </div>
          <div class="contact-list">
            ${contactItems.map(item => `<span class="contact-item">${item}</span>`).join('\n            ')}
          </div>
          ${data.website ? `<span class="website">${data.website}</span>` : ''}
        </div>
        ${qrSection}
      </div>
    </div>
  `

  return wrapInHtmlDocument(`${data.name} - Business Card Back`, styles, body)
}

// ============================================
// MAIN GENERATOR FUNCTIONS
// ============================================

export function generateCardHTML(data: BusinessCardData, side: 'front' | 'back'): string {
  const layout = data.layout || 'standard'

  if (side === 'front') {
    switch (layout) {
      case 'qr-focus':
        return generateQrFocusFront(data)
      case 'minimal':
        return generateMinimalFront(data)
      case 'photo-hero':
        return generatePhotoHeroFront(data)
      case 'standard':
      default:
        return generateStandardFront(data)
    }
  } else {
    switch (layout) {
      case 'qr-focus':
        return generateQrFocusBack(data)
      case 'minimal':
        return generateMinimalBack(data)
      case 'photo-hero':
        return generatePhotoHeroBack(data)
      case 'standard':
      default:
        return generateStandardBack(data)
    }
  }
}

export function generateBusinessCard(data: BusinessCardData): { front: string; back: string; layout: CardLayout } {
  return {
    front: generateCardHTML(data, 'front'),
    back: generateCardHTML(data, 'back'),
    layout: data.layout || 'standard',
  }
}

// ============================================
// LEGACY COMPATIBILITY FUNCTIONS
// ============================================

/**
 * Generate the front of a business card as HTML (legacy BookFade format)
 */
export function generateCardFrontHTML(data: BarberCardData): string {
  const convertedData = convertLegacyData(data)
  return generateCardHTML(convertedData, 'front')
}

/**
 * Generate the back of a business card as HTML (legacy BookFade format)
 */
export function generateCardBackHTML(data: BarberCardData): string {
  const convertedData = convertLegacyData(data)
  return generateCardHTML(convertedData, 'back')
}

/**
 * Extract card data from a BookFade order's customization data
 */
export function extractCardDataFromOrder(orderData: {
  customization?: Record<string, unknown>
  sourceData?: { customization?: Record<string, unknown> }
}): BarberCardData | null {
  const customization = orderData.customization || orderData.sourceData?.customization
  if (!customization) return null

  return {
    name: (customization.name as string) || (customization.barberName as string) || 'Barber',
    slug: (customization.slug as string) || (customization.barberSlug as string) || '',
    tagline: customization.tagline as string | undefined,
    shopName: (customization.businessName as string) || (customization.shopName as string),
    address: customization.address as string | undefined,
    city: customization.city as string | undefined,
    state: customization.state as string | undefined,
    profileImage: customization.profileImage as string | undefined,
    heroImage: customization.heroImage as string | undefined,
    themeColor: customization.themeColor as string | undefined,
  }
}

// ============================================
// LAYOUT INFO (for UI)
// ============================================

export interface LayoutInfo {
  id: CardLayout
  name: string
  description: string
  hasQrCodeByDefault: boolean
}

export const CARD_LAYOUTS: LayoutInfo[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Classic business card with photo, name, title, and contact info',
    hasQrCodeByDefault: false,
  },
  {
    id: 'qr-focus',
    name: 'QR Focus',
    description: 'Prominent QR code for booking/website with hero background',
    hasQrCodeByDefault: true,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, text-focused design with centered name and title',
    hasQrCodeByDefault: false,
  },
  {
    id: 'photo-hero',
    name: 'Photo Hero',
    description: 'Full-bleed background photo with name overlay',
    hasQrCodeByDefault: false,
  },
]
