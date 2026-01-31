'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ApparelFiltersProps {
  activeCategory: string | null
  activeGender: string
  activeBrand: { slug: string } | null
  apparelCategories: Array<{ id: string; name: string; slug: string; _count: { products: number } }>
  genderCounts: { all: number; UNISEX: number; MENS: number; WOMENS: number }
  totalCount: number
}

export default function ApparelFilters({
  activeCategory,
  activeGender,
  activeBrand,
  apparelCategories,
  genderCounts,
  totalCount,
}: ApparelFiltersProps) {
  const router = useRouter()

  const buildUrl = (params: { category?: string | null; gender?: string | null }) => {
    const url = new URL('/shop', window.location.origin)
    url.searchParams.set('type', 'apparel')

    if (activeBrand) {
      url.searchParams.set('brand', activeBrand.slug)
    }

    const category = params.category !== undefined ? params.category : activeCategory
    const gender = params.gender !== undefined ? params.gender : activeGender

    if (category) {
      url.searchParams.set('category', category)
    }
    if (gender && gender !== 'all') {
      url.searchParams.set('gender', gender)
    }

    return url.pathname + url.search
  }

  return (
    <div className="mb-8">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-surface border border-border rounded-xl">
        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-secondary whitespace-nowrap">Category:</label>
          <select
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 min-w-[160px]"
            value={activeCategory || ''}
            onChange={(e) => {
              router.push(buildUrl({ category: e.target.value || null }))
            }}
          >
            <option value="">All Categories ({totalCount})</option>
            {apparelCategories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name} ({cat._count.products})
              </option>
            ))}
          </select>
        </div>

        {/* Gender Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-secondary whitespace-nowrap">Gender:</label>
          <select
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 min-w-[120px]"
            value={activeGender}
            onChange={(e) => {
              router.push(buildUrl({ gender: e.target.value }))
            }}
          >
            <option value="all">All ({genderCounts.all})</option>
            <option value="unisex">Unisex ({genderCounts.UNISEX})</option>
            <option value="mens">Men&apos;s ({genderCounts.MENS})</option>
            <option value="womens">Women&apos;s ({genderCounts.WOMENS})</option>
          </select>
        </div>

        {/* Clear Filters */}
        {(activeCategory || activeGender !== 'all' || activeBrand) && (
          <Link
            href="/shop?type=apparel"
            className="ml-auto text-sm text-amber-500 hover:text-amber-400 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear filters
          </Link>
        )}
      </div>

      {/* Active Filters Display */}
      {(activeCategory || activeGender !== 'all') && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-sm text-text-secondary">Showing:</span>
          {activeCategory && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm">
              {apparelCategories.find(c => c.slug === activeCategory)?.name || activeCategory}
              <Link
                href={buildUrl({ category: null })}
                className="hover:text-white"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Link>
            </span>
          )}
          {activeGender !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm">
              {activeGender === 'mens' ? "Men's" : activeGender === 'womens' ? "Women's" : 'Unisex'}
              <Link
                href={buildUrl({ gender: 'all' })}
                className="hover:text-white"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Link>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
