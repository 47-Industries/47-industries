export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-text-secondary">Configure your site</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-border rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">Site Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Site Name</label>
              <input
                type="text"
                defaultValue="47 Industries"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contact Email</label>
              <input
                type="email"
                defaultValue="contact@47industries.com"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg"
              />
            </div>
            <button className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90">
              Save Changes
            </button>
          </div>
        </div>

        <div className="border border-border rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">Users</h3>
          <p className="text-text-secondary text-sm mb-4">
            Manage admin users and permissions
          </p>
          <button className="px-6 py-2 border border-border rounded-lg hover:bg-surface">
            Manage Users
          </button>
        </div>

        <div className="border border-border rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">Email Settings</h3>
          <p className="text-text-secondary text-sm mb-4">
            Configure email notifications and templates
          </p>
          <button className="px-6 py-2 border border-border rounded-lg hover:bg-surface">
            Configure Email
          </button>
        </div>

        <div className="border border-border rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">Stripe Integration</h3>
          <p className="text-text-secondary text-sm mb-4">
            Payment processing configuration
          </p>
          <button className="px-6 py-2 border border-border rounded-lg hover:bg-surface">
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
