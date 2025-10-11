export default function AdminDashboard() {
  // TODO: Fetch real data from database
  const stats = {
    totalOrders: 0,
    totalRevenue: 0,
    customRequests: 0,
    serviceInquiries: 0,
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-text-secondary">Welcome to 47 Industries Admin</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="border border-border rounded-2xl p-6">
          <div className="text-sm text-text-secondary mb-2">Total Orders</div>
          <div className="text-4xl font-bold">{stats.totalOrders}</div>
        </div>
        <div className="border border-border rounded-2xl p-6">
          <div className="text-sm text-text-secondary mb-2">Revenue</div>
          <div className="text-4xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
        </div>
        <div className="border border-border rounded-2xl p-6">
          <div className="text-sm text-text-secondary mb-2">3D Print Requests</div>
          <div className="text-4xl font-bold">{stats.customRequests}</div>
        </div>
        <div className="border border-border rounded-2xl p-6">
          <div className="text-sm text-text-secondary mb-2">Service Inquiries</div>
          <div className="text-4xl font-bold">{stats.serviceInquiries}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <a
            href="/admin/products/new"
            className="border border-border rounded-xl p-6 hover:border-accent transition-colors"
          >
            <div className="text-2xl mb-2">➕</div>
            <h3 className="font-semibold mb-1">Add Product</h3>
            <p className="text-sm text-text-secondary">Create a new product listing</p>
          </a>
          <a
            href="/admin/orders"
            className="border border-border rounded-xl p-6 hover:border-accent transition-colors"
          >
            <div className="text-2xl mb-2">📦</div>
            <h3 className="font-semibold mb-1">View Orders</h3>
            <p className="text-sm text-text-secondary">Manage customer orders</p>
          </a>
          <a
            href="/admin/custom-requests"
            className="border border-border rounded-xl p-6 hover:border-accent transition-colors"
          >
            <div className="text-2xl mb-2">🖨️</div>
            <h3 className="font-semibold mb-1">3D Print Requests</h3>
            <p className="text-sm text-text-secondary">Review custom print quotes</p>
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        <div className="border border-border rounded-2xl p-6">
          <div className="text-center py-12 text-text-secondary">
            No recent activity
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Admin Dashboard - 47 Industries',
  description: 'Admin control panel for 47 Industries',
}
