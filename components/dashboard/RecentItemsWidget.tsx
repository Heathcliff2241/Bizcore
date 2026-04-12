'use client'

import { useRecentItems, RecentItem } from '@/hooks/useRecentItems'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  ClockIcon,
  ShoppingBagIcon,
  CubeIcon,
  UserIcon,
  XMarkIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline'

interface RecentItemsWidgetProps {
  subdomain?: string
  theme?: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
  }
}

const defaultTheme = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  accent: '#ec4899',
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#111827',
}

const iconMap = {
  order: ShoppingBagIcon,
  product: CubeIcon,
  customer: UserIcon,
  tenant: BuildingOfficeIcon,
}

const colorMap = {
  order: {
    bg: '#dbeafe',
    text: '#1e40af',
  },
  product: {
    bg: '#fce7f3',
    text: '#be185d',
  },
  customer: {
    bg: '#d1fae5',
    text: '#065f46',
  },
  tenant: {
    bg: '#f3e8ff',
    text: '#7c3aed',
  },
}

export function RecentItemsWidget({ subdomain, theme = defaultTheme }: RecentItemsWidgetProps) {
  const { recentItems, removeRecentItem, clearRecentItems } = useRecentItems(subdomain)

  if (recentItems.length === 0) {
    return null // Don't show widget if no recent items
  }

  const isAdminTheme = theme.primary === '#3b82f6' // Detect admin theme

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div 
            className={`p-2 ${isAdminTheme ? 'rounded-lg bg-blue-50 border border-blue-200' : 'rounded-lg'}`}
            style={!isAdminTheme ? { backgroundColor: `${theme.primary}15` } : {}}
          >
            <ClockIcon 
              className="w-5 h-5" 
              style={{ color: isAdminTheme ? '#3b82f6' : theme.primary }} 
            />
          </div>
          <div>
            <h3 
              className={`${isAdminTheme ? 'text-lg font-bold text-blue-900' : 'text-xl font-bold'}`}
              style={!isAdminTheme ? { color: theme.text } : {}}
            >
              Recent Items
            </h3>
            {isAdminTheme && (
              <p className="text-sm text-blue-600">Quick access to your recent work</p>
            )}
          </div>
        </div>
        {recentItems.length > 0 && (
          <button
            onClick={clearRecentItems}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 ${
              isAdminTheme 
                ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                : 'transition-colors'
            }`}
            style={!isAdminTheme ? {
              color: `${theme.text}99`,
              backgroundColor: `${theme.primary}08`,
            } : {}}
            onMouseEnter={(e) => {
              if (!isAdminTheme) {
                e.currentTarget.style.backgroundColor = `${theme.primary}15`
              }
            }}
            onMouseLeave={(e) => {
              if (!isAdminTheme) {
                e.currentTarget.style.backgroundColor = `${theme.primary}08`
              }
            }}
          >
            Clear All
          </button>
        )}
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 ${isAdminTheme ? 'gap-4' : 'gap-3'}`}>
        <AnimatePresence mode="popLayout">
          {recentItems.map((item, index) => {
            const Icon = iconMap[item.type]
            const colors = colorMap[item.type]

            return (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <Link href={item.url}>
                  <motion.div
                    whileHover={
                      isAdminTheme 
                        ? { y: -6, boxShadow: '0 20px 40px rgba(59, 130, 246, 0.12)' }
                        : { y: -4, scale: 1.02 }
                    }
                    transition={
                      isAdminTheme
                        ? { duration: 0.3 }
                        : { type: 'spring', stiffness: 300, damping: 20 }
                    }
                    className={`relative ${isAdminTheme ? 'p-5 rounded-2xl' : 'p-4 rounded-xl'} border backdrop-blur-sm group cursor-pointer transition-all duration-300`}
                    style={
                      isAdminTheme
                        ? {
                            backgroundColor: 'white',
                            borderColor: 'rgb(219 234 254 / 0.6)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                          }
                        : {
                            backgroundColor: theme.surface,
                            borderColor: `${theme.primary}20`,
                            boxShadow: `0 1px 3px rgba(0,0,0,0.05)`,
                          }
                    }
                  >
                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        removeRecentItem(item.id, item.type)
                      }}
                      className={`absolute ${isAdminTheme ? 'top-3 right-3' : 'top-2 right-2'} p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200`}
                      style={
                        isAdminTheme
                          ? {
                              backgroundColor: 'rgb(239 246 255)',
                              color: '#3b82f6',
                            }
                          : {
                              backgroundColor: `${theme.primary}10`,
                              color: theme.primary,
                            }
                      }
                      onMouseEnter={(e) => {
                        if (isAdminTheme) {
                          e.currentTarget.style.backgroundColor = 'rgb(219 234 254)'
                        } else {
                          e.currentTarget.style.backgroundColor = `${theme.primary}20`
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isAdminTheme) {
                          e.currentTarget.style.backgroundColor = 'rgb(239 246 255)'
                        } else {
                          e.currentTarget.style.backgroundColor = `${theme.primary}10`
                        }
                      }}
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>

                    {/* Icon */}
                    <div
                      className={`${isAdminTheme ? 'w-12 h-12 rounded-xl' : 'w-10 h-10 rounded-lg'} flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110`}
                      style={{
                        backgroundColor: colors.bg,
                      }}
                    >
                      <Icon className={isAdminTheme ? 'w-6 h-6' : 'w-5 h-5'} style={{ color: colors.text }} />
                    </div>

                    {/* Content */}
                    <div className="space-y-1.5">
                      <p
                        className={`${isAdminTheme ? 'text-sm font-bold text-blue-900' : 'text-sm font-semibold'} truncate transition-colors group-hover:${isAdminTheme ? 'text-blue-700' : ''}`}
                        style={!isAdminTheme ? { color: theme.text } : {}}
                      >
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p
                          className={`text-xs truncate ${isAdminTheme ? 'text-blue-600' : ''}`}
                          style={!isAdminTheme ? { color: `${theme.text}70` } : {}}
                        >
                          {item.subtitle}
                        </p>
                      )}
                      <p
                        className={`text-xs capitalize font-semibold ${isAdminTheme ? 'text-blue-500' : ''}`}
                        style={!isAdminTheme ? { color: colors.text } : {}}
                      >
                        {item.type}
                      </p>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

