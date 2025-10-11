export default function AdminInquiriesPage() {
  const inquiries = []

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Service Inquiries</h1>
        <p className="admin-page-subtitle">Web and app development inquiries</p>
      </div>

      {inquiries.length === 0 ? (
        <div className="admin-card admin-card-empty">
          <div className="admin-card-icon">💬</div>
          <h3 className="admin-card-title">No inquiries yet</h3>
          <p className="admin-card-description">
            Service inquiries from the contact form will appear here
          </p>
        </div>
      ) : (
        <div>
          {/* Inquiries will be mapped here */}
        </div>
      )}
    </div>
  )
}

export const metadata = {
  title: 'Service Inquiries - Admin - 47 Industries',
}
