export default function AdminCustomRequestsPage() {
  // TODO: Fetch from database
  const requests = []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">3D Print Requests</h1>
        <p className="text-text-secondary">Manage custom 3D printing quote requests</p>
      </div>

      {requests.length === 0 ? (
        <div className="border border-border rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">🖨️</div>
          <h3 className="text-2xl font-bold mb-2">No requests yet</h3>
          <p className="text-text-secondary">
            Custom 3D printing requests will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Requests will be mapped here */}
        </div>
      )}
    </div>
  )
}

export const metadata = {
  title: '3D Print Requests - Admin - 47 Industries',
}
