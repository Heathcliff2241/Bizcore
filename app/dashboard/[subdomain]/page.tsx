'use client'

import { useEffect, useState } from 'react'

interface TenantInfo {
  id: number
  name: string
  subdomain: string
  subscriptionPlan?: string
  isActive: boolean
}

interface Order {
  id: number
  order_number: string
  customer_name: string
  order_status: string
  total_amount: number
}

interface Product {
  id: number
  name: string
  current_stock: number
  price: number
}

const SummaryTile = ({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) => (
  <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
  </div>
)

const OrdersTable = ({ data }: { data: Order[] }) => (
  <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
    <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Orders</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-700">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-3 font-medium">Order ID</th>
            <th className="py-3 font-medium">Customer</th>
            <th className="py-3 font-medium">Status</th>
            <th className="py-3 font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((o) => (
            <tr key={o.id} className="transition-colors duration-200 border-b border-gray-100 hover:bg-gray-50/50">
              <td className="py-3">{o.order_number}</td>
              <td className="py-3">{o.customer_name}</td>
              <td className="py-3">{o.order_status}</td>
              <td className="py-3">₱{parseFloat(o.total_amount.toString() || '0').toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

const ProductsTable = ({ data }: { data: Product[] }) => (
  <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
    <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Products</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-700">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-3 font-medium">Product</th>
            <th className="py-3 font-medium">Stock</th>
            <th className="py-3 font-medium">Price</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.id} className="transition-colors duration-200 border-b border-gray-100 hover:bg-gray-50/50">
              <td className="py-3">{p.name}</td>
              <td className="py-3">{p.current_stock}</td>
              <td className="py-3">₱{parseFloat(p.price.toString() || '0').toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

interface Summary {
  orders: number
  products: number
  inventory: number
  customers: number
  revenue: number
  lowStock: number
  pendingOrders: number
  activePromos: number
  recentOrders: Order[]
  productsList: Product[]
}

export default function TenantDashboardPage() {
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null)
  const [summary, setSummary] = useState<Summary>({
    orders: 0,
    products: 0,
    inventory: 0,
    customers: 0,
    revenue: 0,
    lowStock: 0,
    pendingOrders: 0,
    activePromos: 0,
    recentOrders: [],
    productsList: [],
  })

  useEffect(() => {
    // Get tenant from localStorage
    const tenant = localStorage.getItem('tenant')
    if (tenant) {
      try {
        setTenantInfo(JSON.parse(tenant))
      } catch {
        console.error('Failed to parse tenant data')
      }
    }

    // Mock data for now
    setSummary({
      orders: 125,
      products: 45,
      inventory: 1200,
      customers: 89,
      revenue: 25000,
      lowStock: 3,
      pendingOrders: 12,
      activePromos: 2,
      recentOrders: [
        { id: 1, order_number: 'ORD-001', customer_name: 'John Doe', order_status: 'Completed', total_amount: 150.0 },
        { id: 2, order_number: 'ORD-002', customer_name: 'Jane Smith', order_status: 'Pending', total_amount: 200.0 },
      ],
      productsList: [
        { id: 1, name: 'Product A', current_stock: 50, price: 25.0 },
        { id: 2, name: 'Product B', current_stock: 30, price: 40.0 },
      ],
    })
  }, [])

  return (
    <main className="flex-1 p-8 bg-gray-50">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900">Dashboard Overview</h2>
          {tenantInfo && <p className="text-sm text-gray-600 mt-2">Welcome to {tenantInfo.name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile title="Orders" value={summary.orders} />
        <SummaryTile title="Products" value={summary.products} />
        <SummaryTile title="Inventory" value={summary.inventory} />
        <SummaryTile title="Customers" value={summary.customers} />
        <SummaryTile title="Revenue" value={`₱${summary.revenue.toFixed(2)}`} />
        <SummaryTile title="Low Stock Items" value={summary.lowStock} />
        <SummaryTile title="Pending Orders" value={summary.pendingOrders} />
        <SummaryTile title="Active Promotions" value={summary.activePromos} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OrdersTable data={summary.recentOrders} />
        <ProductsTable data={summary.productsList} />
      </div>
    </main>
  )
}
