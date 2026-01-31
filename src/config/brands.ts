// Brand configuration for print-on-demand apparel and business cards
// Used for brand-specific shop pages (/shop/brands/bookfade, /shop/brands/motorev, /shop/brands/47)

import type { BusinessCardData, CardLayout } from '@/lib/business-card-generator'

export interface BrandConfig {
  slug: string
  name: string
  tagline: string
  description: string
  accentColor: string
  projectSlug: string | null
  logo?: string
}

// Business card defaults per brand
export interface BrandCardDefaults {
  company: string
  companyTagline?: string
  themeColor: string
  logoImage?: string
  layout: CardLayout
  website?: string
  qrCode?: {
    enabled: boolean
    url: string
    label: string
  }
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

// Business card defaults per brand
export const BRAND_CARD_DEFAULTS: Record<string, BrandCardDefaults> = {
  FORTY_SEVEN_INDUSTRIES: {
    company: '47 Industries',
    companyTagline: 'Software & 3D Printing',
    themeColor: '#3b82f6',
    logoImage: 'https://47industries.com/logo.png',
    layout: 'standard',
    website: '47industries.com',
  },
  MOTOREV: {
    company: 'MotoRev',
    companyTagline: 'Motorcycle Tracking App',
    themeColor: '#ef4444',
    logoImage: '', // No logo file yet
    layout: 'standard',
    website: 'motorevapp.com',
  },
  BOOKFADE: {
    company: '',
    companyTagline: 'Barber Booking Platform',
    themeColor: '#9a58fd',
    logoImage: '', // No logo file yet
    layout: 'qr-focus',
    qrCode: {
      enabled: true,
      url: '',
      label: 'Scan to Book',
    },
  },
  CUSTOM: {
    company: '',
    companyTagline: '',
    themeColor: '#3b82f6',
    layout: 'standard',
  },
}

// Get brand card defaults by brand key
export function getBrandCardDefaults(brandKey: string): BrandCardDefaults | null {
  return BRAND_CARD_DEFAULTS[brandKey] || null
}
