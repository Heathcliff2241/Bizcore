'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export interface Tab {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  component: React.ComponentType<Record<string, unknown>>
}

interface TabbedLayoutProps {
  tabs: Tab[]
  defaultTab?: string
  onTabChange?: (tabId: string) => void
  className?: string
}

export default function TabbedLayout({
  tabs,
  defaultTab,
  onTabChange,
  className = ''
}: TabbedLayoutProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '')

  // Sync with URL params on mount and when they change
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && tabs.some(t => t.id === tabParam)) {
      setActiveTab(tabParam)
    } else if (!activeTab && tabs.length > 0) {
      setActiveTab(defaultTab || tabs[0].id)
    }
  }, [searchParams, tabs, defaultTab, activeTab])

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    
    // Update URL with tab parameter
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.push(`?${params.toString()}`, { scroll: false })
    
    // Call callback if provided
    onTabChange?.(tabId)
  }

  const activeTabData = tabs.find(t => t.id === activeTab)
  const ActiveComponent = activeTabData?.component

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 px-2 sm:px-4 md:px-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  relative px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm transition-colors duration-200
                  flex items-center gap-1.5 sm:gap-2 flex-shrink-0 touch-manipulation
                  ${isActive
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {Icon && <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                <span className="whitespace-nowrap">{tab.label}</span>
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t"
                    initial={false}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full"
      >
        {ActiveComponent ? (
          <ActiveComponent />
        ) : (
          <div className="p-8 text-center text-gray-500">
            No tab selected
          </div>
        )}
      </motion.div>
    </div>
  )
}
