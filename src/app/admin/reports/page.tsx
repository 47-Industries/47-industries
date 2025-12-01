'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SalesData {
  summary: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    revenueGrowth: number
  }
  revenueByDay: Array<{ date: string; revenue: number; orders: number }>
  topProducts: Array<{ id: string; name: string; revenue: number; quantity: number }>
  revenueByCategory: Array<{ id: string; name: string; revenue: number }>
  ordersByStatus: Array<{ status: string; count: number }>
}

interface CustomerData {
  summary: {
    totalCustomers: number
    newCustomers: number
    repeatCustomers: number
    retentionRate: number
    averageLifetimeValue: number
  }
  monthlyGrowth: Array<{ month: string; count: number }>
  topCustomers: Array<{
    id: string
    name: string
    email: string
    totalSpent: number
    orderCount: number
    lastOrder: string | null
  }>
  segmentStats: Array<{ id: string; name: string; color: string; memberCount: number }>
}

interface InventoryData {
  summary: {
    totalProducts: number
    lowStockCount: number
    outOfStockCount: number
    totalInventoryValue: number
  }
  inventoryByCategory: Array<{ id: string; name: string; productCount: number; totalStock: number; value: number }>
  lowStockItems: Array<{ id: string; name: string; stock: number; sku: string; category: string; price: number }>
  outOfStockItems: Array<{ id: string; name: string; sku: string; category: string; price: number }>
  topMovingProducts: Array<{ id: string; name: string; stock: number; sold: number; turnoverRate: number }>
  slowMovingProducts: Array<{ id: string; name: string; stock: number; sold: number; value: number }>
}

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<'sales' | 'customers' | 'inventory' | 'services'>('sales')
  const [dateRange, setDateRange] = useState('30')
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [customerData, setCustomerData] = useState<CustomerData | null>(null)
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null)

  useEffect(() => {
    fetchReportData()
  }, [activeReport, dateRange])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports/${activeReport}?period=${dateRange}`)
      if (res.ok) {
        const data = await res.json()
        if (activeReport === 'sales') setSalesData(data)
        else if (activeReport === 'customers') setCustomerData(data)
        else if (activeReport === 'inventory') setInventoryData(data)
      }
    } catch (error) {
      console.error('Failed to fetch report:', error)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-text-secondary mt-1">
            Comprehensive analytics and business insights
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-surface border border-border rounded-xl focus:outline-none focus:border-blue-500"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium">
            Export Report
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-6 overflow-x-auto">
          {[
            { id: 'sales', label: 'Sales Report', icon: '💰' },
            { id: 'customers', label: 'Customer Report', icon: '👥' },
            { id: 'inventory', label: 'Inventory Report', icon: '📦' },
            { id: 'services', label: 'Services Report', icon: '🛠️' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id as any)}
              className={`pb-3 px-1 font-medium transition-colors relative flex items-center gap-2 whitespace-nowrap ${
                activeReport === tab.id
                  ? 'text-white'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {activeReport === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : (
        <>
          {activeReport === 'sales' && <SalesReport data={salesData} />}
          {activeReport === 'customers' && <CustomerReport data={customerData} />}
          {activeReport === 'inventory' && <InventoryReport data={inventoryData} />}
          {activeReport === 'services' && <ServicesReport />}
        </>
      )}
    </div>
  )
}

