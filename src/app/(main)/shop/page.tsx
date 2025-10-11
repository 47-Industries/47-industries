import Link from 'next/link'

export default function ShopPage() {
  // TODO: Replace with actual products from database
  const products = [
    {
      id: '1',
      name: 'Custom Bracket Set',
      price: 29.99,
      image: '/products/placeholder.jpg',
      category: '3D Printed Parts',
    },
    {
      id: '2',
      name: 'Mounting Plate',
      price: 19.99,
      image: '/products/placeholder.jpg',
      category: '3D Printed Parts',
    },
    {
      id: '3',
      name: 'Cable Management Kit',
      price: 34.99,
      image: '/products/placeholder.jpg',
      category: 'Accessories',
    },
  ]

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Shop</h1>
          <p className="text-xl text-text-secondary max-w-2xl">
            High-quality 3D printed products, ready to ship
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-12">
          <button className="px-6 py-2 bg-text-primary text-background rounded-lg text-sm font-medium">
            All Products
          </button>
          <button className="px-6 py-2 border border-border rounded-lg text-sm hover:bg-surface transition-colors">
            3D Printed Parts
          </button>
          <button className="px-6 py-2 border border-border rounded-lg text-sm hover:bg-surface transition-colors">
            Accessories
          </button>
          <button className="px-6 py-2 border border-border rounded-lg text-sm hover:bg-surface transition-colors">
            Featured
          </button>
        </div>

        {/* Product Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/shop/${product.id}`}
              className="group border border-border rounded-2xl overflow-hidden hover:border-text-primary transition-all"
            >
              <div className="aspect-square bg-surface flex items-center justify-center">
                <div className="text-text-secondary text-sm">Product Image</div>
              </div>
              <div className="p-6">
                <div className="text-xs text-text-secondary mb-2">{product.category}</div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-accent transition-colors">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">${product.price}</span>
                  <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                    View details →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Coming Soon Message */}
        <div className="mt-16 text-center py-12 border-t border-border">
          <h3 className="text-2xl font-bold mb-4">More Products Coming Soon</h3>
          <p className="text-text-secondary mb-8">
            We're constantly adding new products to our catalog. Check back soon!
          </p>
          <Link
            href="/custom-3d-printing"
            className="inline-flex items-center px-8 py-4 bg-text-primary text-background rounded-lg hover:bg-text-secondary transition-all"
          >
            Need something custom?
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: '3D Printed Products - 47 Industries',
  description: 'Browse our catalog of high-quality 3D printed products, ready to ship.',
}
