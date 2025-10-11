export default function AdminDashboard() {
  const stats = [
    { label: 'Total Orders', value: '0', icon: '🛒', colorClass: '' },
    { label: 'Revenue', value: '$0', icon: '💰', colorClass: 'green' },
    { label: '3D Print Requests', value: '0', icon: '🖨️', colorClass: 'purple' },
    { label: 'Service Inquiries', value: '0', icon: '💬', colorClass: 'orange' },
  ]

  const quickActions = [
    { title: 'Add Product', description: 'Create a new product listing', icon: '➕', href: '/admin/products' },
    { title: 'View Orders', description: 'Manage customer orders', icon: '📋', href: '/admin/orders' },
    { title: '3D Print Requests', description: 'Review custom print quotes', icon: '🖨️', href: '/admin/custom-requests' },
    { title: 'Settings', description: 'Configure your site', icon: '⚙️', href: '/admin/settings' },
  ]

  return (
    <div>
      {/* Welcome Section */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-subtitle">Welcome to 47 Industries Admin</p>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="admin-stat-card">
            <div className="admin-stat-header">
              <div>
                <p className="admin-stat-label">{stat.label}</p>
                <p className="admin-stat-value">{stat.value}</p>
              </div>
              <div className="admin-stat-icon">{stat.icon}</div>
            </div>
            <div className={`admin-stat-bar ${stat.colorClass}`} />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="admin-section">
        <h2 className="admin-section-title">Quick Actions</h2>
        <div className="admin-actions-grid">
          {quickActions.map((action) => (
            <a
              key={action.title}
              href={action.href}
              className="admin-action-card"
            >
              <div className="admin-action-icon">{action.icon}</div>
              <div>
                <h3 className="admin-action-title">{action.title}</h3>
                <p className="admin-action-description">{action.description}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="admin-section">
        <h2 className="admin-section-title">Recent Activity</h2>
        <div className="admin-card admin-card-empty">
          <div className="admin-card-icon">📊</div>
          <h3 className="admin-card-title">No recent activity</h3>
          <p className="admin-card-description">
            Your recent orders, requests, and updates will appear here
          </p>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Dashboard - Admin - 47 Industries',
}