function SalesReport({ data }: { data: SalesData | null }) {
  if (!data) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-semibold mb-2">No Sales Data</h3>
        <p className="text-text-secondary">Sales data will appear here once orders are placed.</p>
      </div>
    )
  }

  const totalCategoryRevenue = data.revenueByCategory.reduce((sum, cat) => sum + cat.revenue, 0)

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-text-secondary text-sm">Total Revenue</p>
          <p className="text-3xl font-bold mt-2 text-green-400">
            ${data.summary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          {data.summary.revenueGrowth !== 0 && (
            <p className={`text-sm mt-1 ${data.summary.revenueGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data.summary.revenueGrowth >= 0 ? '+' : ''}{data.summary.revenueGrowth.toFixed(1)}% vs prev period
            </p>
          )}
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-text-secondary text-sm">Total Orders</p>
          <p className="text-3xl font-bold mt-2">{data.summary.totalOrders}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-text-secondary text-sm">Average Order Value</p>
          <p className="text-3xl font-bold mt-2 text-blue-400">
            ${data.summary.averageOrderValue.toFixed(2)}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-text-secondary text-sm">Order Status</p>
          <div className="mt-2 space-y-1">
            {data.ordersByStatus.slice(0, 3).map(status => (
              <div key={status.status} className="flex justify-between text-sm">
                <span className="text-text-secondary capitalize">{status.status.toLowerCase()}</span>
                <span className="font-medium">{status.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
        {data.revenueByDay.length === 0 ? (
          <p className="text-text-secondary text-center py-8">No revenue data for this period</p>
        ) : (
          <div className="h-64 flex items-end gap-1">
            {data.revenueByDay.slice(-14).map((day, i) => {
              const maxRevenue = Math.max(...data.revenueByDay.map(d => d.revenue), 1)
              const height = (day.revenue / maxRevenue) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-blue-500 rounded-t-sm min-h-[4px] transition-all hover:bg-blue-400 cursor-pointer"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`$${day.revenue.toFixed(2)} (${day.orders} orders)`}
                  />
                  <span className="text-xs text-text-secondary -rotate-45 origin-left whitespace-nowrap">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Top Products & Categories */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Top Products</h3>
          {data.topProducts.length === 0 ? (
            <p className="text-text-secondary text-center py-8">No sales data yet</p>
          ) : (
            <div className="space-y-4">
              {data.topProducts.slice(0, 5).map((product, i) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-text-secondary w-6">{i + 1}</span>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-text-secondary">{product.quantity} sold</p>
                    </div>
                  </div>
                  <span className="font-semibold text-green-400">
                    ${product.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue by Category</h3>
          {data.revenueByCategory.length === 0 ? (
            <p className="text-text-secondary text-center py-8">No category data yet</p>
          ) : (
            <div className="space-y-4">
              {data.revenueByCategory.map((category, i) => {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500']
                const percentage = totalCategoryRevenue > 0 ? (category.revenue / totalCategoryRevenue) * 100 : 0
                return (
                  <div key={category.id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">{category.name}</span>
                      <span className="text-sm font-medium">
                        ${category.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[i % colors.length]} rounded-full`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CustomerReport({ data }: { data: CustomerData | null }) {
  if (!data) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <div className="text-4xl mb-4">👥</div>
        <h3 className="text-lg font-semibold mb-2">No Customer Data</h3>
        <p className="text-text-secondary">Customer data will appear here once users sign up.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-text-secondary text-sm">Total Customers</p>
          <p className="text-3xl font-bold mt-2">{data.summary.totalCustomers}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-text-secondary text-sm">New Customers</p>
          <p className="text-3xl font-bold mt-2 text-green-400">{data.summary.newCustomers}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-text-secondary text-sm">Repeat Customers</p>
          <p className="text-3xl font-bold mt-2 text-blue-400">{data.summary.repeatCustomers}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-text-secondary text-sm">Retention Rate</p>
          <p className="text-3xl font-bold mt-2 text-purple-400">
            {data.summary.retentionRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-text-secondary text-sm">Avg Lifetime Value</p>
          <p className="text-3xl font-bold mt-2 text-yellow-400">
            ${data.summary.averageLifetimeValue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Customer Growth & Segments */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Customer Growth (6 Months)</h3>
          {data.monthlyGrowth.length === 0 ? (
            <p className="text-text-secondary text-center py-8">No growth data</p>
          ) : (
            <div className="h-48 flex items-end gap-4">
              {data.monthlyGrowth.map((month, i) => {
                const maxCount = Math.max(...data.monthlyGrowth.map(m => m.count), 1)
                const height = (month.count / maxCount) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-green-500 rounded-t-sm min-h-[4px] transition-all hover:bg-green-400"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${month.count} new customers`}
                    />
                    <span className="text-xs text-text-secondary">{month.month}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Segments */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Customer Segments</h3>
            <Link href="/admin/customers" className="text-sm text-blue-400 hover:text-blue-300">
              Manage →
            </Link>
          </div>
          {data.segmentStats.length === 0 ? (
            <p className="text-text-secondary text-center py-8">No segments created yet</p>
          ) : (
            <div className="space-y-3">
              {data.segmentStats.map(segment => (
                <div key={segment.id} className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="font-medium">{segment.name}</span>
                  </div>
                  <span className="text-text-secondary">{segment.memberCount} members</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Top Customers by Lifetime Value</h3>
        {data.topCustomers.length === 0 ? (
          <p className="text-text-secondary text-center py-8">No customer orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Orders</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Last Order</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {data.topCustomers.map((customer, i) => (
                  <tr key={customer.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-text-secondary w-6">{i + 1}</span>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-text-secondary">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{customer.orderCount}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {customer.lastOrder
                        ? new Date(customer.lastOrder).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-400">
                      ${customer.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function InventoryReport({ data }: { data: InventoryData | null }) {
  if (!data) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <div className="text-4xl mb-4">📦</div>
        <h3 className="text-lg font-semibold mb-2">No Inventory Data</h3>
        <p className="text-text-secondary">Inventory data will appear here once products are added.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-text-secondary text-sm">Total Products</p>
          <p className="text-3xl font-bold mt-2">{data.summary.totalProducts}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-text-secondary text-sm">Low Stock</p>
          <p className="text-3xl font-bold mt-2 text-yellow-400">{data.summary.lowStockCount}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-text-secondary text-sm">Out of Stock</p>
          <p className="text-3xl font-bold mt-2 text-red-400">{data.summary.outOfStockCount}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-text-secondary text-sm">Inventory Value</p>
          <p className="text-3xl font-bold mt-2 text-green-400">
            ${data.summary.totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Inventory by Category */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Inventory by Category</h3>
        {data.inventoryByCategory.length === 0 ? (
          <p className="text-text-secondary text-center py-8">No inventory data</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Products</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Total Stock</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">Value</th>
                </tr>
              </thead>
              <tbody>
                {data.inventoryByCategory.map(category => (
                  <tr key={category.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{category.name}</td>
                    <td className="px-4 py-3">{category.productCount}</td>
                    <td className="px-4 py-3">{category.totalStock}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-400">
                      ${category.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Low Stock & Out of Stock */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Low Stock */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Low Stock Alert</h3>
            <span className="text-sm text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full">
              {data.lowStockItems.length} items
            </span>
          </div>
          {data.lowStockItems.length === 0 ? (
            <p className="text-text-secondary text-center py-8">All products are well stocked!</p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {data.lowStockItems.map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-text-secondary">{product.category} • SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-yellow-400 font-bold">{product.stock}</span>
                    <p className="text-xs text-text-secondary">in stock</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Out of Stock */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Out of Stock</h3>
            <span className="text-sm text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
              {data.outOfStockItems.length} items
            </span>
          </div>
          {data.outOfStockItems.length === 0 ? (
            <p className="text-text-secondary text-center py-8">No products out of stock!</p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {data.outOfStockItems.map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg border border-red-500/20">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-text-secondary">{product.category} • SKU: {product.sku}</p>
                  </div>
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    Restock
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product Movement */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Moving */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Top Moving Products</h3>
          {data.topMovingProducts.length === 0 ? (
            <p className="text-text-secondary text-center py-8">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {data.topMovingProducts.slice(0, 5).map((product, i) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-text-secondary w-6">{i + 1}</span>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-text-secondary">{product.stock} in stock</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-green-400 font-bold">{product.sold}</span>
                    <p className="text-xs text-text-secondary">sold</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Slow Moving */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Slow Moving Products</h3>
          {data.slowMovingProducts.length === 0 ? (
            <p className="text-text-secondary text-center py-8">No slow moving products</p>
          ) : (
            <div className="space-y-3">
              {data.slowMovingProducts.slice(0, 5).map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-text-secondary">{product.stock} in stock • {product.sold} sold</p>
                  </div>
                  <div className="text-right">
                    <span className="text-yellow-400 font-medium">${product.value.toFixed(2)}</span>
                    <p className="text-xs text-text-secondary">tied up</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ServicesReport() {
  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <div className="text-4xl mb-4">🛠️</div>
        <h3 className="text-lg font-semibold mb-2">Services Report Coming Soon</h3>
        <p className="text-text-secondary max-w-md mx-auto">
          Track service inquiries, project completions, revenue from services, and more.
        </p>
      </div>
    </div>
  )
}
