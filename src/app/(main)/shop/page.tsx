import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { isFeatureEnabled } from '@/lib/features'
import ShopClient from './ShopClient'
import ApparelFilters from './ApparelFilters'

interface SearchParams {
  category?: string
  search?: string
  page?: string
  type?: 'physical' | 'digital' | 'apparel'
  brand?: string    // For apparel: brand slug
  gender?: string   // For apparel: UNISEX, MENS, WOMENS
}

const PRODUCTS_PER_PAGE = 20

async function getProducts(searchParams: SearchParams, brandKeyFromSlug?: string | null) {
  const page = parseInt(searchParams.page || '1')
  const limit = PRODUCTS_PER_PAGE
  const skip = (page - 1) * limit

  const where: any = {
    active: true,
  }

  // Filter by type
  if (searchParams.type === 'digital') {
    where.productType = 'DIGITAL'
  } else if (searchParams.type === 'apparel') {
    where.productType = 'PHYSICAL'
    where.fulfillmentType = 'PRINTFUL'

    // Apparel-specific filters
    if (brandKeyFromSlug) {
      where.brand = brandKeyFromSlug
    }
    if (searchParams.gender && searchParams.gender !== 'all') {
      where.gender = searchParams.gender.toUpperCase()
    }
  } else {
    // Default: physical products (excluding Printful/apparel)
    where.productType = 'PHYSICAL'
    where.NOT = { fulfillmentType: 'PRINTFUL' }
  }

  if (searchParams.category) {
    where.category = { slug: searchParams.category }
  }

  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search } },
      { description: { contains: searchParams.search } },
    ]
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            productType: true,
          },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

