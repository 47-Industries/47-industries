'use client'

import Link from 'next/link'
import Image from 'next/image'
import { BrandConfig } from '@/config/brands'

interface BrandHeroProps {
  brand: BrandConfig
  productCount: number
}

export default function BrandHero({ brand, productCount }: BrandHeroProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl mb-12"
      style={{
        background: `linear-gradient(135deg, ${brand.accentColor}15 0%, ${brand.accentColor}05 50%, transparent 100%)`,
      }}
    >
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(${brand.accentColor} 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative px-8 py-12 md:px-12 md:py-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left: Brand Info */}
          <div className="max-w-xl">
            {/* Brand Logo */}
            {brand.logo && (
              <div className="mb-4 h-12 w-auto">
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  width={120}
                  height={48}
                  className="h-12 w-auto object-contain"
                />
              </div>
            )}

            {/* Brand Name (fallback if no logo) */}
            {!brand.logo && (
              <h1
                className="text-4xl md:text-5xl font-bold mb-2"
                style={{ color: brand.accentColor }}
              >
                {brand.name}
              </h1>
            )}

            {/* Tagline */}
            <p className="text-xl md:text-2xl font-medium text-text-primary mb-4">
              {brand.tagline}
            </p>

            {/* Description */}
            <p className="text-text-secondary mb-6">
              {brand.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-6">
              <div>
                <span
                  className="text-2xl font-bold"
                  style={{ color: brand.accentColor }}
                >
                  {productCount}
                </span>
                <span className="text-text-secondary ml-2">
                  {productCount === 1 ? 'Product' : 'Products'}
                </span>
              </div>

              {brand.projectSlug && (
                <Link
                  href={`/projects/${brand.projectSlug}`}
                  className="inline-flex items-center text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Learn more about {brand.name}
                </Link>
              )}
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex flex-col gap-3">
            {brand.projectSlug && (
              <Link
                href={`/projects/${brand.projectSlug}`}
                className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-lg text-sm font-medium hover:bg-surface transition-colors"
              >
                View Project
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Accent Border */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{ backgroundColor: brand.accentColor }}
      />
    </div>
  )
}
