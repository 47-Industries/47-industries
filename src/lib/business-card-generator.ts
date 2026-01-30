// Business Card Generator for BookFade Partners
// Generates print-ready business cards from barber profile data

export interface BarberCardData {
  // Required
  name: string
  slug: string

  // Optional - will use defaults if not provided
  tagline?: string
  shopName?: string
  address?: string
  city?: string
  state?: string

  // Images
  profileImage?: string
  heroImage?: string

  // Customization
  themeColor?: string // Hex color, defaults to #9a58fd (purple)
}

const DEFAULT_THEME_COLOR = '#9a58fd'
const DEFAULT_PROFILE_IMAGE = 'https://files.bookfade.app/defaults/avatar.png'

/**
 * Generate the front of a business card as HTML
 */
export function generateCardFrontHTML(data: BarberCardData): string {
  const themeColor = data.themeColor || DEFAULT_THEME_COLOR
  const profileImage = data.profileImage || DEFAULT_PROFILE_IMAGE
  const tagline = data.tagline || 'Professional Barber'
  const shopName = data.shopName || ''

  // Use hero image if available, otherwise use a gradient
  const heroSection = data.heroImage
    ? `<img src="${data.heroImage}" alt="" class="hero-bg">`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${data.name} - Business Card Front</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
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
            background: #000;
            position: relative;
            overflow: hidden;
        }

        .card-inner {
            width: 100%;
            height: 100%;
            position: relative;
            overflow: hidden;
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

        .tagline {
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

        @media print {
            body {
                padding: 0;
                min-height: auto;
            }
            .card {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="card-inner">
            ${heroSection}
            <div class="overlay"></div>
            <div class="content">
                <div class="top-row">
                    <img src="${profileImage}" alt="${data.name}" class="profile-photo">
                    <div class="info">
                        <h1 class="name">${data.name}</h1>
                        <p class="tagline">${tagline}</p>
                    </div>
                </div>
                <div class="bottom-row">
                    <span class="shop-name">${shopName}</span>
                    <div class="booking-cta">
                        <span>Book Online</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`
}

/**
 * Generate the back of a business card as HTML
 */
export function generateCardBackHTML(data: BarberCardData): string {
  const themeColor = data.themeColor || DEFAULT_THEME_COLOR
  const shopName = data.shopName || data.name
  const bookingUrl = `bookfade.app/b/${data.slug}`
  const fullUrl = `https://bookfade.app/b/${data.slug}`

  // Build address line
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

  // QR code URL (using free QR code API)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fullUrl)}&format=png`

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${data.name} - Business Card Back</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
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
            background: #0a0a0a;
            position: relative;
            overflow: hidden;
        }

        .card-inner {
            width: 100%;
            height: 100%;
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

        @media print {
            body {
                padding: 0;
                min-height: auto;
            }
            .card {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="card-inner">
            <div class="left-section">
                <div class="location-block">
                    <h3>${shopName}</h3>
                    ${addressLine ? `<p>${addressLine}</p>` : ''}
                </div>
                <div class="booking-url">
                    <span class="label">Book Your Appointment</span>
                    <span class="url">${bookingUrl}</span>
                </div>
            </div>
            <div class="right-section">
                <div class="qr-code">
                    <img src="${qrCodeUrl}" alt="Scan to book">
                </div>
                <span class="scan-text">Scan to Book</span>
            </div>
        </div>
    </div>
</body>
</html>`
}

/**
 * Generate both front and back HTML for a business card
 */
export function generateBusinessCard(data: BarberCardData): { front: string; back: string } {
  return {
    front: generateCardFrontHTML(data),
    back: generateCardBackHTML(data),
  }
}

/**
 * Extract card data from a BookFade order's customization data
 */
export function extractCardDataFromOrder(orderData: {
  customization?: any
  sourceData?: any
}): BarberCardData | null {
  const customization = orderData.customization || orderData.sourceData?.customization
  if (!customization) return null

  return {
    name: customization.name || customization.barberName || 'Barber',
    slug: customization.slug || customization.barberSlug || '',
    tagline: customization.tagline,
    shopName: customization.businessName || customization.shopName,
    address: customization.address,
    city: customization.city,
    state: customization.state,
    profileImage: customization.profileImage,
    heroImage: customization.heroImage,
    themeColor: customization.themeColor,
  }
}
