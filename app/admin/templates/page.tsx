'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeftIcon, SparklesIcon, XMarkIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline'
import { PageRenderer } from '@/components/storefront/PageRenderer'
import { CartProvider } from '@/components/storefront/hooks/useCart'
import { PreviewModeWrapper } from './PreviewModeWrapper'
import { getBrandStudioUrl } from '@/lib/getAppUrl'
import type { StorefrontContext } from '@/components/storefront/types'

interface Component {
  id: string
  type: string
  props: Record<string, unknown>
  position?: { x: number; y: number }
  size?: { width: number; height: number }
  zIndex?: number
  hidden?: boolean
  children?: Component[]
  [key: string]: unknown
}

interface Template {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt: string
  createdBy?: string
  content?: string
}

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [previewComponents, setPreviewComponents] = useState<Component[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', isActive: true })
  const [editSaving, setEditSaving] = useState(false)
  const [editSuccess, setEditSuccess] = useState(false)

  useEffect(() => {
    document.title = 'Templates - BizCore Admin'
    
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/admin/templates')
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        const data = await response.json()
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

  const handleOpenPreview = (template: Template) => {
    setPreviewTemplate(template)
    if (template.content) {
      try {
        const parsed = JSON.parse(template.content) as unknown
        const componentsWithIds = (Array.isArray(parsed) ? parsed : []).map((comp: unknown, idx: number) => {
          const component = comp as Record<string, unknown>
          return {
            id: (component.id as string) || `component-${idx}`,
            type: (component.type as string) || '',
            props: (component.props as Record<string, unknown>) || {},
            position: component.position as { x: number; y: number } | undefined,
            size: component.size as { width: number; height: number } | undefined,
            zIndex: component.zIndex as number | undefined,
            hidden: component.hidden as boolean | undefined,
            children: component.children as Component[] | undefined
          }
        })
        setPreviewComponents(componentsWithIds)
      } catch {
        setPreviewComponents([])
      }
    }
    setPreviewOpen(true)
  }

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template)
    setEditForm({
      name: template.name,
      description: template.description,
      isActive: template.isActive
    })
  }

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return
    
    try {
      setEditSaving(true)
      const response = await fetch(`/api/admin/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          content: editingTemplate.content || '',
        }),
      })

      if (response.ok) {
        // Update templates list
        setTemplates(templates.map(t => 
          t.id === editingTemplate.id 
            ? { ...t, ...editForm }
            : t
        ))
        setEditSuccess(true)
        setTimeout(() => {
          setEditSuccess(false)
          setEditingTemplate(null)
        }, 2000)
      }
    } catch (error) {
      console.error('Error saving template:', error)
    } finally {
      setEditSaving(false)
    }
  }

  const handleOpenBrandStudio = () => {
    const studioUrl = getBrandStudioUrl()
    window.open(`${studioUrl}?admin`, '_blank')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col bg-gradient-to-br from-white via-blue-50/40 to-white min-h-screen overflow-x-hidden relative"
    >
      {/* Dark blue gradient accent overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-transparent to-indigo-900" />
      </div>

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

      {/* Header */}
      <div className="relative p-8 border-b border-blue-100/50">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              Storefront Templates
            </h1>
            <p className="text-blue-700 mt-2">Create and manage your store templates</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenBrandStudio}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg font-semibold hover:from-blue-500 hover:to-indigo-600 transition shadow-lg hover:shadow-blue-500/40"
          >
            Edit in BrandStudio ↗
          </motion.button>
        </div>
      </div>

      {/* Content Area - Card Grid */}
      <div className="relative flex-1 p-8 overflow-y-auto z-10">
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
                className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-blue-700 font-medium">Loading templates...</p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 max-w-2xl mx-auto"
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
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 border border-blue-200 rounded-full mb-6">
              <SparklesIcon className="w-10 h-10 text-blue-600" />
            </div>
            <p className="text-blue-900 font-medium text-lg">No templates yet</p>
            <p className="text-blue-700 text-sm mt-1">Create your first template to get started</p>
          </motion.div>
        )}

        {!loading && !error && templates.length > 0 && (
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template, idx) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group bg-white border border-blue-100/50 hover:border-blue-200 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10"
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-blue-100/50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-blue-900 group-hover:text-blue-600 transition">
                          {template.name}
                        </h3>
                        <p className="text-sm text-blue-700 mt-1 line-clamp-2">{template.description}</p>
                      </div>
                      {template.isActive && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-200 ml-2 flex-shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-6 py-4 space-y-3">
                    {template.createdBy && (
                      <p className="text-xs text-blue-600">by {template.createdBy}</p>
                    )}
                    <p className="text-xs text-blue-600">
                      Created {new Date(template.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Card Footer - Actions */}
                  <div className="px-6 py-4 bg-blue-50/50 border-t border-blue-100/50 flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOpenPreview(template)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-medium transition-colors shadow-sm"
                    >
                      <EyeIcon className="w-4 h-4" />
                      Preview
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleEditTemplate(template)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Edit
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full Page Preview Modal */}
      <AnimatePresence>
        {previewOpen && previewTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full h-5/6 max-w-5xl overflow-hidden flex flex-col border border-blue-100/50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-blue-100/50 flex items-center justify-between bg-gradient-to-r from-white to-blue-50/30">
                <div>
                  <h2 className="text-2xl font-bold text-blue-900">{previewTemplate.name}</h2>
                  <p className="text-blue-700 text-sm mt-1">{previewTemplate.description}</p>
                </div>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="p-2 hover:bg-blue-100 rounded-lg transition text-blue-600 hover:text-blue-700"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content - Full Webpage Preview */}
              <div className="flex-1 overflow-hidden bg-white">
                {previewComponents.length > 0 ? (
                  <PreviewModeWrapper>
                    <CartProvider>
                      <div className="w-full h-full overflow-y-auto">
                        <PageRenderer 
                          components={previewComponents}
                          storefront={mockStorefrontContext}
                          isPreview={true}
                        />
                      </div>
                    </CartProvider>
                  </PreviewModeWrapper>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-blue-600">
                      <svg className="w-16 h-16 mx-auto mb-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                      </svg>
                      <p className="font-medium">No components to preview</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-blue-100/50 bg-blue-50/30 flex gap-3 justify-end">
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="px-6 py-2 border border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Template Modal */}
      <AnimatePresence>
        {editingTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditingTemplate(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-blue-100/50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-blue-100/50 flex items-center justify-between bg-gradient-to-r from-white to-blue-50/30">
                <h2 className="text-2xl font-bold text-blue-900">Edit Template</h2>
                <button
                  onClick={() => setEditingTemplate(null)}
                  className="p-2 hover:bg-blue-100 rounded-lg transition text-blue-600 hover:text-blue-700"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-4 space-y-4">
                {editSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-green-100 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2"
                  >
                    <span>✓</span> Template saved successfully
                  </motion.div>
                )}

                {/* Template Name */}
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">Template Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 resize-none transition"
                    rows={3}
                  />
                </div>

                {/* Status */}
                <div className="pt-2 border-t border-blue-100/50">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500 bg-blue-50"
                    />
                    <span className="text-sm font-medium text-blue-900">Publish Template</span>
                  </label>
                  <p className="text-xs text-blue-600 mt-2 ml-7">
                    Published templates are available for tenants to use
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-blue-100/50 bg-blue-50/30 flex gap-3 justify-end">
                <button
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 border border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveTemplate}
                  disabled={editSaving || editSuccess}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-blue-500/40"
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Generate HTML for iframe preview - returns HTML string (BACKUP - not currently used, kept for reference)
// function generateHTML(components: Component[]): string {
//   ... (commented out to keep codebase clean but available if needed)
// }

// Mock storefront context for template previews
const mockStorefrontContext: StorefrontContext = {
  id: 1,
  name: 'Template Preview',
  subdomain: 'preview',
  primaryColor: '#3b82f6',
  secondaryColor: '#10b981',
  settings: {}
}