async function getCategories(productType: 'PHYSICAL' | 'DIGITAL', excludeApparel: boolean = false) {
  // For Physical Products tab, we need to exclude categories that only have apparel (Printful) products
  const categories = await prisma.category.findMany({
    where: {
      active: true,
      productType,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      productType: true,
      _count: {
        select: {
          // Count only non-Printful products for Physical tab
          products: {
            where: excludeApparel
              ? { active: true, NOT: { fulfillmentType: 'PRINTFUL' } }
              : { active: true }
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Filter out categories with 0 products
  return categories.filter(cat => cat._count.products > 0)
}

async function getProductCounts() {
  const [physical, digital, apparel] = await Promise.all([
    prisma.product.count({
      where: {
        active: true,
        productType: 'PHYSICAL',
        NOT: { fulfillmentType: 'PRINTFUL' }
      }
    }),
    prisma.product.count({ where: { active: true, productType: 'DIGITAL' } }),
    prisma.product.count({ where: { active: true, productType: 'PHYSICAL', fulfillmentType: 'PRINTFUL' } }),
  ])
  return { physical, digital, apparel }
}

// Brand mappings for display
const BRAND_INFO: Record<string, { name: string; slug: string }> = {
  'FORTY_SEVEN_INDUSTRIES': { name: '47 Industries', slug: '47-industries' },
  'BOOKFADE': { name: 'BookFade', slug: 'bookfade' },
  'MOTOREV': { name: 'MotoRev', slug: 'motorev' },
}

// Get brands for apparel filtering
async function getBrands() {
  // Get product counts for each brand from actual product data
  const brandCounts = await prisma.product.groupBy({
    by: ['brand'],
    where: {
      active: true,
      productType: 'PHYSICAL',
      fulfillmentType: 'PRINTFUL',
      brand: { not: null },
    },
    _count: true,
  })

  // Convert to brand objects with counts
  const brands = brandCounts
    .filter(item => item.brand && BRAND_INFO[item.brand])
    .map(item => ({
      id: item.brand!,
      key: item.brand!,
      name: BRAND_INFO[item.brand!].name,
      slug: BRAND_INFO[item.brand!].slug,
      productCount: item._count,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return brands
}

// Get apparel categories with counts
async function getApparelCategories(brandKey?: string | null) {
  const where: any = {
    active: true,
    productType: 'PHYSICAL',
    fulfillmentType: 'PRINTFUL',
  }
  if (brandKey) {
    where.brand = brandKey
  }

  // Get categories that have apparel products
  const categories = await prisma.category.findMany({
    where: {
      active: true,
      productType: 'PHYSICAL',
      products: {
        some: where,
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: {
          products: { where },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return categories
}

// Get gender counts for apparel
async function getGenderCounts(brandKey?: string | null, categorySlug?: string | null) {
  const where: any = {
    active: true,
    productType: 'PHYSICAL',
    fulfillmentType: 'PRINTFUL',
  }
  if (brandKey) {
    where.brand = brandKey
  }
  if (categorySlug) {
    where.category = { slug: categorySlug }
  }

  const genderCounts = await prisma.product.groupBy({
    by: ['gender'],
    where,
    _count: true,
  })

  return {
    UNISEX: genderCounts.find(g => g.gender === 'UNISEX')?._count || 0,
    MENS: genderCounts.find(g => g.gender === 'MENS')?._count || 0,
    WOMENS: genderCounts.find(g => g.gender === 'WOMENS')?._count || 0,
    all: genderCounts.reduce((sum, g) => sum + g._count, 0),
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  // Check if shop is enabled
  const shopEnabled = await isFeatureEnabled('shopEnabled')
  if (!shopEnabled) {
    notFound()
  }

  const params = await searchParams
  const currentType = params.type || 'physical'
  const isDigital = currentType === 'digital'
  const isApparel = currentType === 'apparel'
  const productType = isDigital ? 'DIGITAL' : 'PHYSICAL'

  // Get brands for apparel filtering
  const brands = isApparel ? await getBrands() : []

  // Find brand key from slug for filtering
  const activeBrand = params.brand
    ? brands.find(b => b.slug === params.brand)
    : null
  const brandKeyFromSlug = activeBrand?.key || null
  const activeCategory = params.category || null

  // For Physical Products tab, exclude apparel-only categories
  const excludeApparelFromCategories = !isDigital && !isApparel

  const [{ products, pagination }, categories, counts, genderCounts, apparelCategories] = await Promise.all([
    getProducts(params, brandKeyFromSlug),
    getCategories(productType, excludeApparelFromCategories),
    getProductCounts(),
    isApparel ? getGenderCounts(brandKeyFromSlug, activeCategory) : Promise.resolve({ UNISEX: 0, MENS: 0, WOMENS: 0, all: 0 }),
    isApparel ? getApparelCategories(brandKeyFromSlug) : Promise.resolve([]),
  ])

  const activeGender = params.gender || 'all'

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Shop</h1>
          <p className="text-xl text-text-secondary max-w-2xl">
            {isDigital
              ? 'Digital files ready for instant download'
              : isApparel
              ? 'Premium branded apparel, printed and shipped on demand'
              : 'High-quality 3D printed products, ready to ship'
            }
          </p>
        </div>

        {/* Product Type Toggle */}
        <div className="mb-8">
          <div className="inline-flex rounded-xl bg-surface border border-border p-1 flex-wrap">
            <Link
              href="/shop?type=physical"
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                currentType === 'physical'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Physical Products
                <span className={`px-2 py-0.5 rounded-full text-xs ${currentType === 'physical' ? 'bg-white/20' : 'bg-border'}`}>
                  {counts.physical}
                </span>
              </span>
            </Link>
            <Link
              href="/shop?type=apparel"
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                isApparel
                  ? 'bg-amber-500 text-white shadow-lg'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Apparel
                <span className={`px-2 py-0.5 rounded-full text-xs ${isApparel ? 'bg-white/20' : 'bg-border'}`}>
                  {counts.apparel}
                </span>
              </span>
            </Link>
            <Link
              href="/shop?type=digital"
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                isDigital
                  ? 'bg-violet-500 text-white shadow-lg'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Digital Downloads
                <span className={`px-2 py-0.5 rounded-full text-xs ${isDigital ? 'bg-white/20' : 'bg-border'}`}>
                  {counts.digital}
                </span>
              </span>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <form className="mb-8">
          <input type="hidden" name="type" value={currentType} />
          <div className="relative max-w-md">
            <input
              type="text"
              name="search"
              defaultValue={params.search || ''}
              placeholder={`Search ${isDigital ? 'digital' : isApparel ? 'apparel' : 'physical'} products...`}
              className="w-full px-4 py-3 pl-12 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </form>

        {/* Apparel Filters */}
        {isApparel && (
          <ApparelFilters
            activeCategory={activeCategory}
            activeGender={activeGender}
            activeBrand={activeBrand}
            apparelCategories={apparelCategories}
            genderCounts={genderCounts}
            totalCount={counts.apparel}
            brands={brands}
          />
        )}

        {/* Category Filters - For Physical and Digital only */}
        {!isApparel && categories.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-12">
            <Link
              href={`/shop?type=${currentType}`}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                !activeCategory
                  ? isDigital
                    ? 'bg-violet-500 text-white'
                    : 'bg-emerald-500 text-white'
                  : 'border border-border hover:bg-surface'
              }`}
            >
              All {isDigital ? 'Digital' : 'Physical'}
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop?type=${currentType}&category=${category.slug}`}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === category.slug
                    ? isDigital
                      ? 'bg-violet-500 text-white'
                      : 'bg-emerald-500 text-white'
                    : 'border border-border hover:bg-surface'
                }`}
              >
                {category.name} ({category._count.products})
              </Link>
            ))}
          </div>
        )}

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 text-zinc-500">
              {isDigital ? (
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              ) : isApparel ? (
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              ) : (
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              )}
            </div>
            <h3 className="text-2xl font-bold mb-2">No {isDigital ? 'digital' : isApparel ? 'apparel' : 'physical'} products found</h3>
            <p className="text-text-secondary mb-8">
              {params.search
                ? `No products match "${params.search}"`
                : activeCategory
                ? 'No products in this category yet'
                : `Check back soon for new ${isDigital ? 'digital downloads' : isApparel ? 'apparel' : 'products'}!`}
            </p>
            {(params.search || activeCategory) && (
              <Link
                href={`/shop?type=${currentType}`}
                className={`inline-flex items-center px-6 py-3 text-white rounded-lg transition-colors ${
                  isDigital ? 'bg-violet-500 hover:bg-violet-600' : isApparel ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
              >
                View all {isDigital ? 'digital' : isApparel ? 'apparel' : 'physical'} products
              </Link>
            )}
          </div>
        ) : (
          <ShopClient
            initialProducts={products.map(p => ({
              ...p,
              price: Number(p.price),
              comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
              images: p.images as string[],
              category: p.category,
            }))}
            pagination={pagination}
            isDigital={isDigital}
            isApparel={isApparel}
            activeCategory={activeCategory}
            searchQuery={params.search || null}
          />
        )}

        {/* CTA Section */}
        <div className="mt-16 text-center py-12 border-t border-border">
          {isDigital ? (
            <>
              <h3 className="text-2xl font-bold mb-4">Looking for Physical Products?</h3>
              <p className="text-text-secondary mb-8">
                Check out our 3D printed products ready to ship
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/shop?type=physical"
                  className="inline-flex items-center px-8 py-4 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all"
                >
                  Browse Physical Products
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                {counts.apparel > 0 && (
                  <Link
                    href="/shop?type=apparel"
                    className="inline-flex items-center px-8 py-4 border border-amber-500 text-amber-400 rounded-lg hover:bg-amber-500/10 transition-all"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Browse Apparel
                  </Link>
                )}
              </div>
            </>
          ) : isApparel ? (
            <>
              <h3 className="text-2xl font-bold mb-4">Explore More Products</h3>
              <p className="text-text-secondary mb-8">
                Check out our 3D printed products and digital downloads
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/shop?type=physical"
                  className="inline-flex items-center px-8 py-4 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all"
                >
                  Browse Physical Products
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                {counts.digital > 0 && (
                  <Link
                    href="/shop?type=digital"
                    className="inline-flex items-center px-8 py-4 border border-violet-500 text-violet-400 rounded-lg hover:bg-violet-500/10 transition-all"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Browse Digital Downloads
                  </Link>
                )}
              </div>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-bold mb-4">Need Something Custom?</h3>
              <p className="text-text-secondary mb-8">
                We offer custom 3D printing services for unique projects
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/custom-3d-printing"
                  className="inline-flex items-center px-8 py-4 bg-text-primary text-background rounded-lg hover:bg-text-secondary transition-all"
                >
                  Request a custom quote
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                {counts.apparel > 0 && (
                  <Link
                    href="/shop?type=apparel"
                    className="inline-flex items-center px-8 py-4 border border-amber-500 text-amber-400 rounded-lg hover:bg-amber-500/10 transition-all"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Browse Apparel
                  </Link>
                )}
                {counts.digital > 0 && (
                  <Link
                    href="/shop?type=digital"
                    className="inline-flex items-center px-8 py-4 border border-violet-500 text-violet-400 rounded-lg hover:bg-violet-500/10 transition-all"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Browse Digital Downloads
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Force dynamic rendering to ensure filters work correctly
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Shop - 47 Industries',
  description: 'Browse our catalog of 3D printed products and digital downloads.',
}
