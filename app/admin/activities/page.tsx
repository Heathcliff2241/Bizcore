'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import {
  FolderIcon,
  DocumentIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  CheckCircleIcon,
  DocumentPlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  UserPlusIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { PageWrapper } from '@/components/PageWrapper';

interface ActivityUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

interface ActivityTenant {
  id: number;
  name: string;
  subdomain: string;
}

interface Activity {
  id: number;
  action: string;
  details?: Record<string, unknown>;
  createdAt: string;
  user?: ActivityUser;
  tenant?: ActivityTenant;
  userId?: number;
  tenantId?: number;
}

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/activities?limit=200');
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
    const iconClasses = 'w-5 h-5';
    
    switch (action) {
      case 'TENANT_CREATED':
      case 'TENANT_UPDATED':
        return <FolderIcon className={`${iconClasses} text-blue-500`} />;
      case 'TENANT_DELETED':
        return <TrashIcon className={`${iconClasses} text-red-500`} />;
      case 'TENANT_LOGIN':
      case 'CUSTOMER_LOGIN':
        return <CheckIcon className={`${iconClasses} text-green-500`} />;
      case 'TENANT_LOGOUT':
      case 'CUSTOMER_LOGOUT':
        return <CheckIcon className={`${iconClasses} text-amber-500`} />;
      case 'PAGE_CREATED':
        return <DocumentPlusIcon className={`${iconClasses} text-green-500`} />;
      case 'PAGE_UPDATED':
      case 'PAGE_DESIGN_UPDATED':
        return <PencilIcon className={`${iconClasses} text-blue-500`} />;
      case 'PAGE_PUBLISHED':
        return <CheckCircleIcon className={`${iconClasses} text-green-500`} />;
      case 'PAGE_DELETED':
        return <TrashIcon className={`${iconClasses} text-red-500`} />;
      case 'PRODUCT_CREATED':
        return <DocumentPlusIcon className={`${iconClasses} text-purple-500`} />;
      case 'PRODUCT_UPDATED':
        return <PencilIcon className={`${iconClasses} text-purple-500`} />;
      case 'PRODUCT_DELETED':
        return <TrashIcon className={`${iconClasses} text-red-500`} />;
      case 'ORDER_CREATED':
        return <ShoppingCartIcon className={`${iconClasses} text-indigo-500`} />;
      case 'ORDER_COMPLETED':
        return <CheckIcon className={`${iconClasses} text-green-500`} />;
      case 'ORDER_CANCELED':
        return <TrashIcon className={`${iconClasses} text-red-500`} />;
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_VERIFIED':
        return <CreditCardIcon className={`${iconClasses} text-emerald-500`} />;
      case 'CUSTOMER_SIGNUP':
      case 'USER_SIGNUP':
        return <UserPlusIcon className={`${iconClasses} text-cyan-500`} />;
      case 'USER_LOGIN':
        return <CheckIcon className={`${iconClasses} text-green-500`} />;
      case 'TENANT_SUBSCRIPTION_UPDATED':
        return <BellIcon className={`${iconClasses} text-amber-500`} />;
      default:
        return <DocumentIcon className={`${iconClasses} text-gray-500`} />;
    }
  };

  const getActivityLabel = (action: string) => {
    const labels: Record<string, string> = {
      TENANT_CREATED: 'Tenant Created',
      TENANT_UPDATED: 'Tenant Updated',
      TENANT_DELETED: 'Tenant Deleted',
      TENANT_SIGNUP: 'Tenant Signed Up',
      TENANT_LOGIN: 'Tenant Logged In',
      TENANT_LOGOUT: 'Tenant Logged Out',
      TENANT_SUBSCRIPTION_UPDATED: 'Subscription Updated',
      TENANT_SUBSCRIPTION_CANCELED: 'Subscription Canceled',
      PAGE_CREATED: 'Page Created',
      PAGE_UPDATED: 'Page Updated',
      PAGE_DELETED: 'Page Deleted',
      PAGE_PUBLISHED: 'Page Published',
      PAGE_DESIGN_UPDATED: 'Page Design Updated',
      PRODUCT_CREATED: 'Product Created',
      PRODUCT_UPDATED: 'Product Updated',
      PRODUCT_DELETED: 'Product Deleted',
      ORDER_CREATED: 'Order Created',
      ORDER_UPDATED: 'Order Updated',
      ORDER_COMPLETED: 'Order Completed',
      ORDER_CANCELED: 'Order Canceled',
      PAYMENT_RECEIVED: 'Payment Received',
      PAYMENT_VERIFIED: 'Payment Verified',
      CUSTOMER_SIGNUP: 'Customer Signed Up',
      CUSTOMER_SIGNIN: 'Customer Signed In',
      CUSTOMER_SIGNIN_FAILED: 'Customer Sign-in Failed',
      CUSTOMER_LOGIN: 'Customer Logged In',
      CUSTOMER_LOGOUT: 'Customer Logged Out',
      USER_SIGNIN: 'User Signed In',
      USER_SIGNIN_FAILED: 'User Sign-in Failed',
      USER_LOGIN: 'User Logged In',
      USER_LOGOUT: 'User Logged Out',
      USER_SIGNUP: 'User Signed Up',
      USER_CREATED: 'User Created',
      USER_UPDATED: 'User Updated',
      EMPLOYEE_CREATED: 'Employee Created',
      EMPLOYEE_UPDATED: 'Employee Updated',
      EMPLOYEE_DELETED: 'Employee Deleted',
      SETTINGS_UPDATED: 'Settings Updated',
    };
    return labels[action] || action.replace(/_/g, ' ');
  };

  const filteredActivities = filter === 'all' 
    ? activities 
    : filter === 'TENANT'
      ? activities.filter(a => a.tenantId !== null && a.tenantId !== undefined)
      : activities.filter(a => a.action.startsWith(filter));

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const actionGroups = [
    { value: 'all', label: 'All Activities' },
    { value: 'TENANT', label: 'Tenant Activities' },
    { value: 'USER', label: 'User Activities' },
    { value: 'CUSTOMER', label: 'Customer Activities' },
    { value: 'PAGE', label: 'Page Activities' },
    { value: 'PRODUCT', label: 'Product Activities' },
    { value: 'ORDER', label: 'Order Activities' },
    { value: 'PAYMENT', label: 'Payment Activities' },
  ];

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/40 to-white py-8 px-4 md:px-8 relative">
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-blue-900">Activity Log</h1>
            <p className="text-blue-700 mt-1">Track all system activities and user actions</p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 bg-white border border-blue-100/60 rounded-lg p-4 backdrop-blur-sm"
          >
            <div className="flex flex-wrap gap-2">
              {actionGroups.map((group) => (
                <motion.button
                  key={group.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleFilterChange(group.value)}
                  className={`px-3 md:px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    filter === group.value
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  {group.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Activities List - Table Format */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-blue-100/60 rounded-lg overflow-hidden"
          >
            {loading ? (
              <div className="p-8 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
                />
                <p className="text-blue-700 font-medium">Loading activities...</p>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-blue-700 font-medium">No activities found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-blue-50 border-b border-blue-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-blue-900">Action</th>
                      <th className="px-4 py-3 text-left font-semibold text-blue-900">User</th>
                      <th className="px-4 py-3 text-left font-semibold text-blue-900">Tenant</th>
                      <th className="px-4 py-3 text-left font-semibold text-blue-900">When</th>
                      <th className="px-4 py-3 text-left font-semibold text-blue-900">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100">
                    <AnimatePresence mode="popLayout">
                      {paginatedActivities.map((activity, index) => (
                        <motion.tr
                          key={activity.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-blue-50/50 transition-colors group"
                        >
                          {/* Action */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                {getActivityIcon(activity.action)}
                              </div>
                              <span className="font-medium text-blue-900">
                                {getActivityLabel(activity.action)}
                              </span>
                            </div>
                          </td>

                          {/* User */}
                          <td className="px-4 py-3">
                            {activity.user ? (
                              <div>
                                <p className="font-medium text-blue-900">
                                  {activity.user.firstName} {activity.user.lastName}
                                </p>
                                <p className="text-xs text-blue-600">{activity.user.email}</p>
                              </div>
                            ) : (
                              <span className="text-blue-500 text-xs">System</span>
                            )}
                          </td>

                          {/* Tenant */}
                          <td className="px-4 py-3">
                            {activity.tenant ? (
                              <span className="inline-block px-2 py-1 bg-blue-100 rounded text-xs text-blue-800 border border-blue-200">
                                {activity.tenant.name}
                              </span>
                            ) : (
                              <span className="text-blue-500 text-xs">—</span>
                            )}
                          </td>

                          {/* When */}
                          <td className="px-4 py-3 text-blue-600 whitespace-nowrap">
                            <div className="text-xs">
                              <p>{format(new Date(activity.createdAt), 'MMM dd, yyyy')}</p>
                              <p className="text-blue-500 text-xs">
                                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </td>

                          {/* Details */}
                          <td className="px-4 py-3">
                            {activity.details && Object.keys(activity.details).length > 0 ? (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedActivityId(activity.id)}
                                className="flex items-center gap-2 text-blue-700 hover:text-blue-900 select-none font-medium text-xs bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                              >
                                <span>▶</span>
                                <span>{Object.keys(activity.details).length} changes</span>
                              </motion.button>
                            ) : (
                              <span className="text-blue-500 text-xs">—</span>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && filteredActivities.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t border-blue-100 bg-blue-50/30">
                <p className="text-xs text-blue-700">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredActivities.length)} of {filteredActivities.length} activities
                </p>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                  >
                    Previous
                  </motion.button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let page;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      return (
                        <motion.button
                          key={page}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handlePageChange(page)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {page}
                        </motion.button>
                      );
                    })}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                  >
                    Next
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Summary */}
          {!loading && filteredActivities.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 p-4 bg-blue-50/60 border border-blue-100/60 rounded-lg text-center"
            >
              <p className="text-blue-800">
                Showing <strong>{filteredActivities.length}</strong> activities
              </p>
            </motion.div>
          )}

          {/* Details Modal */}
          <AnimatePresence>
            {selectedActivityId !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedActivityId(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(() => {
                    const activity = activities.find(a => a.id === selectedActivityId);
                    return activity ? (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-blue-900">Activity Details</h3>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedActivityId(null)}
                            className="text-blue-500 hover:text-blue-700 text-xl"
                          >
                            ✕
                          </motion.button>
                        </div>
                        <div className="space-y-3">
                          <div className="border-b border-blue-100 pb-3">
                            <p className="text-xs text-blue-600 font-semibold">Action</p>
                            <p className="text-sm text-blue-900 mt-1">{getActivityLabel(activity.action)}</p>
                          </div>
                          {activity.user && (
                            <div className="border-b border-blue-100 pb-3">
                              <p className="text-xs text-blue-600 font-semibold">User</p>
                              <p className="text-sm text-blue-900 mt-1">{activity.user.firstName} {activity.user.lastName}</p>
                              <p className="text-xs text-blue-600 mt-1">{activity.user.email}</p>
                            </div>
                          )}
                          {activity.tenant && (
                            <div className="border-b border-blue-100 pb-3">
                              <p className="text-xs text-blue-600 font-semibold">Tenant</p>
                              <p className="text-sm text-blue-900 mt-1">{activity.tenant.name}</p>
                            </div>
                          )}
                          <div className="border-b border-blue-100 pb-3">
                            <p className="text-xs text-blue-600 font-semibold">Timestamp</p>
                            <p className="text-sm text-blue-900 mt-1">{format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm:ss')}</p>
                          </div>
                          {activity.details && Object.keys(activity.details).length > 0 && (
                            <div>
                              <p className="text-xs text-blue-600 font-semibold mb-2">Changes</p>
                              <div className="space-y-2 bg-blue-50 p-3 rounded-lg max-h-64 overflow-y-auto">
                                {Object.entries(activity.details).map(([key, value]) => {
                                  const readableKey = key
                                    .replace(/([A-Z])/g, ' $1')
                                    .replace(/^./, (str) => str.toUpperCase())
                                    .trim();

                                  let displayValue = '';
                                  if (value === null) {
                                    displayValue = '—';
                                  } else if (typeof value === 'boolean') {
                                    displayValue = value ? '✓ Yes' : '✗ No';
                                  } else if (typeof value === 'object') {
                                    displayValue = JSON.stringify(value, null, 2);
                                  } else {
                                    displayValue = String(value);
                                  }

                                  return (
                                    <div key={key} className="text-xs">
                                      <span className="text-blue-600 font-medium">{readableKey}:</span>
                                      <span className="text-blue-800 ml-2 break-words block mt-1 whitespace-pre-wrap font-mono text-xs">{displayValue}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageWrapper>
  );
}
