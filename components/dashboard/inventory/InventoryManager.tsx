'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  CubeIcon
} from '@heroicons/react/24/outline'
import { useSettings } from '@/lib/settings-context'

interface Ingredient {
  id: number
  name: string
  unit: string
  currentStock: number
  minStock: number
  costPerUnit: number
  supplier: string | null
  description: string | null
  isActive: boolean
  createdAt: string
}

interface InventoryManagerProps {
  subdomain?: string
}

interface IngredientFormState {
  name: string
  unit: string
  currentStock: string
  minStock: string
  costPerUnit: string
  supplier: string
  description: string
}

type TransactionType = 'purchase' | 'adjustment' | 'waste' | 'return' | 'transfer'

interface AdjustFormState {
  quantityChange: string
  transactionType: TransactionType
  notes: string
}

const defaultFormState: IngredientFormState = {
  name: '',
  unit: 'pieces',
  currentStock: '0',
  minStock: '0',
  costPerUnit: '0',
  supplier: '',
  description: ''
}

const defaultAdjustState: AdjustFormState = {
  quantityChange: '',
  transactionType: 'adjustment',
  notes: ''
}

export function InventoryManager({ subdomain }: InventoryManagerProps) {
  const { settings } = useSettings()
  const theme = {
    primary: settings.brandColors.primary,
    secondary: settings.brandColors.secondary,
    accent: settings.brandColors.accent,
    background: settings.brandColors.background,
    surface: settings.brandColors.surface,
    text: settings.brandColors.text
  }

  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFormModal, setShowFormModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [adjustingIngredient, setAdjustingIngredient] = useState<Ingredient | null>(null)
  const [formState, setFormState] = useState<IngredientFormState>(defaultFormState)
  const [adjustState, setAdjustState] = useState<AdjustFormState>(defaultAdjustState)
  const [submitting, setSubmitting] = useState(false)
  const [adjustSubmitting, setAdjustSubmitting] = useState(false)

  const querySuffix = useMemo(
    () => (subdomain ? `?subdomain=${encodeURIComponent(subdomain)}` : ''),
    [subdomain]
  )

  const ingredientsEndpoint = useMemo(() => `/api/ingredients${querySuffix}`, [querySuffix])
  const ingredientEndpoint = useCallback((id: number) => `/api/ingredients/${id}${querySuffix}`, [querySuffix])
  const adjustEndpoint = useCallback(
    (id: number) => `/api/ingredients/${id}/adjust-stock${querySuffix}`,
    [querySuffix]
  )

  const fetchIngredients = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(ingredientsEndpoint)
      if (!response.ok) {
        throw new Error('Failed to load ingredients')
      }

      const payload = await response.json()
      const data: Ingredient[] = payload?.data?.ingredients ?? []
      setIngredients(data)
    } catch (error) {
      console.error('Failed to fetch ingredients:', error)
    } finally {
      setLoading(false)
    }
  }, [ingredientsEndpoint])

  useEffect(() => {
    void fetchIngredients()
  }, [fetchIngredients])

  const openCreateModal = useCallback(() => {
    setEditingIngredient(null)
    setFormState(defaultFormState)
    setShowFormModal(true)
  }, [])

  const openEditModal = useCallback((ingredient: Ingredient) => {
    setEditingIngredient(ingredient)
    setFormState({
      name: ingredient.name,
      unit: ingredient.unit,
      currentStock: ingredient.currentStock.toString(),
      minStock: ingredient.minStock.toString(),
      costPerUnit: ingredient.costPerUnit.toString(),
      supplier: ingredient.supplier ?? '',
      description: ingredient.description ?? ''
    })
    setShowFormModal(true)
  }, [])

  const closeFormModal = useCallback(() => {
    setShowFormModal(false)
    setEditingIngredient(null)
    setFormState(defaultFormState)
    setSubmitting(false)
  }, [])

  const openAdjustModal = useCallback((ingredient: Ingredient) => {
    setAdjustingIngredient(ingredient)
    setAdjustState(defaultAdjustState)
    setShowAdjustModal(true)
  }, [])

  const closeAdjustModal = useCallback(() => {
    setShowAdjustModal(false)
    setAdjustingIngredient(null)
    setAdjustState(defaultAdjustState)
    setAdjustSubmitting(false)
  }, [])

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      try {
        setSubmitting(true)

        const payload = {
          name: formState.name.trim(),
          unit_of_measure: formState.unit.trim(),
          current_stock: Number(formState.currentStock),
          low_stock_threshold: Number(formState.minStock),
          unit_cost: Number(formState.costPerUnit),
          supplier: formState.supplier.trim() || undefined,
          description: formState.description.trim() || undefined
        }

        if (
          !payload.name ||
          !payload.unit_of_measure ||
          Number.isNaN(payload.current_stock) ||
          Number.isNaN(payload.low_stock_threshold)
        ) {
          alert('Please provide valid values for the required fields.')
          return
        }

        const targetUrl = editingIngredient ? ingredientEndpoint(editingIngredient.id) : ingredientsEndpoint
        const method = editingIngredient ? 'PUT' : 'POST'

        const response = await fetch(targetUrl, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to save ingredient' }))
          throw new Error(error.error || 'Failed to save ingredient')
        }

        await fetchIngredients()
        closeFormModal()
      } catch (error) {
        console.error('Failed to save ingredient:', error)
        alert(error instanceof Error ? error.message : 'Failed to save ingredient')
      } finally {
        setSubmitting(false)
      }
    },
    [closeFormModal, editingIngredient, fetchIngredients, formState, ingredientEndpoint, ingredientsEndpoint]
  )

  const handleDelete = useCallback(
    async (ingredient: Ingredient) => {
      if (!confirm(`Delete ingredient "${ingredient.name}"? This cannot be undone.`)) {
        return
      }

      try {
        const response = await fetch(ingredientEndpoint(ingredient.id), {
          method: 'DELETE'
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to delete ingredient' }))
          throw new Error(error.error || 'Failed to delete ingredient')
        }

        await fetchIngredients()
      } catch (error) {
        console.error('Failed to delete ingredient:', error)
        alert(error instanceof Error ? error.message : 'Failed to delete ingredient')
      }
    },
    [fetchIngredients, ingredientEndpoint]
  )

  const handleAdjustSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!adjustingIngredient) {
        return
      }

      try {
        setAdjustSubmitting(true)

        const quantityChange = Number(adjustState.quantityChange)

        if (Number.isNaN(quantityChange) || quantityChange === 0) {
          alert('Please provide a non-zero quantity change.')
          return
        }

        const response = await fetch(adjustEndpoint(adjustingIngredient.id), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quantity_change: quantityChange,
            transaction_type: adjustState.transactionType,
            notes: adjustState.notes.trim() || undefined
          })
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to adjust stock' }))
          throw new Error(error.error || 'Failed to adjust stock')
        }

        await fetchIngredients()
        closeAdjustModal()
      } catch (error) {
        console.error('Failed to adjust stock:', error)
        alert(error instanceof Error ? error.message : 'Failed to adjust stock')
      } finally {
        setAdjustSubmitting(false)
      }
    },
    [adjustEndpoint, adjustState, adjustingIngredient, closeAdjustModal, fetchIngredients]
  )

  const filteredIngredients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) {
      return ingredients
    }

    return ingredients.filter((ingredient) => {
      const nameMatch = ingredient.name.toLowerCase().includes(term)
      const supplierMatch = ingredient.supplier?.toLowerCase().includes(term)
      return nameMatch || Boolean(supplierMatch)
    })
  }, [ingredients, searchTerm])

  const lowStockIngredients = useMemo(
    () => ingredients.filter((ingredient) => ingredient.currentStock <= ingredient.minStock),
    [ingredients]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">Loading inventory...</div>
      </div>
    )
  }

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex-1 p-6 sm:p-8" 
      style={{ backgroundColor: theme.background || '#f9fafb' }}
    >
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8"
      >
        <div>
          <h1 
            className="text-3xl font-bold tracking-tight"
            style={{ color: theme.text || '#111827' }}
          >
            {subdomain ? `${subdomain} Inventory` : 'Inventory'}
          </h1>
          <p 
            className="mt-2 text-sm"
            style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}
          >
            Manage ingredients and monitor available stock for {subdomain || 'your store'}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-semibold shadow-sm transition-shadow duration-200"
          style={{ 
            backgroundColor: theme.primary,
            boxShadow: `0 1px 3px rgba(0,0,0,0.1), 0 0 0 1px ${theme.primary}20`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = `0 4px 12px ${theme.primary}40, 0 0 0 1px ${theme.primary}20`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = `0 1px 3px rgba(0,0,0,0.1), 0 0 0 1px ${theme.primary}20`
          }}
        >
          <PlusIcon className="w-5 h-5" />
          Add Ingredient
        </motion.button>
      </motion.div>

      {lowStockIngredients.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="p-5 mb-6 border rounded-xl backdrop-blur-xl"
          style={{
            backgroundColor: '#fef2f2',
            borderColor: '#dc262620',
            boxShadow: '0 1px 3px rgba(220,38,38,0.1)'
          }}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-700" />
            </div>
            <h3 className="font-bold text-red-900">Critical Stock Alert</h3>
          </div>
          <p className="text-sm font-medium text-red-800 mb-3">
            {lowStockIngredients.length} ingredient{lowStockIngredients.length > 1 ? 's are' : ' is'} running low on stock.
          </p>
          <div className="flex flex-wrap gap-2">
            {lowStockIngredients.map((ingredient) => (
              <span 
                key={ingredient.id} 
                className="px-3 py-1.5 bg-red-100 text-red-800 text-xs font-semibold rounded-lg"
              >
                {ingredient.name}: {ingredient.currentStock} {ingredient.unit}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6"
      >
        <div className="relative">
          <MagnifyingGlassIcon 
            className="absolute w-5 h-5 top-3.5 left-4 transition-colors duration-200" 
            style={{ color: theme.text ? `${theme.text}60` : '#9ca3af' }}
          />
          <input
            type="text"
            placeholder="Search ingredients or suppliers..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full py-3 pl-12 pr-4 border rounded-xl focus:outline-none transition-all duration-200 font-medium"
            style={{ 
              borderColor: `${theme.primary}25`,
              color: theme.text || '#111827',
              backgroundColor: 'white',
              boxShadow: `0 1px 2px rgba(0,0,0,0.04)`
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = theme.primary
              e.currentTarget.style.boxShadow = `0 0 0 4px ${theme.primary}15, 0 1px 2px rgba(0,0,0,0.04)`
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = `${theme.primary}25`
              e.currentTarget.style.boxShadow = `0 1px 2px rgba(0,0,0,0.04)`
            }}
          />
        </div>
      </motion.div>

      {filteredIngredients.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-24 text-center border border-dashed rounded-2xl"
          style={{
            color: theme.text ? `${theme.text}80` : '#6b7280',
            borderColor: `${theme.primary}20`,
            backgroundColor: `${theme.primary}05`
          }}
        >
          <CubeIcon 
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: theme.text ? `${theme.text}40` : '#9ca3af' }}
          />
          <p className="font-medium">No ingredients found. Try adjusting your search or add a new ingredient.</p>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          {filteredIngredients.map((ingredient, index) => {
            const isLowStock = ingredient.currentStock <= ingredient.minStock
            return (
              <motion.div
                key={ingredient.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="p-6 bg-white border rounded-2xl shadow-sm backdrop-blur-xl group"
                style={{
                  borderColor: isLowStock ? '#dc262620' : `${theme.primary}20`,
                  boxShadow: isLowStock 
                    ? '0 1px 3px rgba(220,38,38,0.1), 0 0 0 1px rgba(220,38,38,0.1)'
                    : `0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px ${theme.primary}10`,
                  backgroundColor: isLowStock ? '#fef2f208' : 'white'
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 
                      className="text-lg font-bold"
                      style={{ color: theme.text || '#111827' }}
                    >
                      {ingredient.name}
                    </h3>
                    {ingredient.supplier && (
                      <p 
                        className="text-sm mt-1 font-medium"
                        style={{ color: theme.text ? `${theme.text}80` : '#6b7280' }}
                      >
                        Supplier: {ingredient.supplier}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openEditModal(ingredient)}
                      className="p-2 rounded-lg transition-all duration-200"
                      style={{
                        color: theme.primary,
                        backgroundColor: `${theme.primary}10`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${theme.primary}20`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `${theme.primary}10`
                      }}
                      title="Edit ingredient"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(ingredient)}
                      className="p-2 text-red-600 rounded-lg transition-all duration-200"
                      style={{
                        backgroundColor: '#fee2e210'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fee2e2'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fee2e210'
                      }}
                      title="Delete ingredient"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                <div 
                  className="p-4 rounded-xl mb-4"
                  style={{
                    backgroundColor: isLowStock ? '#fef2f2' : `${theme.primary}08`
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span 
                      className="text-sm font-medium"
                      style={{ color: theme.text ? `${theme.text}80` : '#6b7280' }}
                    >
                      Current Stock
                    </span>
                    {isLowStock && <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />}
                  </div>
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: isLowStock ? '#dc2626' : theme.text || '#111827' }}
                  >
                    {ingredient.currentStock} {ingredient.unit}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Low threshold: {ingredient.minStock} {ingredient.unit}
                  </div>
                </div>

                {ingredient.costPerUnit > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-700 mb-4">
                    <CubeIcon className="w-4 h-4 text-gray-400" />
                    <span>${ingredient.costPerUnit.toFixed(2)} per {ingredient.unit}</span>
                  </div>
                )}

                {ingredient.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{ingredient.description}</p>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openAdjustModal(ingredient)}
                  className="flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200"
                  style={{ 
                    backgroundColor: theme.primary,
                    boxShadow: `0 1px 3px rgba(0,0,0,0.1), 0 0 0 1px ${theme.primary}20`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.secondary
                    e.currentTarget.style.boxShadow = `0 2px 8px ${theme.primary}40, 0 0 0 1px ${theme.primary}20`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.primary
                    e.currentTarget.style.boxShadow = `0 1px 3px rgba(0,0,0,0.1), 0 0 0 1px ${theme.primary}20`
                  }}
                >
                  <ArrowUpIcon className="w-4 h-4" />
                  Adjust Stock
                </motion.button>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      <AnimatePresence>
        {showFormModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={closeFormModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                {editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Ingredient Name *</label>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Unit of Measure *</label>
                    <select
                      value={formState.unit}
                      onChange={(event) => setFormState((prev) => ({ ...prev, unit: event.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    >
                      <option value="pieces">Pieces</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="g">Grams (g)</option>
                      <option value="l">Liters (l)</option>
                      <option value="ml">Milliliters (ml)</option>
                      <option value="oz">Ounces (oz)</option>
                      <option value="lb">Pounds (lb)</option>
                      <option value="cup">Cups</option>
                      <option value="tbsp">Tablespoons</option>
                      <option value="tsp">Teaspoons</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Current Stock *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formState.currentStock}
                      onChange={(event) => setFormState((prev) => ({ ...prev, currentStock: event.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Low Stock Threshold *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formState.minStock}
                      onChange={(event) => setFormState((prev) => ({ ...prev, minStock: event.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Unit Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formState.costPerUnit}
                      onChange={(event) => setFormState((prev) => ({ ...prev, costPerUnit: event.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Supplier</label>
                    <input
                      type="text"
                      value={formState.supplier}
                      onChange={(event) => setFormState((prev) => ({ ...prev, supplier: event.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={3}
                    value={formState.description}
                    onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeFormModal}
                    className="flex-1 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200"
                    style={{
                      color: theme.text || '#111827',
                      backgroundColor: `${theme.primary}10`,
                      border: `1px solid ${theme.primary}20`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${theme.primary}15`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = `${theme.primary}10`
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 text-white rounded-xl font-semibold disabled:opacity-60 transition-all duration-200"
                    style={{
                      backgroundColor: theme.primary,
                      boxShadow: `0 1px 3px rgba(0,0,0,0.1), 0 0 0 1px ${theme.primary}20`
                    }}
                    onMouseEnter={(e) => {
                      if (!submitting) {
                        e.currentTarget.style.backgroundColor = theme.secondary
                        e.currentTarget.style.boxShadow = `0 2px 8px ${theme.primary}40, 0 0 0 1px ${theme.primary}20`
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.primary
                      e.currentTarget.style.boxShadow = `0 1px 3px rgba(0,0,0,0.1), 0 0 0 1px ${theme.primary}20`
                    }}
                  >
                    {submitting ? 'Saving...' : editingIngredient ? 'Update Ingredient' : 'Create Ingredient'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdjustModal && adjustingIngredient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={closeAdjustModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Adjust Stock: {adjustingIngredient.name}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Current stock: <span className="font-semibold">{adjustingIngredient.currentStock} {adjustingIngredient.unit}</span>
              </p>

              <form onSubmit={handleAdjustSubmit} className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Transaction Type</label>
                  <select
                    value={adjustState.transactionType}
                    onChange={(event) =>
                      setAdjustState((prev) => ({ ...prev, transactionType: event.target.value as TransactionType }))
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    <option value="purchase">Purchase (Add)</option>
                    <option value="adjustment">Adjustment</option>
                    <option value="waste">Waste (Remove)</option>
                    <option value="return">Return (Add)</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Quantity Change (use negative numbers to reduce stock)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={adjustState.quantityChange}
                    onChange={(event) => setAdjustState((prev) => ({ ...prev, quantityChange: event.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="e.g. 25 or -10"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    rows={2}
                    value={adjustState.notes}
                    onChange={(event) => setAdjustState((prev) => ({ ...prev, notes: event.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="Reason for adjustment..."
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeAdjustModal}
                    className="flex-1 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200"
                    style={{
                      color: theme.text || '#111827',
                      backgroundColor: `${theme.primary}10`,
                      border: `1px solid ${theme.primary}20`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${theme.primary}15`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = `${theme.primary}10`
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adjustSubmitting}
                    className="flex-1 px-4 py-2.5 text-white rounded-xl font-semibold disabled:opacity-60 transition-all duration-200"
                    style={{
                      backgroundColor: theme.primary,
                      boxShadow: `0 1px 3px rgba(0,0,0,0.1), 0 0 0 1px ${theme.primary}20`
                    }}
                    onMouseEnter={(e) => {
                      if (!adjustSubmitting) {
                        e.currentTarget.style.backgroundColor = theme.secondary
                        e.currentTarget.style.boxShadow = `0 2px 8px ${theme.primary}40, 0 0 0 1px ${theme.primary}20`
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.primary
                      e.currentTarget.style.boxShadow = `0 1px 3px rgba(0,0,0,0.1), 0 0 0 1px ${theme.primary}20`
                    }}
                  >
                    {adjustSubmitting ? 'Applying...' : 'Apply Adjustment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  )
}
