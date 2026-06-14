'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { getBrandStudioUrl } from '@/lib/getAppUrl'

interface Template {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt: string
}

export default function TemplatesPage() {
const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Log that this page mounted
    console.log('%c[TEMPLATES PAGE MOUNTED]', 'color: green; font-size: 16px; font-weight: bold')
    console.log('[TEMPLATES] Current pathname:', window.location.pathname)
    console.log('[TEMPLATES] Current URL:', window.location.href)
    document.title = 'Templates - BizCore Admin'
    
    const fetchTemplates = async () => {
      try {
        console.log('[Templates] Fetching templates from /api/admin/templates')
        const response = await fetch('/api/admin/templates')
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        const data = await response.json()
        console.log('[Templates] Data received:', data)
        setTemplates(data.templates || [])
      } catch (err) {
        console.error('[Templates] Error loading templates:', err)
        setError(err instanceof Error ? err.message : 'Failed to load templates')
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  const handleOpenInNewTab = () => {
    const studioUrl = getBrandStudioUrl()
    window.open(`${studioUrl}?admin`, '_blank')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen"
    >
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-4 transition"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <SparklesIcon className="w-8 h-8 text-pink-500" />
              Storefront Templates
            </h1>
            <p className="text-slate-600 mt-2">Manage and design your store templates</p>
          </div>
          <button
            disabled
            className="px-4 py-2 bg-slate-200 text-slate-400 border border-slate-300 rounded-lg font-medium cursor-not-allowed"
            title="BrandStudio is disabled in this build"
          >
            BrandStudio Disabled
          </button>
        </div>
      </div>

      {/* Content */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-20"
    >
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full mx-auto mb-4"
        />
        <p className="text-slate-600 font-medium">Loading templates...</p>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
        >
          Error: {error}
        </motion.div>
      )}

      {!loading && !error && templates.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-200 rounded-full mb-4">
            <SparklesIcon className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-600 font-medium">No templates yet</p>
          <p className="text-slate-500 text-sm mt-1">BrandStudio builder is deactivated in this build</p>
        </motion.div>
      )}

      {!loading && !error && templates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template, idx) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => {
                console.log('Navigating to template:', template.id)
                router.push(`/admin/brandstudio/${template.id}`)
              }}
              className="p-6 bg-white rounded-xl shadow-sm hover:shadow-lg border border-slate-200 hover:border-pink-300 cursor-pointer transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-pink-600 transition">
                    {template.name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">{template.description}</p>
                </div>
                {template.isActive && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  {new Date(template.createdAt).toLocaleDateString()}
                </span>
                <motion.div
                  whileHover={{ x: 4 }}
                  className="text-pink-600 font-medium text-sm"
                >
                  Edit →
                </motion.div>
              </div>
            </motion.div>
          ))}
      </div>
)}
    </motion.div>
  )
}



