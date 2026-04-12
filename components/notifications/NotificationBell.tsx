'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck, Package, ShoppingCart, User, Check, Clock } from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';

interface NotificationBellProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  theme?: any;
}

export function NotificationBell({ theme = {} }: NotificationBellProps) {
  const params = useParams();
  const subdomain = Array.isArray(params.subdomain)
    ? params.subdomain[0]
    : params.subdomain || '';

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead } = useNotifications(30000);

  const primaryColor = theme.primary || '#10B981';
  const textColor = theme.text || '#111827';
  const surfaceColor = theme.surface || '#f9fafb';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status === 'unread') {
      await markAsRead([notification.id]);
    }

    if (notification.actionUrl) {
      // Navigation will happen through Link
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications
      .filter(n => n.status === 'unread')
      .map(n => n.id);

    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  };

  const recentNotifications = notifications.slice(0, 5);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#dc2626';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#eab308';
      case 'low':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return 'Box';
      case 'new_order':
        return 'Cart';
      case 'new_customer':
        return 'User';
      case 'payment_confirmed':
        return 'Check';
      case 'payment_failed':
        return 'X';
      case 'payment_expired':
        return 'Clock';
      default:
        return 'Bell';
    }
  };

  const renderNotificationIcon = (iconName: string) => {
    const iconProps = { className: 'w-4 h-4' };
    switch (iconName) {
      case 'Box': return <Package {...iconProps} />;
      case 'Cart': return <ShoppingCart {...iconProps} />;
      case 'User': return <User {...iconProps} />;
      case 'Check': return <Check {...iconProps} />;
      case 'X': return <X {...iconProps} />;
      case 'Clock': return <Clock {...iconProps} />;
      default: return <Bell {...iconProps} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 sm:p-2.5 rounded-lg hover:bg-slate-100 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell
          className="w-5 h-5 sm:w-6 sm:h-6"
          style={{ color: textColor }}
        />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span
            className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full text-white text-[10px] sm:text-xs font-bold flex items-center justify-center"
            style={{ backgroundColor: primaryColor }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm rounded-lg shadow-lg border z-50"
            style={{ backgroundColor: surfaceColor, borderColor: `${primaryColor}20` }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-3 sm:p-4 border-b"
              style={{ borderColor: `${primaryColor}20` }}
            >
              <h3 className="text-sm sm:text-base font-semibold" style={{ color: textColor }}>
                Notifications
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 sm:p-2 hover:bg-slate-200 rounded transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: textColor }} />
              </button>
            </div>

            {/* Notifications List */}
            {recentNotifications.length > 0 ? (
              <>
                <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                  {recentNotifications.map(notification => (
                    <Link
                      key={notification.id}
                      href={notification.actionUrl || '#'}
                      onClick={() => handleNotificationClick(notification)}
                      className="block"
                    >
                      <motion.div
                        whileHover={{ backgroundColor: `${primaryColor}08` }}
                        className={`p-3 sm:p-4 border-b cursor-pointer transition-colors touch-manipulation ${
                          notification.status === 'unread'
                            ? 'bg-blue-50'
                            : ''
                        }`}
                        style={{
                          borderColor: `${primaryColor}20`,
                          backgroundColor:
                            notification.status === 'unread'
                              ? `${primaryColor}10`
                              : 'transparent',
                        }}
                      >
                        <div className="flex gap-2 sm:gap-3">
                          {/* Icon */}
                          <div className="text-lg sm:text-xl flex items-center justify-center flex-shrink-0">
                            {renderNotificationIcon(getNotificationIcon(notification.type))}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-xs sm:text-sm break-words" style={{ color: textColor }}>
                                {notification.title}
                              </h4>
                              {notification.status === 'unread' && (
                                <div
                                  className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                                  style={{ backgroundColor: primaryColor }}
                                />
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mt-1 break-words">
                              {notification.message}
                            </p>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          {/* Priority Dot */}
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                            style={{
                              backgroundColor: getPriorityColor(notification.priority),
                            }}
                          />
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>

                {/* Footer */}
                <div
                  className="p-2 sm:p-3 border-t flex gap-2"
                  style={{ borderColor: `${primaryColor}20` }}
                >
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded text-xs sm:text-sm font-medium transition-colors hover:opacity-80 touch-manipulation min-h-[44px]"
                    style={{
                      backgroundColor: `${primaryColor}20`,
                      color: primaryColor,
                    }}
                  >
                    <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Mark as read</span>
                    <span className="sm:hidden">Read</span>
                  </button>
                  <Link
                    href={`/dashboard/${subdomain}/notifications`}
                    className="flex-1 px-2 sm:px-3 py-2 rounded text-xs sm:text-sm font-medium text-center transition-colors touch-manipulation min-h-[44px] flex items-center justify-center"
                    style={{
                      backgroundColor: primaryColor,
                      color: 'white',
                    }}
                  >
                    View All
                  </Link>
                </div>
              </>
            ) : (
              <div className="p-6 sm:p-8 text-center">
                <Bell className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-slate-300 mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm text-slate-500">
                  You&apos;re all caught up!
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
