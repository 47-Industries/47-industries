export default function AdminInquiriesPage() {
  // TODO: Fetch from database
  const inquiries = []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Service Inquiries</h1>
        <p className="text-zinc-400">Web and app development inquiries</p>
      </div>

      {inquiries.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-2xl font-bold mb-2">No inquiries yet</h3>
          <p className="text-zinc-500">
            Service inquiries from the contact form will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Inquiries will be mapped here */}
        </div>
      )}
    </div>
  )
}

export const metadata = {
  title: 'Service Inquiries - Admin - 47 Industries',
}
