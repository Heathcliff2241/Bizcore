'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  DocumentPlusIcon,
  PencilIcon,
  CheckIcon,
  TrashIcon,
  FolderIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface ActivityUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface ActivityTenant {
  id: number;
  name: string;
  subdomain: string;
}

interface Activity {
  id: number;
  action: string;
  createdAt: string;
  user?: ActivityUser;
  tenant?: ActivityTenant;
}

export function RecentActivityWidget() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/admin/activities?limit=5');
      const data = await response.json();
      if (response.ok) {
        setActivities(data.activities);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action: string) => {
    const classes = 'w-4 h-4';
    switch (action) {
      case 'PAGE_CREATED':
        return <DocumentPlusIcon className={`${classes} text-green-400`} />;
      case 'PAGE_UPDATED':
      case 'PAGE_DESIGN_UPDATED':
        return <PencilIcon className={`${classes} text-blue-400`} />;
      case 'PAGE_PUBLISHED':
        return <CheckIcon className={`${classes} text-emerald-400`} />;
      case 'PAGE_DELETED':
        return <TrashIcon className={`${classes} text-red-400`} />;
      case 'TENANT_CREATED':
      case 'TENANT_UPDATED':
        return <FolderIcon className={`${classes} text-blue-400`} />;
      case 'ORDER_CREATED':
        return <ShoppingCartIcon className={`${classes} text-indigo-400`} />;
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_VERIFIED':
        return <CreditCardIcon className={`${classes} text-emerald-400`} />;
      default:
        return <DocumentPlusIcon className={`${classes} text-gray-400`} />;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      PAGE_CREATED: 'Page Created',
      PAGE_UPDATED: 'Page Updated',
      PAGE_PUBLISHED: 'Page Published',
      PAGE_DELETED: 'Page Deleted',
      PAGE_DESIGN_UPDATED: 'Design Updated',
      TENANT_CREATED: 'Tenant Created',
      TENANT_UPDATED: 'Tenant Updated',
      ORDER_CREATED: 'Order Created',
      PAYMENT_RECEIVED: 'Payment Received',
      PAYMENT_VERIFIED: 'Payment Verified',
    };
    return labels[action] || action.replace(/_/g, ' ');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-blue-100/60 p-6 shadow-sm backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-blue-900">Recent Activity</h3>
        <Link href="/admin/activities">
          <button className="text-blue-600 hover:text-blue-700 transition flex items-center gap-1 text-sm font-medium">
            View All <ArrowRightIcon className="w-4 h-4" />
          </button>
        </Link>
      </div>

      {loading ? (
        <div className="py-8 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full mx-auto"
          ></motion.div>
          <p className="text-blue-700 text-sm mt-3 font-medium">Loading activities...</p>
        </div>
      ) : activities.length === 0 ? (
        <p className="text-blue-700 text-sm py-8 text-center font-medium">No recent activities</p>
      ) : (
        <div className="space-y-2">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50/50 transition group"
            >
              <div className="flex-shrink-0 p-2 bg-blue-50 rounded group-hover:bg-blue-100 transition-colors">
                {getActivityIcon(activity.action)}
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-sm font-medium text-blue-900">
                  {getActionLabel(activity.action)}
                </p>
                <p className="text-xs text-blue-700">
                  {activity.user && `${activity.user.firstName} ${activity.user.lastName}`}
                  {activity.tenant && ` • ${activity.tenant.name}`}
                </p>
              </div>
              <div className="text-xs text-blue-600 flex-shrink-0 whitespace-nowrap">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
