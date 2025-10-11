export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-zinc-400">Configure your site</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">Site Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Site Name</label>
              <input
                type="text"
                defaultValue="47 Industries"
                className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contact Email</label>
              <input
                type="email"
                defaultValue="contact@47industries.com"
                className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg focus:border-blue-600 focus:outline-none"
              />
            </div>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Save Changes
            </button>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">Users</h3>
          <p className="text-zinc-500 text-sm mb-4">
            Manage admin users and permissions
          </p>
          <button className="px-6 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors">
            Manage Users
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">Email Settings</h3>
          <p className="text-zinc-500 text-sm mb-4">
            Configure email notifications and templates
          </p>
          <button className="px-6 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors">
            Configure Email
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">Stripe Integration</h3>
          <p className="text-zinc-500 text-sm mb-4">
            Payment processing configuration
          </p>
          <button className="px-6 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors">
            Configure Stripe
          </button>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Settings - Admin - 47 Industries',
}
