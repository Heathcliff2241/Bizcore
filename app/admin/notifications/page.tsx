'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  actionUrl: string
  isRead: boolean
  isDismissed: boolean
  createdAt: string
  tenant?: {
    id: string
    name: string
    subdomain: string
    industry: string
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'active'>('active')
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())

  const fetchNotifications = async (page: number = 1, filterType: 'all' | 'unread' | 'active' = 'active') => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        unreadOnly: (filterType === 'unread').toString(),
        excludeDismissed: (filterType === 'active').toString()
      })

      const response = await fetch(`/api/admin/notifications?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      setNotifications(data.notifications)
      setPagination(data.pagination)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Fetch notifications error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications(1, filter)
  }, [filter])

  const handleMarkAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds })
      })

      if (!response.ok) {
        throw new Error('Failed to mark as read')
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notificationIds.includes(notif.id)
            ? { ...notif, isRead: true }
            : notif
        )
      )
      setSelectedNotifications(new Set())
    } catch (err) {
      console.error('Mark as read error:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true })
      })

      if (!response.ok) {
        throw new Error('Failed to mark all as read')
      }

      // Refresh notifications
      await fetchNotifications(pagination.page, filter)
      setSelectedNotifications(new Set())
    } catch (err) {
      console.error('Mark all as read error:', err)
    }
  }

  const handleSelectNotification = (id: string) => {
    const newSelected = new Set(selectedNotifications)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedNotifications(newSelected)
  }

  const handleDismissNotifications = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds, dismiss: true })
      })

      if (!response.ok) {
        throw new Error('Failed to dismiss notifications')
      }

      // Update local state
      setNotifications(prev =>
        prev.filter(notif => !notificationIds.includes(notif.id))
      )
      setSelectedNotifications(new Set())
    } catch (err) {
      console.error('Dismiss error:', err)
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/40 to-white p-6 relative">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <motion.div
          animate={{ x: [-60, 60, -60], y: [0, 30, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute rounded-full opacity-10 left-0 top-0 w-96 h-96 blur-3xl bg-gradient-to-br from-blue-600 to-blue-400"
        />
        <motion.div
          animate={{ x: [60, -60, 60], y: [0, -30, 0] }}
          transition={{ duration: 35, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-80 h-80 rounded-full opacity-8 right-0 top-1/3 blur-3xl bg-gradient-to-br from-blue-700 to-indigo-600"
        />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">
            Notifications
          </h1>
          <p className="text-blue-700">
            Manage admin notifications and new tenant registrations
          </p>
        </div>

        {/* Filter & Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'active'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All (including dismissed)
              </button>
            </div>

            {/* Action Buttons */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Selection & Bulk Actions */}
        {selectedNotifications.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between"
          >
            <span className="text-blue-900 font-medium">
              {selectedNotifications.size} notification(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleMarkAsRead(Array.from(selectedNotifications))}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Mark as read
              </button>
              <button
                onClick={() => handleDismissNotifications(Array.from(selectedNotifications))}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="text-slate-600 mt-3">Loading notifications...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Notifications List */}
        {!loading && !error && (
          <AnimatePresence>
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative rounded-lg border transition-all ${
                      notification.isRead
                        ? 'bg-white border-slate-200'
                        : 'bg-blue-50 border-blue-200 shadow-sm'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedNotifications.has(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                      className="absolute left-4 top-4 w-5 h-5 rounded cursor-pointer"
                    />

                    <div className="pl-14 pr-4 py-4">
                      {/* Notification Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <span className="inline-block ml-2 w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                          {new Date(notification.createdAt).toLocaleDateString()}{' '}
                          {new Date(notification.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Notification Message */}
                      <p className="text-slate-700 text-sm whitespace-pre-wrap mb-3">
                        {notification.message}
                      </p>

                      {/* Tenant Info (if available) */}
                      {notification.tenant && (
                        <div className="bg-slate-100 rounded p-3 mb-3 text-sm">
                          <div className="font-medium text-slate-900 mb-1">
                            {notification.tenant.name}
                          </div>
                          <div className="text-slate-600">
                            <div>Subdomain: {notification.tenant.subdomain}</div>
                            <div>Industry: {notification.tenant.industry}</div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Link
                          href={notification.actionUrl}
                          className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          View Details
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead([notification.id])}
                            className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => handleDismissNotifications([notification.id])}
                          className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <svg
                  className="w-12 h-12 mx-auto text-slate-400 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <p className="text-slate-600 font-medium">
                  {filter === 'unread' && 'No unread notifications'}
                  {filter === 'active' && 'No active notifications'}
                  {filter === 'all' && 'No notifications yet'}
                </p>
              </div>
            )}
          </AnimatePresence>
        )}

        {/* Pagination */}
        {!loading && notifications.length > 0 && pagination.hasMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center"
          >
            <button
              onClick={() => {
                const nextPage = pagination.page + 1
                fetchNotifications(nextPage, filter)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Load more
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
