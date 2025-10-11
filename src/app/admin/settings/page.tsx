export default function AdminSettingsPage() {
  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Settings</h1>
        <p className="admin-page-subtitle">Configure your site</p>
      </div>

      <div className="admin-settings-grid">
        <div className="admin-card">
          <h3 className="admin-section-title">Site Information</h3>
          <div>
            <div className="admin-form-group">
              <label className="admin-form-label">Site Name</label>
              <input
                type="text"
                defaultValue="47 Industries"
                className="admin-form-input"
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Contact Email</label>
              <input
                type="email"
                defaultValue="contact@47industries.com"
                className="admin-form-input"
              />
            </div>
            <button className="admin-btn admin-btn-primary">
              Save Changes
            </button>
          </div>
        </div>

        <div className="admin-card">
          <h3 className="admin-section-title">Users</h3>
          <p className="admin-card-description">
            Manage admin users and permissions
          </p>
          <button className="admin-btn admin-btn-secondary">
            Manage Users
          </button>
        </div>

        <div className="admin-card">
          <h3 className="admin-section-title">Email Settings</h3>
          <p className="admin-card-description">
            Configure email notifications and templates
          </p>
          <button className="admin-btn admin-btn-secondary">
            Configure Email
          </button>
        </div>

        <div className="admin-card">
          <h3 className="admin-section-title">Stripe Integration</h3>
          <p className="admin-card-description">
            Payment processing configuration
          </p>
          <button className="admin-btn admin-btn-secondary">
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
