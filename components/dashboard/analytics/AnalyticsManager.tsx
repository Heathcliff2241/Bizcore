'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Download, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettings } from '@/lib/settings-context'
import { format } from 'date-fns'

interface AnalyticsData {
  period: {
    startDate: string
    endDate: string
  }
  kpis: {
    totalRevenue: number
    revenueChange: number
    totalOrders: number
    ordersChange: number
    averageOrderValue: number
    completedOrders: number
    uniqueCustomers: number
  }
  comparison: {
    prevRevenue: number
    prevOrders: number
  }
  revenue: {
    dailyTrend: { date: string; revenue: number }[]
  }
  topProducts: Array<{
    id: number
    name: string
    quantity: number
    revenue: number
  }>
  orderStatusBreakdown: Record<string, number>
  recentOrders: Array<{
    id: number
    orderNumber: string
    customerName: string
    total: number
    status: string
    createdAt: string
  }>
}

export function AnalyticsManager({ subdomain }: { subdomain?: string }) {
  useSession({ required: true })
  const { settings } = useSettings()
  const theme = {
    primary: settings.brandColors.primary,
    secondary: settings.brandColors.secondary,
    accent: settings.brandColors.accent,
    background: settings.brandColors.background,
    surface: settings.brandColors.surface,
    text: settings.brandColors.text
  }

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  
  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0])
  const [reportFilters, setReportFilters] = useState({
    orders: true,
    customers: true,
    products: true,
    employees: true,
    categories: true,
    inventory: true
  })
  const [generatingReport, setGeneratingReport] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/analytics?startDate=${startDate}&endDate=${endDate}&subdomain=${subdomain || ''}`)
        if (!response.ok) throw new Error('Failed to fetch')
        const result = await response.json()
        setData(result)
        setError('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading analytics')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [startDate, endDate, subdomain])

  const generatePDF = async () => {
    if (!data) return
    try {
      setGeneratingReport(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { jsPDF }: any = await import('jspdf')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { default: autoTable }: any = await import('jspdf-autotable')

      // Helper function to format currency for PDF (uses P instead of ₱ for font compatibility)
      const formatCurrency = (amount: number) => {
        return `P ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      }

      const pdf = new jsPDF()
      let yPos = 20

      // Apple-grade colors: clean, minimal
      const primaryColor = [31, 41, 55]  // Dark gray
      const accentColor = [59, 130, 246] // Blue accent
      const lightGray = [243, 244, 246]  // Very light gray
      const mediumGray = [107, 114, 128] // Medium gray for text
      const darkGray = [75, 85, 99]      // Dark gray for footer

      // Header with minimalist design
      pdf.setFontSize(32)
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.setFont('helvetica', 'bold')
      pdf.text('BizCore', 20, yPos)
      
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2])
      pdf.text('Business Analytics Report', 20, yPos + 8)
      yPos += 22

      // Subtle divider
      pdf.setDrawColor(accentColor[0], accentColor[1], accentColor[2])
      pdf.setLineWidth(0.5)
      pdf.line(20, yPos, 190, yPos)
      yPos += 10

      // Period information with elegant spacing
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2])
      pdf.text(`Report Period: ${format(new Date(reportStartDate), 'MMMM dd, yyyy')} — ${format(new Date(reportEndDate), 'MMMM dd, yyyy')}`, 20, yPos)
      pdf.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy h:mm a')}`, 20, yPos + 6)
      yPos += 16

      // Executive Summary section
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.text('Executive Summary', 20, yPos)
      yPos += 10

      // KPI Table with Apple-style design
      autoTable(pdf, {
        startY: yPos,
        head: [['Metric', 'Current Period', 'Previous Period', 'Change']],
        body: [
          ['Revenue', formatCurrency(data.kpis.totalRevenue), formatCurrency(data.comparison.prevRevenue), `${data.kpis.revenueChange > 0 ? '+' : ''}${data.kpis.revenueChange.toFixed(1)}%`],
          ['Total Orders', data.kpis.totalOrders.toString(), data.comparison.prevOrders.toString(), `${data.kpis.ordersChange > 0 ? '+' : ''}${data.kpis.ordersChange.toFixed(1)}%`],
          ['Completed Orders', data.kpis.completedOrders.toString(), '—', '—'],
          ['Avg Order Value', formatCurrency(data.kpis.averageOrderValue), '—', '—'],
          ['Unique Customers', data.kpis.uniqueCustomers.toString(), '—', '—']
        ],
        headStyles: { 
          fillColor: [245, 247, 250], 
          textColor: primaryColor,
          fontStyle: 'bold', 
          fontSize: 11,
          borderColor: [229, 231, 235],
          lineWidth: 0.3
        },
        bodyStyles: { 
          fontSize: 10,
          textColor: mediumGray,
          borderColor: [243, 244, 246],
          lineWidth: 0.2
        },
        alternateRowStyles: { 
          fillColor: lightGray,
          textColor: mediumGray
        },
        margin: { left: 20, right: 20 }
      })
      yPos = (pdf as any).lastAutoTable.finalY + 15 // eslint-disable-line @typescript-eslint/no-explicit-any

      // Top Products Section
      if (reportFilters.products && data.topProducts.length > 0) {
        yPos += 5
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        pdf.text('Top Selling Products', 20, yPos)
        yPos += 8

        autoTable(pdf, {
          startY: yPos,
          head: [['Product Name', 'Quantity Sold', 'Total Revenue', 'Avg. Price']],
          body: data.topProducts.slice(0, 10).map(p => [
            p.name.substring(0, 45),
            p.quantity.toString(),
            formatCurrency(p.revenue),
            formatCurrency(p.revenue / p.quantity)
          ]),
          headStyles: { 
            fillColor: [245, 247, 250], 
            textColor: primaryColor,
            fontStyle: 'bold', 
            fontSize: 10,
            borderColor: [229, 231, 235],
            lineWidth: 0.3
          },
          bodyStyles: { 
            fontSize: 9,
            textColor: mediumGray,
            borderColor: [243, 244, 246],
            lineWidth: 0.2
          },
          alternateRowStyles: { 
            fillColor: lightGray,
            textColor: mediumGray
          },
          margin: { left: 20, right: 20 }
        })
        yPos = (pdf as any).lastAutoTable.finalY + 15 // eslint-disable-line @typescript-eslint/no-explicit-any
      }

      // Order Status Distribution
      if (reportFilters.orders && Object.keys(data.orderStatusBreakdown).length > 0) {
        yPos += 5
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        pdf.text('Order Status Distribution', 20, yPos)
        yPos += 8

        autoTable(pdf, {
          startY: yPos,
          head: [['Status', 'Order Count', 'Percentage']],
          body: Object.entries(data.orderStatusBreakdown).map(([status, count]) => {
            const total = Object.values(data.orderStatusBreakdown).reduce((a, b) => a + (b as number), 0)
            const percentage = ((count as number / total) * 100).toFixed(1)
            return [
              status.charAt(0).toUpperCase() + status.slice(1),
              (count as number).toString(),
              `${percentage}%`
            ]
          }),
          headStyles: { 
            fillColor: [245, 247, 250], 
            textColor: primaryColor,
            fontStyle: 'bold', 
            fontSize: 10,
            borderColor: [229, 231, 235],
            lineWidth: 0.3
          },
          bodyStyles: { 
            fontSize: 9,
            textColor: mediumGray,
            borderColor: [243, 244, 246],
            lineWidth: 0.2
          },
          alternateRowStyles: { 
            fillColor: lightGray,
            textColor: mediumGray
          },
          margin: { left: 20, right: 20 }
        })
        yPos = (pdf as any).lastAutoTable.finalY + 15 // eslint-disable-line @typescript-eslint/no-explicit-any
      }

      // Recent Orders Section
      if (reportFilters.orders && data.recentOrders.length > 0) {
        yPos += 5
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        pdf.text('Recent Orders', 20, yPos)
        yPos += 8

        autoTable(pdf, {
          startY: yPos,
          head: [['Order #', 'Customer', 'Amount', 'Status', 'Date']],
          body: data.recentOrders.slice(0, 15).map(order => [
            order.orderNumber,
            order.customerName.substring(0, 25),
            formatCurrency(order.total),
            order.status.charAt(0).toUpperCase() + order.status.slice(1),
            format(new Date(order.createdAt), 'MMM dd, yyyy')
          ]),
          headStyles: { 
            fillColor: [245, 247, 250], 
            textColor: primaryColor,
            fontStyle: 'bold', 
            fontSize: 10,
            borderColor: [229, 231, 235],
            lineWidth: 0.3
          },
          bodyStyles: { 
            fontSize: 9,
            textColor: mediumGray,
            borderColor: [243, 244, 246],
            lineWidth: 0.2
          },
          alternateRowStyles: { 
            fillColor: lightGray,
            textColor: mediumGray
          },
          margin: { left: 20, right: 20 }
        })
      }

      // Elegant footer
      const pageCount = (pdf as any).internal.pages.length || 1 // eslint-disable-line @typescript-eslint/no-explicit-any
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2])
      
      // Subtle line above footer
      pdf.setDrawColor(229, 231, 235)
      pdf.setLineWidth(0.3)
      pdf.line(20, pdf.internal.pageSize.getHeight() - 15, 190, pdf.internal.pageSize.getHeight() - 15)
      
      pdf.text(`Page ${pageCount}`, 20, pdf.internal.pageSize.getHeight() - 10)
      pdf.text('© 2025 BizCore. Confidential.', 190, pdf.internal.pageSize.getHeight() - 10, { align: 'right' })

      pdf.save(`BizCore-Report-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.pdf`)
      setShowReportModal(false)
    } catch (err) {
      console.error('PDF generation error:', err)
      alert('Failed to generate PDF')
    } finally {
      setGeneratingReport(false)
    }
  }

  if (loading) {
    return (
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex-1 p-8" 
        style={{ backgroundColor: theme.background || '#f9fafb' }}
      >
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 
              className="text-3xl font-bold tracking-tight"
              style={{ color: theme.text || '#111827' }}
            >
              {subdomain ? `${subdomain} Analytics` : 'Analytics'}
            </h2>
            <p 
              className="mt-2 text-sm"
              style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}
            >
              Business performance and insights for {subdomain || 'your store'}
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div 
            className="w-12 h-12 border-4 rounded-full animate-spin mb-4"
            style={{ 
              borderTopColor: 'transparent',
              borderRightColor: `${theme.primary}30`,
              borderBottomColor: `${theme.primary}30`,
              borderLeftColor: `${theme.primary}30`
            }}
          />
          <p className="text-sm font-medium" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>
            Loading analytics...
          </p>
        </motion.div>
      </motion.main>
    )
  }

  if (!data) {
    return (
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex-1 p-8" 
        style={{ backgroundColor: theme.background || '#f9fafb' }}
      >
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 
              className="text-3xl font-bold tracking-tight"
              style={{ color: theme.text || '#111827' }}
            >
              {subdomain ? `${subdomain} Analytics` : 'Analytics'}
            </h2>
            <p 
              className="mt-2 text-sm"
              style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}
            >
              Business performance and insights for {subdomain || 'your store'}
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center py-20"
        >
          <p className="text-sm font-medium" style={{ color: theme.text ? `${theme.text}80` : '#6b7280' }}>
            {error || 'No data available'}
          </p>
        </motion.div>
      </motion.main>
    )
  }

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex-1 p-8" 
      style={{ backgroundColor: theme.background || '#f9fafb' }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h2 
            className="text-3xl font-bold tracking-tight"
            style={{ color: theme.text || '#111827' }}
          >
            {subdomain ? `${subdomain} Analytics` : 'Analytics'}
          </h2>
          <p 
            className="mt-2 text-sm"
            style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}
          >
            Business performance and insights for {subdomain || 'your store'}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowReportModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold"
          style={{ backgroundColor: theme.primary }}
        >
          <Download size={18} />
          Generate Report
        </motion.button>
      </motion.div>

      {/* Date Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="rounded-2xl border p-6 flex gap-4"
        style={{ 
          borderColor: `${theme.primary}20`,
          background: `linear-gradient(135deg, ${theme.primary}08, ${theme.secondary}08)`,
          boxShadow: `0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px ${theme.primary}10`
        }}
      >
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ 
              borderColor: `${theme.primary}30`
            }}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ 
              borderColor: `${theme.primary}30`
            }}
          />
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6"
      >
        <KPICard
          title="Revenue"
          value={`₱${data.kpis.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
          change={data.kpis.revenueChange}
          icon={DollarSign}
          theme={theme}
        />
        <KPICard
          title="Orders"
          value={data.kpis.totalOrders.toString()}
          change={data.kpis.ordersChange}
          icon={ShoppingCart}
          theme={theme}
        />
        <KPICard
          title="Avg Order Value"
          value={`₱${data.kpis.averageOrderValue.toFixed(2)}`}
          change={null}
          icon={TrendingUp}
          theme={theme}
        />
        <KPICard
          title="Customers"
          value={data.kpis.uniqueCustomers.toString()}
          change={null}
          icon={Users}
          theme={theme}
        />
      </motion.div>

      {/* Top Products & Order Status - Side by Side */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
      >
        {/* Top Products */}
        {data.topProducts.length > 0 && (
          <div
            className="bg-white rounded-2xl p-6 border"
            style={{
              borderColor: `${theme.primary}20`,
              boxShadow: `0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px ${theme.primary}10`
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: theme.text }}>
              Top Products
            </h3>
            <div className="space-y-3">
              {data.topProducts.slice(0, 5).map((product, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: `${theme.primary}05` }}>
                  <div>
                    <p className="font-medium text-sm" style={{ color: theme.text }}>{product.name}</p>
                    <p className="text-xs mt-1" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>
                      {product.quantity} sold
                    </p>
                  </div>
                  <p className="font-semibold" style={{ color: theme.primary }}>
                    ₱{product.revenue.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Status */}
        {data.orderStatusBreakdown && Object.keys(data.orderStatusBreakdown).length > 0 && (
          <div
            className="bg-white rounded-2xl p-6 border"
            style={{
              borderColor: `${theme.primary}20`,
              boxShadow: `0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px ${theme.primary}10`
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: theme.text }}>
              Order Status
            </h3>
            <div className="space-y-3">
              {Object.entries(data.orderStatusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: `${theme.primary}05` }}>
                  <div>
                    <p className="font-medium text-sm" style={{ color: theme.text }}>{status}</p>
                  </div>
                  <p className="font-semibold" style={{ color: theme.primary }}>
                    {count}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Charts - Revenue Trend Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
      >
        {/* Revenue Trend */}
        {data.revenue.dailyTrend.length > 0 && (
          <>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Revenue Trend</h2>
            <div style={{ width: '100%', height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.revenue.dailyTrend} margin={{ top: 5, right: 30, left: 0, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    tickFormatter={(value) => {
                      if (value >= 1000) return `₱${(value / 1000).toFixed(1)}K`
                      return `₱${value.toFixed(0)}`
                    }}
                  />
                  <Tooltip 
                    formatter={(value) => `₱${(value as number).toLocaleString()}`}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
        {data.revenue.dailyTrend.length === 0 && (
          <div className="h-96 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-slate-500">No revenue data available</p>
          </div>
        )}
      </motion.div>

      {/* Report Generation Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => !generatingReport && setShowReportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="p-6 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-2xl"
                style={{ borderBottomColor: `${theme.primary}20` }}
              >
                <h2 className="text-xl font-bold" style={{ color: theme.text }}>
                  Generate Report
                </h2>
                <button
                  onClick={() => setShowReportModal(false)}
                  disabled={generatingReport}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X size={20} style={{ color: theme.text }} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Date Range Section */}
                <div>
                  <h3 className="font-semibold mb-4" style={{ color: theme.text }}>
                    Date Range
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={reportStartDate}
                        onChange={(e) => setReportStartDate(e.target.value)}
                        disabled={generatingReport}
                        className="w-full px-3 py-2 border rounded-lg disabled:opacity-50"
                        style={{ borderColor: `${theme.primary}30` }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                        End Date
                      </label>
                      <input
                        type="date"
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                        disabled={generatingReport}
                        className="w-full px-3 py-2 border rounded-lg disabled:opacity-50"
                        style={{ borderColor: `${theme.primary}30` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Report Sections Filter */}
                <div>
                  <h3 className="font-semibold mb-4" style={{ color: theme.text }}>
                    Report Sections
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: 'orders', label: 'Orders & Status' },
                      { key: 'customers', label: 'Customer Analytics' },
                      { key: 'products', label: 'Top Products' },
                      { key: 'employees', label: 'Employee Performance' },
                      { key: 'categories', label: 'Category Breakdown' },
                      { key: 'inventory', label: 'Inventory Status' }
                    ].map((section) => (
                      <label
                        key={section.key}
                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                        style={{
                          backgroundColor: reportFilters[section.key as keyof typeof reportFilters]
                            ? `${theme.primary}10`
                            : 'transparent'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={reportFilters[section.key as keyof typeof reportFilters]}
                          onChange={(e) =>
                            setReportFilters((prev) => ({
                              ...prev,
                              [section.key]: e.target.checked
                            }))
                          }
                          disabled={generatingReport}
                          className="w-4 h-4 rounded cursor-pointer disabled:opacity-50"
                          style={{ accentColor: theme.primary }}
                        />
                        <span style={{ color: theme.text }}>{section.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Info Text */}
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: `${theme.primary}10`,
                    color: theme.primary
                  }}
                >
                  ✓ Report will include selected sections in a professional PDF format with BizCore branding
                </div>
              </div>

              {/* Footer */}
              <div
                className="p-6 border-t flex gap-3 sticky bottom-0 bg-white rounded-b-2xl"
                style={{ borderTopColor: `${theme.primary}20` }}
              >
                <button
                  onClick={() => setShowReportModal(false)}
                  disabled={generatingReport}
                  className="flex-1 px-4 py-2 rounded-lg border font-medium transition-colors disabled:opacity-50"
                  style={{
                    borderColor: `${theme.primary}30`,
                    color: theme.primary
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={generatePDF}
                  disabled={generatingReport}
                  className="flex-1 px-4 py-2 rounded-lg text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: theme.primary }}
                >
                  {generatingReport ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      Generate PDF
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  )
}

function KPICard({
  title,
  value,
  change,
  icon: Icon,
  theme
}: {
  title: string
  value: string
  change: number | null
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  theme: { text?: string; primary?: string; secondary?: string }
}) {
  const isPositive = change !== null && change >= 0

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="p-6 bg-white border rounded-2xl shadow-sm backdrop-blur-xl"
      style={{
        background: `linear-gradient(135deg, ${theme.primary}08, ${theme.secondary}08)`,
        borderColor: `${theme.primary}20`,
        boxShadow: `0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px ${theme.primary}10`
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>
            {title}
          </p>
          <p className="text-3xl font-bold mt-2" style={{ color: theme.text }}>
            {value}
          </p>
          {change !== null && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <TrendingUp size={14} style={{ color: '#10b981' }} />
              ) : (
                <TrendingDown size={14} style={{ color: '#ef4444' }} />
              )}
              <span style={{ color: isPositive ? '#10b981' : '#ef4444', fontSize: '12px', fontWeight: '600' }}>
                {isPositive ? '+' : ''}{change.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <div
          className="p-4 rounded-xl transition-transform duration-200"
          style={{ backgroundColor: `${theme.primary}15` }}
        >
          <Icon width={28} height={28} style={{ color: theme.primary }} />
        </div>
      </div>
    </motion.div>
  )
}
