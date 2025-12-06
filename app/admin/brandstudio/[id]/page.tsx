'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface Component {
  type: string
  props: Record<string, unknown>
  position?: { x: number; y: number }
  size?: { width: number; height: number }
  [key: string]: unknown
}

interface StorefrontTemplate {
  id: string
  name: string
  description: string
  content: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function TemplateEditorPage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string

  const [template, setTemplate] = useState<StorefrontTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '', isActive: true })
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [previewComponents, setPreviewComponents] = useState<Component[]>([])

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/templates/${templateId}`)
        if (response.ok) {
          const data = await response.json()
          setTemplate(data.template)
          setEditForm({
            name: data.template.name,
            description: data.template.description,
            isActive: data.template.isActive,
          })
          // Parse template content
          if (data.template.content) {
            try {
              const parsed = JSON.parse(data.template.content)
              setPreviewComponents(Array.isArray(parsed) ? parsed : [])
            } catch {
              setPreviewComponents([])
            }
          }
        }
      } catch (error) {
        console.error('Error loading template:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTemplate()
  }, [templateId])

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          content: template?.content || '',
        }),
      })

      if (response.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Error saving template:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen flex items-center justify-center"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full mx-auto mb-4"
          />
          <p className="text-slate-600 font-medium">Loading template...</p>
        </div>
      </motion.div>
    )
  }

  if (!template) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen flex items-center justify-center"
      >
        <div className="text-center">
          <p className="text-slate-600 font-medium">Template not found</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="flex-1 p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/admin/brandstudio')}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6 text-slate-600" />
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{editForm.name}</h1>
              <p className="text-slate-600">Edit template details and content</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 font-medium shadow-lg disabled:opacity-50"
          >
            <CheckCircleIcon className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </motion.button>
        </motion.div>

        {/* Success Toast */}
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3"
          >
            <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-700 font-medium">Template saved successfully</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor Area */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col"
              style={{ height: '600px' }}
            >
              <h2 className="text-xl font-bold text-slate-900 mb-4">Template Preview</h2>
              <div className="flex-1 rounded-xl border border-slate-200 overflow-hidden bg-white">
                {previewComponents.length > 0 ? (
                  <iframe
                    srcDoc={generateHTML(previewComponents)}
                    className="w-full h-full border-none"
                    title="Template Preview"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50">
                    <p className="text-slate-500 text-center">No components in this template</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Settings Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit"
          >
            <h2 className="text-lg font-bold text-slate-900 mb-6">Settings</h2>

            <div className="space-y-4">
              {/* Template Name */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Template Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  rows={3}
                />
              </div>

              {/* Status */}
              <div className="pt-4 border-t border-slate-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="w-4 h-4 text-emerald-500 rounded"
                  />
                  <span className="text-sm font-medium text-slate-900">Publish Template</span>
                </label>
                <p className="text-xs text-slate-500 mt-2 ml-7">
                  Published templates are available for tenants to use
                </p>
              </div>

              {/* Template Info */}
              <div className="pt-4 border-t border-slate-200 space-y-2 text-xs text-slate-600">
                <div>
                  <p className="font-medium text-slate-900">Template ID</p>
                  <p className="break-all">{templateId}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Created</p>
                  <p>{new Date(template.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Last Updated</p>
                  <p>{new Date(template.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

// Generate HTML for iframe preview
function generateHTML(components: Component[]): string {
  const componentHTML = components.map((component) => {
    const props = component.props || {}
    const title = typeof props.title === 'string' ? props.title : ''
    const heading = typeof props.heading === 'string' ? props.heading : ''
    const subtitle = typeof props.subtitle === 'string' ? props.subtitle : ''
    const buttonText = typeof props.buttonText === 'string' ? props.buttonText : 'Learn More'
    const backgroundColor = typeof props.backgroundColor === 'string' ? props.backgroundColor : 'white'
    const textColor = typeof props.textColor === 'string' ? props.textColor : 'black'

    if (component.type === 'hero' || component.type === 'hero-glass') {
      return `
        <div style="background-color: ${backgroundColor}; color: ${textColor}; min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; text-align: center;">
          <h1 style="font-size: 3rem; font-weight: bold; margin-bottom: 1rem;">${heading}</h1>
          <p style="font-size: 1.25rem; margin-bottom: 1.5rem;">${subtitle}</p>
          <p style="font-size: 1.125rem; color: #666; margin-bottom: 2rem;">${title}</p>
          <button style="padding: 0.75rem 2rem; background-color: #2563eb; color: white; border-radius: 0.5rem; font-weight: 600; border: none; cursor: pointer;">${buttonText}</button>
        </div>
      `
    } else if (component.type === 'header' || component.type === 'header-glass' || component.type === 'blank-header') {
      return `
        <div style="background-color: ${backgroundColor}; padding: 1rem 2rem; border-bottom: 1px solid #ddd; display: flex; align-items: center; justify-content: space-between;">
          <div style="font-weight: bold; font-size: 1.25rem;">${title || 'Logo'}</div>
          <nav style="display: flex; gap: 1.5rem;">
            <a href="#" style="color: inherit; text-decoration: none;">Home</a>
            <a href="#" style="color: inherit; text-decoration: none;">Products</a>
            <a href="#" style="color: inherit; text-decoration: none;">About</a>
            <a href="#" style="color: inherit; text-decoration: none;">Contact</a>
          </nav>
        </div>
      `
    } else if (component.type === 'product-grid') {
      return `
        <div style="padding: 3rem 2rem; background-color: white;">
          <h2 style="font-size: 1.875rem; font-weight: bold; margin-bottom: 2rem; text-align: center;">${heading}</h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;">
            <div style="border: 1px solid #ddd; border-radius: 0.5rem; overflow: hidden;">
              <div style="background: linear-gradient(to bottom right, #f3f4f6, #e5e7eb); height: 12rem; display: flex; align-items: center; justify-content: center; color: #999;">Product 1 Image</div>
              <div style="padding: 1rem;">
                <h3 style="font-weight: 600; margin-bottom: 0.5rem;">Product 1</h3>
                <p style="color: #666; font-size: 0.875rem; margin-bottom: 1rem;">High-quality product description</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: bold;">$99.00</span>
                  <button style="padding: 0.25rem 1rem; background-color: #2563eb; color: white; border-radius: 0.25rem; font-size: 0.875rem; border: none; cursor: pointer;">Add to Cart</button>
                </div>
              </div>
            </div>
            <div style="border: 1px solid #ddd; border-radius: 0.5rem; overflow: hidden;">
              <div style="background: linear-gradient(to bottom right, #f3f4f6, #e5e7eb); height: 12rem; display: flex; align-items: center; justify-content: center; color: #999;">Product 2 Image</div>
              <div style="padding: 1rem;">
                <h3 style="font-weight: 600; margin-bottom: 0.5rem;">Product 2</h3>
                <p style="color: #666; font-size: 0.875rem; margin-bottom: 1rem;">High-quality product description</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: bold;">$99.00</span>
                  <button style="padding: 0.25rem 1rem; background-color: #2563eb; color: white; border-radius: 0.25rem; font-size: 0.875rem; border: none; cursor: pointer;">Add to Cart</button>
                </div>
              </div>
            </div>
            <div style="border: 1px solid #ddd; border-radius: 0.5rem; overflow: hidden;">
              <div style="background: linear-gradient(to bottom right, #f3f4f6, #e5e7eb); height: 12rem; display: flex; align-items: center; justify-content: center; color: #999;">Product 3 Image</div>
              <div style="padding: 1rem;">
                <h3 style="font-weight: 600; margin-bottom: 0.5rem;">Product 3</h3>
                <p style="color: #666; font-size: 0.875rem; margin-bottom: 1rem;">High-quality product description</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: bold;">$99.00</span>
                  <button style="padding: 0.25rem 1rem; background-color: #2563eb; color: white; border-radius: 0.25rem; font-size: 0.875rem; border: none; cursor: pointer;">Add to Cart</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `
    } else if (component.type === 'testimonials') {
      return `
        <div style="padding: 3rem 2rem; background-color: #f9fafb;">
          <h2 style="font-size: 1.875rem; font-weight: bold; margin-bottom: 2rem; text-align: center;">${heading}</h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; max-width: 56rem; margin: 0 auto;">
            <div style="background-color: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="color: #fbbf24; margin-bottom: 1rem;">★ ★ ★ ★ ★</div>
              <p style="color: #374151; margin-bottom: 1rem;">&quot;Amazing product! Highly recommended.&quot;</p>
              <p style="font-weight: 600;">Customer 1</p>
              <p style="color: #999; font-size: 0.875rem;">Verified Buyer</p>
            </div>
            <div style="background-color: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="color: #fbbf24; margin-bottom: 1rem;">★ ★ ★ ★ ★</div>
              <p style="color: #374151; margin-bottom: 1rem;">&quot;Amazing product! Highly recommended.&quot;</p>
              <p style="font-weight: 600;">Customer 2</p>
              <p style="color: #999; font-size: 0.875rem;">Verified Buyer</p>
            </div>
          </div>
        </div>
      `
    } else if (component.type === 'cta') {
      return `
        <div style="padding: 4rem 2rem; background-color: #2563eb; color: white; text-align: center;">
          <h2 style="font-size: 1.875rem; font-weight: bold; margin-bottom: 1rem;">${heading}</h2>
          <p style="font-size: 1.125rem; margin-bottom: 2rem;">${subtitle}</p>
          <button style="padding: 0.75rem 2rem; background-color: white; color: #2563eb; border-radius: 0.5rem; font-weight: 600; border: none; cursor: pointer;">${buttonText}</button>
        </div>
      `
    } else if (component.type === 'footer') {
      return `
        <div style="padding: 3rem 2rem; background-color: #111827; color: white;">
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; margin-bottom: 2rem;">
            <div>
              <h4 style="font-weight: bold; margin-bottom: 1rem;">Company</h4>
              <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.875rem;">
                <li style="margin-bottom: 0.5rem;"><a href="#" style="color: #d1d5db; text-decoration: none;">About</a></li>
                <li style="margin-bottom: 0.5rem;"><a href="#" style="color: #d1d5db; text-decoration: none;">Careers</a></li>
                <li><a href="#" style="color: #d1d5db; text-decoration: none;">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 style="font-weight: bold; margin-bottom: 1rem;">Products</h4>
              <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.875rem;">
                <li style="margin-bottom: 0.5rem;"><a href="#" style="color: #d1d5db; text-decoration: none;">Features</a></li>
                <li style="margin-bottom: 0.5rem;"><a href="#" style="color: #d1d5db; text-decoration: none;">Pricing</a></li>
                <li><a href="#" style="color: #d1d5db; text-decoration: none;">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 style="font-weight: bold; margin-bottom: 1rem;">Resources</h4>
              <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.875rem;">
                <li style="margin-bottom: 0.5rem;"><a href="#" style="color: #d1d5db; text-decoration: none;">Blog</a></li>
                <li style="margin-bottom: 0.5rem;"><a href="#" style="color: #d1d5db; text-decoration: none;">Docs</a></li>
                <li><a href="#" style="color: #d1d5db; text-decoration: none;">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 style="font-weight: bold; margin-bottom: 1rem;">Legal</h4>
              <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.875rem;">
                <li style="margin-bottom: 0.5rem;"><a href="#" style="color: #d1d5db; text-decoration: none;">Privacy</a></li>
                <li style="margin-bottom: 0.5rem;"><a href="#" style="color: #d1d5db; text-decoration: none;">Terms</a></li>
                <li><a href="#" style="color: #d1d5db; text-decoration: none;">Contact</a></li>
              </ul>
            </div>
          </div>
          <div style="border-top: 1px solid #374151; padding-top: 2rem; text-align: center; font-size: 0.875rem;">
            <p>&copy; 2024 Your Company. All rights reserved.</p>
          </div>
        </div>
      `
    }
    return ''
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; }
          a { color: inherit; }
        </style>
      </head>
      <body>
        ${componentHTML}
      </body>
    </html>
  `
}
