export default function AdminOrdersPage() {
  const orders = []

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Orders</h1>
        <p className="admin-page-subtitle">View and manage customer orders</p>
      </div>

      {orders.length === 0 ? (
        <div className="admin-card admin-card-empty">
          <div className="admin-card-icon">🛒</div>
          <h3 className="admin-card-title">No orders yet</h3>
          <p className="admin-card-description">
            Orders will appear here when customers make purchases
          </p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
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
