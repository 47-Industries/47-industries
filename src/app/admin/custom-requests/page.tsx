export default function AdminCustomRequestsPage() {
  const requests = []

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">3D Print Requests</h1>
        <p className="admin-page-subtitle">Manage custom 3D printing quote requests</p>
      </div>

      {requests.length === 0 ? (
        <div className="admin-card admin-card-empty">
          <div className="admin-card-icon">🖨️</div>
          <h3 className="admin-card-title">No requests yet</h3>
          <p className="admin-card-description">
            Custom 3D printing requests will appear here
          </p>
        </div>
      ) : (
        <div>
          {/* Requests will be mapped here */}
        </div>
      )}
    </div>
  )
}

export const metadata = {
  title: '3D Print Requests - Admin - 47 Industries',
}
