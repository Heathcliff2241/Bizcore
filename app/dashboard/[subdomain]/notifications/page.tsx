'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Trash2, Archive, CheckCheck, Package, ShoppingCart, User, Check, X, Clock, RefreshCw, CreditCard } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useSettings } from '@/lib/settings-context';

interface NotificationsPageProps {
  params: Promise<{
    subdomain: string
  }>
}

export default function NotificationsPage({ params }: NotificationsPageProps) {
  const [subdomain, setSubdomain] = useState<string>('');
  const { settings } = useSettings();
  const theme = {
    primary: settings.brandColors.primary,
    secondary: settings.brandColors.secondary,
    accent: settings.brandColors.accent,
    background: settings.brandColors.background,
    surface: settings.brandColors.surface,
    text: settings.brandColors.text
  };

  useEffect(() => {
    params.then(p => setSubdomain(p.subdomain));
  }, [params]);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'unread' | 'read' | 'archived'>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<number>>(new Set());

  const {
    notifications,
    pagination,
    unreadCount,
    fetchNotifications,
    markAsRead,
    archive,
    deleteNotification,
  } = useNotifications(0); // No polling on this page

  useEffect(() => {
    fetchNotifications(selectedStatus);
  }, [selectedStatus, fetchNotifications]);

  const toggleSelection = (notificationId: number) => {
    const newSelection = new Set(selectedNotifications);
    if (newSelection.has(notificationId)) {
      newSelection.delete(notificationId);
    } else {
      newSelection.add(notificationId);
    }
    setSelectedNotifications(newSelection);
  };

  const handleMarkAsRead = async () => {
    const ids = Array.from(selectedNotifications);
    if (ids.length > 0) {
      await markAsRead(ids);
      setSelectedNotifications(new Set());
    }
  };

  const handleArchive = async () => {
    const ids = Array.from(selectedNotifications);
    if (ids.length > 0) {
      await archive(ids);
      setSelectedNotifications(new Set());
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { bg: '#fee2e2', text: '#991b1b' };
      case 'high':
        return { bg: '#fed7aa', text: '#9a3412' };
      case 'medium':
        return { bg: '#fef3c7', text: '#92400e' };
      case 'low':
        return { bg: '#f3f4f6', text: '#4b5563' };
      default:
        return { bg: '#f3f4f6', text: '#4b5563' };
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'low_stock':
        return { icon: 'Box', bg: '#ede9fe', text: '#6d28d9' };
      case 'new_order':
        return { icon: 'Cart', bg: '#dbeafe', text: '#0c4a6e' };
      case 'new_customer':
        return { icon: 'User', bg: '#f0fdf4', text: '#166534' };
      case 'payment_confirmed':
        return { icon: 'Check', bg: '#dcfce7', text: '#166534' };
      case 'payment_failed':
        return { icon: 'X', bg: '#fee2e2', text: '#991b1b' };
      case 'payment_expired':
        return { icon: 'Clock', bg: '#fef3c7', text: '#92400e' };
      case 'subscription_cancelled':
        return { icon: 'X', bg: '#fee2e2', text: '#991b1b' };
      case 'reactivation_requested':
        return { icon: 'Refresh', bg: '#dbeafe', text: '#0c4a6e' };
      case 'reactivation_payment_submitted':
        return { icon: 'Credit', bg: '#fef3c7', text: '#92400e' };
      case 'reactivation_payment_verified':
        return { icon: 'Check', bg: '#dcfce7', text: '#166534' };
      default:
        return { icon: 'Bell', bg: '#f3f4f6', text: '#4b5563' };
    }
  };

  const renderNotificationIcon = (iconName: string) => {
    const iconProps = { className: 'w-5 h-5' };
    switch (iconName) {
      case 'Box': return <Package {...iconProps} />;
      case 'Cart': return <ShoppingCart {...iconProps} />;
      case 'User': return <User {...iconProps} />;
      case 'Check': return <Check {...iconProps} />;
      case 'X': return <X {...iconProps} />;
      case 'Clock': return <Clock {...iconProps} />;
      case 'Refresh': return <RefreshCw {...iconProps} />;
      case 'Credit': return <CreditCard {...iconProps} />;
      default: return <Bell {...iconProps} />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (selectedStatus === 'all') return true;
    return n.status === selectedStatus;
  });

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
            {subdomain ? `${subdomain} Notifications` : 'Notifications'}
          </h2>
          <p 
            className="mt-2 text-sm"
            style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}
          >
            Stay updated on orders, inventory, and account activity for {subdomain || 'your store'}
          </p>
        </div>
      </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="p-6 bg-white border rounded-2xl shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}08, ${theme.secondary || theme.primary}08)`,
              borderColor: `${theme.primary}20`,
              boxShadow: `0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px ${theme.primary}10`
            }}
          >
            <p className="text-sm font-medium" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>Unread</p>
            <p className="text-3xl font-bold mt-2" style={{ color: theme.primary }}>
              {unreadCount}
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="p-6 bg-white border rounded-2xl shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}08, ${theme.secondary || theme.primary}08)`,
              borderColor: `${theme.primary}20`,
              boxShadow: `0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px ${theme.primary}10`
            }}
          >
            <p className="text-sm font-medium" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>Total</p>
            <p className="text-3xl font-bold mt-2" style={{ color: theme.primary }}>
              {pagination.total}
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="p-6 bg-white border rounded-2xl shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}08, ${theme.secondary || theme.primary}08)`,
              borderColor: `${theme.primary}20`,
              boxShadow: `0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px ${theme.primary}10`
            }}
          >
            <p className="text-sm font-medium" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>Read</p>
            <p className="text-3xl font-bold mt-2" style={{ color: theme.primary }}>
              {notifications.filter(n => n.status === 'read').length}
            </p>
          </motion.div>
        </motion.div>

        {/* Filters and Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-between flex-wrap gap-4 rounded-2xl border p-4 mb-6"
          style={{
            borderColor: `${theme.primary}20`,
            background: `linear-gradient(135deg, ${theme.primary}08, ${theme.secondary || theme.primary}08)`,
            boxShadow: `0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px ${theme.primary}10`
          }}
        >
          {/* Status Filter */}
          <div className="flex gap-2">
            {(['all', 'unread', 'read', 'archived'] as const).map(status => (
              <motion.button
                key={status}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  selectedStatus === status ? 'shadow-md' : ''
                }`}
                style={{
                  backgroundColor: selectedStatus === status ? theme.primary : 'transparent',
                  color: selectedStatus === status ? 'white' : theme.text,
                  border: selectedStatus === status ? 'none' : `1px solid ${theme.primary}20`,
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </motion.button>
            ))}
          </div>

          {/* Bulk Actions */}
          {selectedNotifications.size > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex gap-2"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMarkAsRead}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all text-white"
                style={{
                  backgroundColor: theme.primary,
                }}
              >
                <CheckCheck className="w-4 h-4" />
                Mark Read ({selectedNotifications.size})
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleArchive}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border"
                style={{
                  borderColor: `${theme.primary}20`,
                  color: theme.text,
                  backgroundColor: 'transparent'
                }}
              >
                <Archive className="w-4 h-4" />
                Archive
              </motion.button>
            </motion.div>
          )}
        </motion.div>

        {/* Notifications List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="space-y-3"
        >
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => {
              const typeColor = getNotificationTypeColor(notification.type);
              const priorityColor = getPriorityBadgeColor(notification.priority);
              const isSelected = selectedNotifications.has(notification.id);

              return (
                <motion.div
                  key={notification.id}
                  whileHover={{ y: -2, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`rounded-2xl p-4 border cursor-pointer transition-all backdrop-blur-xl ${
                    isSelected ? 'ring-2' : ''
                  }`}
                  style={{
                    background: notification.status === 'unread' 
                      ? `linear-gradient(135deg, ${theme.primary}12, ${theme.secondary || theme.primary}08)`
                      : `linear-gradient(135deg, ${theme.primary}04, ${theme.secondary || theme.primary}04)`,
                    borderColor: isSelected ? theme.primary : `${theme.primary}20`,
                    boxShadow: isSelected ? `0 1px 3px rgba(0,0,0,0.1), 0 0 0 1px ${theme.primary}20` : `0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px ${theme.primary}10`,
                  }}
                  onClick={() => toggleSelection(notification.id)}
                >
                  <div className="flex gap-4">
                    {/* Checkbox */}
                    <div className="flex items-start pt-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => {
                          e.stopPropagation();
                          toggleSelection(notification.id);
                        }}
                        className="w-5 h-5 rounded transition-colors cursor-pointer"
                        style={{ accentColor: theme.primary }}
                      />
                    </div>

                    {/* Icon & Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        {/* Type Icon */}
                        <div
                          className="text-xl p-2 rounded-xl flex-shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: typeColor.bg }}
                        >
                          {renderNotificationIcon(typeColor.icon)}
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className="font-semibold" style={{ color: theme.text }}>
                              {notification.title}
                            </h3>
                            {notification.status === 'unread' && (
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: theme.primary }}
                              />
                            )}
                          </div>

                          <p className="text-sm text-slate-600 mb-2">
                            {notification.message}
                          </p>

                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs px-2 py-1 rounded font-medium"
                              style={{
                                backgroundColor: priorityColor.bg,
                                color: priorityColor.text,
                              }}
                            >
                              {notification.priority.toUpperCase()}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                              {new Date(notification.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1 flex-shrink-0">
                      {notification.status === 'unread' && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={async e => {
                            e.stopPropagation();
                            await markAsRead([notification.id]);
                          }}
                          className="p-2 rounded-lg transition-colors"
                          style={{ backgroundColor: `${theme.primary}10` }}
                          title="Mark as read"
                        >
                          <CheckCheck className="w-4 h-4" style={{ color: theme.primary }} />
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={async e => {
                          e.stopPropagation();
                          await deleteNotification(notification.id);
                        }}
                        className="p-2 rounded-lg transition-colors"
                        style={{ backgroundColor: '#fee2e2' }}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 rounded-2xl border"
              style={{
                borderColor: `${theme.primary}20`,
                backgroundColor: `${theme.primary}04`
              }}
            >
              <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: `${theme.primary}30` }} />
              <p className="font-medium" style={{ color: theme.text }}>No notifications yet</p>
              <p className="text-sm mt-1" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>
                You&apos;ll see updates about orders, inventory, and account activity here
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.main>
    );
  }
