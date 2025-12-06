'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  TagIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'
import { useSettings } from '@/lib/settings-context'

interface Category {
  id: number
  name: string
  description: string | null
  image: string | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  tenantId: number
}

interface CategoryManagerProps {
  subdomain?: string
}

interface CategoryFormState {
  name: string
  description: string
  image: string
  isActive: boolean
  sortOrder: string
}

const defaultFormState: CategoryFormState = {
  name: '',
  description: '',
  image: '',
  isActive: true,
  sortOrder: '0'
}

export function CategoryManager({ subdomain }: CategoryManagerProps) {
  const { settings } = useSettings()
  const theme = {
    primary: settings.brandColors.primary,
    secondary: settings.brandColors.secondary,
    accent: settings.brandColors.accent,
    background: settings.brandColors.background,
    surface: settings.brandColors.surface,
    text: settings.brandColors.text
  }
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formState, setFormState] = useState<CategoryFormState>(defaultFormState)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'sortOrder' | 'created'>('sortOrder')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const querySuffix = useMemo(
    () => (subdomain ? `?subdomain=${encodeURIComponent(subdomain)}` : ''),
    [subdomain]
  )

  const categoriesEndpoint = useMemo(() => `/api/categories${querySuffix}`, [querySuffix])
  const categoryEndpoint = useCallback(
    (id: number) => `/api/categories/${id}${querySuffix}`,
    [querySuffix]
  )

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(categoriesEndpoint)
      if (!response.ok) {
        throw new Error('Failed to load categories')
      }

      const payload = await response.json()
      const data: Category[] = payload?.data?.categories ?? []
      setCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }, [categoriesEndpoint])

  useEffect(() => {
    void fetchCategories()
  }, [fetchCategories])

  const resetForm = () => {
    setEditingCategory(null)
    setFormState(defaultFormState)
    setImagePreview(null)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setImagePreview(dataUrl)
      setFormState((prev) => ({ ...prev, image: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      setSubmitting(true)

      if (!formState.name.trim()) {
        alert('Category name is required.')
        return
      }

      const url = editingCategory ? categoryEndpoint(editingCategory.id) : categoriesEndpoint
      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formState.name,
          description: formState.description || null,
          image: formState.image || null,
          isActive: formState.isActive,
          sortOrder: Number(formState.sortOrder) || 0
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save category')
      }

      await fetchCategories()
      setShowForm(false)
      resetForm()
    } catch (error) {
      console.error('Failed to save category:', error)
      alert(error instanceof Error ? error.message : 'Failed to save category')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? Products using this category will be affected.'))
      return

    try {
      const response = await fetch(categoryEndpoint(id), { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete category')
      }

      await fetchCategories()
    } catch (error) {
      console.error('Failed to delete category:', error)
      alert('Failed to delete category')
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormState({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      isActive: category.isActive,
      sortOrder: String(category.sortOrder)
    })
    setImagePreview(category.image)
    setShowForm(true)
  }

  const toggleActive = async (category: Category) => {
    try {
      const response = await fetch(categoryEndpoint(category.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !category.isActive })
      })

      if (!response.ok) {
        throw new Error('Failed to update category status')
      }

      await fetchCategories()
    } catch (error) {
      console.error('Failed to update category status:', error)
      alert('Failed to update category status')
    }
  }

  const filteredCategories = useMemo(() => {
    let filtered = categories

    // Apply status filter
    if (filterActive === 'active') {
      filtered = filtered.filter((c) => c.isActive)
    } else if (filterActive === 'inactive') {
      filtered = filtered.filter((c) => !c.isActive)
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          (c.description || '').toLowerCase().includes(term)
      )
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let compareA: string | number = ''
      let compareB: string | number = ''

      if (sortBy === 'name') {
        compareA = a.name.toLowerCase()
        compareB = b.name.toLowerCase()
      } else if (sortBy === 'sortOrder') {
        compareA = a.sortOrder
        compareB = b.sortOrder
      } else if (sortBy === 'created') {
        compareA = new Date(a.createdAt).getTime()
        compareB = new Date(b.createdAt).getTime()
      }

      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [categories, searchTerm, filterActive, sortBy, sortDirection])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">Loading categories...</div>
      </div>
    )
  }

  const title = subdomain ? `${subdomain} Categories` : 'Categories'
  const subtitle = subdomain
    ? `Organize products and manage categories for ${subdomain}`
    : 'Organize your products with custom categories'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      style={{ backgroundColor: theme.background || '#f9fafb' }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex justify-between items-center mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: theme.text || '#111827' }}>
            {title}
          </h1>
          <p className="mt-2 text-sm" style={{ color: `${theme.text}80` || '#6b7280' }}>
            {subtitle}
          </p>
        </div>
        <motion.button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 shadow-md hover:shadow-lg"
          style={{ backgroundColor: theme.primary }}
        >
          <PlusIcon className="w-5 h-5" />
          Add Category
        </motion.button>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
      >
        {/* Search */}
        <div className="relative md:col-span-2">
          <MagnifyingGlassIcon
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
            style={{ color: `${theme.primary}60` }}
          />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
            style={{
              borderColor: `${theme.primary}25`,
              color: theme.text || '#111827'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = theme.primary
              e.currentTarget.style.boxShadow = `0 0 0 4px ${theme.primary}15`
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = `${theme.primary}25`
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
        </div>

        {/* Status Filter */}
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
          style={{
            borderColor: `${theme.primary}25`,
            color: theme.text || '#111827'
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>

        {/* Sort */}
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'sortOrder' | 'created')}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all flex-1"
            style={{
              borderColor: `${theme.primary}25`,
              color: theme.text || '#111827'
            }}
          >
            <option value="sortOrder">Sort Order</option>
            <option value="name">Name</option>
            <option value="created">Date Created</option>
          </select>
          <motion.button
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-2 border rounded-lg transition-all"
            style={{ borderColor: `${theme.primary}25` }}
            title={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
          >
            {sortDirection === 'asc' ? (
              <ArrowUpIcon className="w-5 h-5" style={{ color: theme.primary }} />
            ) : (
              <ArrowDownIcon className="w-5 h-5" style={{ color: theme.primary }} />
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Categories Grid or Empty State */}
      {filteredCategories.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-24 text-center border border-dashed rounded-2xl"
          style={{
            color: `${theme.text}80`,
            borderColor: `${theme.primary}20`,
            backgroundColor: `${theme.primary}05`
          }}
        >
          <TagIcon className="w-16 h-16 mx-auto mb-4" style={{ color: `${theme.primary}40` }} />
          <h3 className="text-lg font-medium mb-2">
            {searchTerm ? 'No categories found' : 'No categories yet'}
          </h3>
          <p>
            {searchTerm
              ? `Try adjusting your search or create a new category`
              : `Start by creating your first category`}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="relative group rounded-xl overflow-hidden border transition-all duration-300 hover:shadow-lg"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: `${theme.primary}20`
                }}
              >
                {/* Image */}
                {category.image && (
                  <div className="relative w-full h-40 overflow-hidden bg-gray-200">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundColor: category.isActive ? 'transparent' : 'rgba(0,0,0,0.5)'
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3
                      className="font-semibold text-lg truncate flex-1"
                      style={{ color: theme.text || '#111827' }}
                    >
                      {category.name}
                    </h3>
                    <motion.button
                      onClick={() => toggleActive(category)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`ml-2 px-2 py-1 rounded text-xs font-medium transition-all ${
                        category.isActive
                          ? 'text-white'
                          : 'text-gray-600 bg-gray-100'
                      }`}
                      style={{
                        backgroundColor: category.isActive ? theme.primary : undefined
                      }}
                    >
                      {category.isActive ? 'Active' : 'Inactive'}
                    </motion.button>
                  </div>

                  {category.description && (
                    <p
                      className="text-sm mb-3 line-clamp-2"
                      style={{ color: `${theme.text}70` }}
                    >
                      {category.description}
                    </p>
                  )}

                  <div
                    className="text-xs mb-4 pb-4 border-b"
                    style={{
                      color: `${theme.text}60`,
                      borderColor: `${theme.primary}15`
                    }}
                  >
                    Sort Order: <span className="font-medium">{category.sortOrder}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => handleEdit(category)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-white"
                      style={{ backgroundColor: theme.primary }}
                    >
                      <PencilIcon className="w-4 h-4" />
                      Edit
                    </motion.button>
                    <motion.button
                      onClick={() => handleDelete(category.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 bg-red-600 hover:bg-red-700"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Delete
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            key="form-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6"
            >
              <h2
                className="text-2xl font-bold mb-6"
                style={{ color: theme.text || '#111827' }}
              >
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    style={{
                      borderColor: `${theme.primary}25`,
                      color: theme.text
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = theme.primary
                      e.currentTarget.style.boxShadow = `0 0 0 4px ${theme.primary}15`
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = `${theme.primary}25`
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                    Description
                  </label>
                  <textarea
                    value={formState.description}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none"
                    style={{
                      borderColor: `${theme.primary}25`,
                      color: theme.text
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = theme.primary
                      e.currentTarget.style.boxShadow = `0 0 0 4px ${theme.primary}15`
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = `${theme.primary}25`
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>

                {/* Image */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                    Category Image
                  </label>
                  {imagePreview && (
                    <div className="mb-2 relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <motion.button
                        type="button"
                        onClick={() => {
                          setImagePreview(null)
                          setFormState((prev) => ({ ...prev, image: '' }))
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-lg text-xs font-medium"
                      >
                        Remove
                      </motion.button>
                    </div>
                  )}
                  <label
                    className="block w-full px-4 py-2 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all hover:border-opacity-100"
                    style={{
                      borderColor: `${theme.primary}40`,
                      color: theme.primary
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    Click to upload or drag and drop
                  </label>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formState.sortOrder}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, sortOrder: e.target.value }))
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    style={{
                      borderColor: `${theme.primary}25`,
                      color: theme.text
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = theme.primary
                      e.currentTarget.style.boxShadow = `0 0 0 4px ${theme.primary}15`
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = `${theme.primary}25`
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <p className="text-xs mt-1" style={{ color: `${theme.text}60` }}>
                    Lower numbers appear first
                  </p>
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: `${theme.primary}10` }}>
                  <input
                    type="checkbox"
                    checked={formState.isActive}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{
                      accentColor: theme.primary
                    }}
                  />
                  <label className="text-sm font-medium cursor-pointer" style={{ color: theme.text }}>
                    Active
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t" style={{ borderColor: `${theme.primary}15` }}>
                  <motion.button
                    type="button"
                    onClick={() => setShowForm(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-4 py-2 rounded-lg font-medium border transition-all"
                    style={{
                      borderColor: `${theme.primary}25`,
                      color: theme.text,
                      backgroundColor: 'transparent'
                    }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: theme.primary }}
                  >
                    {submitting
                      ? editingCategory
                        ? 'Updating...'
                        : 'Creating...'
                      : editingCategory
                        ? 'Update Category'
                        : 'Create Category'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
