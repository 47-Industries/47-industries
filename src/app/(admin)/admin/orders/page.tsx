export default function AdminOrdersPage() {
  // TODO: Fetch from database
  const orders = []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Orders</h1>
        <p className="text-text-secondary">View and manage customer orders</p>
      </div>

      {orders.length === 0 ? (
        <div className="border border-border rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-2xl font-bold mb-2">No orders yet</h3>
          <p className="text-text-secondary">
            Orders will appear here when customers make purchases
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Order #</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Total</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Orders will be mapped here */}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export const metadata = {
  title: 'Orders - Admin - 47 Industries',
}
