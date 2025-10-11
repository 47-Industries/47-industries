export default function AdminDashboard() {
  const stats = [
    { label: 'Total Orders', value: '0', icon: '🛒', color: 'blue' },
    { label: 'Revenue', value: '$0', icon: '💰', color: 'green' },
    { label: '3D Print Requests', value: '0', icon: '🖨️', color: 'purple' },
    { label: 'Service Inquiries', value: '0', icon: '💬', color: 'orange' },
  ]

  const quickActions = [
    { title: 'Add Product', description: 'Create a new product listing', icon: '➕', href: '/admin/products' },
    { title: 'View Orders', description: 'Manage customer orders', icon: '📋', href: '/admin/orders' },
    { title: '3D Print Requests', description: 'Review custom print quotes', icon: '🖨️', href: '/admin/custom-requests' },
    { title: 'Settings', description: 'Configure your site', icon: '⚙️', href: '/admin/settings' },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-zinc-400">Welcome to 47 Industries Admin</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-zinc-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className="text-4xl">{stat.icon}</div>
            </div>
            <div className={`h-1 rounded-full bg-gradient-to-r ${
              stat.color === 'blue' ? 'from-blue-600 to-blue-400' :
              stat.color === 'green' ? 'from-green-600 to-green-400' :
              stat.color === 'purple' ? 'from-purple-600 to-purple-400' :
              'from-orange-600 to-orange-400'
            }`} />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => (
            <a
              key={action.title}
              href={action.href}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-blue-600 hover:bg-zinc-800/50 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{action.icon}</div>
                <div>
                  <h3 className="text-lg font-bold mb-1 group-hover:text-blue-500 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-zinc-500">{action.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold mb-2">No recent activity</h3>
          <p className="text-zinc-500">
            Your recent orders, requests, and updates will appear here
          </p>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Admin Dashboard - 47 Industries',
  description: 'Admin control panel for 47 Industries',
}
