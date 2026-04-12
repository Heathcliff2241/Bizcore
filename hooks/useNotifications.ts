import { useState, useEffect, useCallback } from 'react';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  createdAt: string;
  readAt?: string;
  metadata?: Record<string, unknown>;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Hook to manage tenant notifications
 * Handles fetching, marking as read, and archiving
 */
export function useNotifications(pollInterval = 30000) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(
    async (status: 'all' | 'unread' | 'read' | 'archived' = 'unread', offset = 0) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          status,
          limit: '20',
          offset: offset.toString(),
        });

        const response = await fetch(`/api/tenant/notifications?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();
        setNotifications(data.notifications);
        setPagination(data.pagination);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('[useNotifications] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const markAsRead = useCallback(async (notificationIds: number[]) => {
    try {
      const response = await fetch('/api/tenant/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationIds: notificationIds.map(id => id.toString()),
          action: 'read',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notificationIds.includes(notif.id)
            ? { ...notif, status: 'read', readAt: new Date().toISOString() }
            : notif
        )
      );
    } catch (err) {
      console.error('[useNotifications] Mark as read error:', err);
    }
  }, []);

  const archive = useCallback(async (notificationIds: number[]) => {
    try {
      const response = await fetch('/api/tenant/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationIds: notificationIds.map(id => id.toString()),
          action: 'archive',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to archive');
      }

      // Remove from local state
      setNotifications(prev =>
        prev.filter(notif => !notificationIds.includes(notif.id))
      );
      setPagination(prev => ({
        ...prev,
        total: Math.max(0, prev.total - notificationIds.length),
      }));
    } catch (err) {
      console.error('[useNotifications] Archive error:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      const response = await fetch(`/api/tenant/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      setNotifications(prev =>
        prev.filter(notif => notif.id !== notificationId)
      );
    } catch (err) {
      console.error('[useNotifications] Delete error:', err);
    }
  }, []);

  // Setup polling
  useEffect(() => {
    fetchNotifications('unread');

    if (pollInterval > 0) {
      const interval = setInterval(() => {
        fetchNotifications('unread');
      }, pollInterval);

      return () => clearInterval(interval);
    }
  }, [fetchNotifications, pollInterval]);

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return {
    notifications,
    pagination,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    archive,
    deleteNotification,
  };
}
