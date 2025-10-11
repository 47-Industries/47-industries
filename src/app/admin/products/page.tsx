import Link from 'next/link'

export default function AdminProductsPage() {
  const products = []

  return (
    <div>
      <div className="admin-section-header">
        <div>
          <h1 className="admin-page-title">Products</h1>
          <p className="admin-page-subtitle">Manage your product catalog</p>
        </div>
        <Link href="/admin/products/new" className="admin-btn admin-btn-primary">
          Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="admin-card admin-card-empty">
          <div className="admin-card-icon">📦</div>
          <h3 className="admin-card-title">No products yet</h3>
          <p className="admin-card-description">
            Start by adding your first product to the catalog
          </p>
          <Link href="/admin/products/new" className="admin-btn admin-btn-primary">
            Add Your First Product
          </Link>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Products will be mapped here */}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export const metadata = {
  title: 'Products - Admin - 47 Industries',
}
