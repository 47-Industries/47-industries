// Brand configuration for print-on-demand apparel
// Used for brand-specific shop pages (/shop/bookfade, /shop/motorev, /shop/47)

export interface BrandConfig {
  slug: string
  name: string
  tagline: string
  description: string
  accentColor: string
  projectSlug: string | null
  logo?: string
}

export const BRANDS: Record<string, BrandConfig> = {
  BOOKFADE: {
    slug: 'bookfade',
    name: 'BookFade',
    tagline: 'Professional barber apparel',
    description: 'Premium apparel designed for barbers and grooming professionals. Wear your brand with pride.',
    accentColor: '#f59e0b',
    projectSlug: 'bookfade',
    logo: '/images/brands/bookfade-logo.png',
  },
  MOTOREV: {
    slug: 'motorev',
    name: 'MotoRev',
    tagline: 'Ride in style',
    description: 'Apparel for motorcycle enthusiasts. Show your passion for the ride.',
    accentColor: '#ef4444',
    projectSlug: 'motorev',
    logo: '/images/brands/motorev-logo.png',
  },
  FORTY_SEVEN_INDUSTRIES: {
    slug: '47',
    name: '47 Industries',
    tagline: 'Build different',
    description: 'Official 47 Industries merchandise. For builders and creators.',
    accentColor: '#3b82f6',
    projectSlug: null,
    logo: '/images/brands/47-logo.png',
  },
}

// Map slug to brand key
export const BRAND_SLUG_MAP: Record<string, string> = {
  'bookfade': 'BOOKFADE',
  'motorev': 'MOTOREV',
  '47': 'FORTY_SEVEN_INDUSTRIES',
}

// Get brand config by slug
export function getBrandBySlug(slug: string): BrandConfig | null {
  const brandKey = BRAND_SLUG_MAP[slug.toLowerCase()]
  return brandKey ? BRANDS[brandKey] : null
}

// Get all brand slugs for static generation
export function getAllBrandSlugs(): string[] {
  return Object.values(BRANDS).map(brand => brand.slug)
}

// Validate if a slug is a valid brand
export function isValidBrandSlug(slug: string): boolean {
  return slug.toLowerCase() in BRAND_SLUG_MAP
}
