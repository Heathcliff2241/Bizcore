'use client'

import Image from 'next/image'
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  TagIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  LightBulbIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useSettings } from '@/lib/settings-context'
import { exportFromAPI } from '@/lib/csv-export'
import { useRecentItems } from '@/hooks/useRecentItems'

interface IngredientRecord {
  id: number
  name: string
  unit: string
  unit_of_measure?: string
}

interface CategoryRecord {
  id: number
  name: string
}

interface ProductIngredientLink {
  id: number
  name: string
  unit_of_measure: string
  ProductIngredient?: {
    quantity_required: number
  }
}

interface ProductVariant {
  id: number
  name: string
  price: number
  isActive: boolean
}

interface ProductRecord {
  id: number
  name: string
  sku: string | null
  description: string | null
  price: number
  cost_price: number
  image: string | null
  category_id: number | null
  category_name?: string | null
  Category?: { id: number; name: string } | null
  track_inventory?: boolean
  current_stock?: number
  low_stock_threshold?: number
  is_active: boolean
  Ingredients?: ProductIngredientLink[]
  productVariants?: ProductVariant[]
}

interface ProductsManagerProps {
  subdomain?: string
}

interface ProductFormState {
  name: string
  sku: string
  categoryId: string
  price: string
  costPrice: string
  description: string
  image: string
  trackInventory: boolean
  currentStock: string
  lowStockThreshold: string
  isActive: boolean
}

interface SelectedIngredient {
  id: number
  name: string
  unitOfMeasure: string
  quantity: string
}

interface VariantFormState {
  name: string
  price: string
  isActive: boolean
}

const defaultFormState: ProductFormState = {
  name: '',
  sku: '',
  categoryId: '',
  price: '',
  costPrice: '',
  description: '',
  image: '',
  trackInventory: true,
  currentStock: '0',
  lowStockThreshold: '10',
  isActive: true
}

const defaultVariantFormState: VariantFormState = {
  name: '',
  price: '',
  isActive: true
}

function formatCurrency(value: number | string | null | undefined) {
  const amount = typeof value === 'number' ? value : Number(value ?? 0)
  if (!Number.isFinite(amount)) {
    return '₱0.00'
  }
  return `₱${amount.toFixed(2)}`
}

function calculateAvailableStock(product: ProductRecord): number {
  // If product has ingredients, calculate based on limiting ingredient
  if ((product.Ingredients?.length ?? 0) > 0) {
    // This is a placeholder - actual ingredient stock would come from the product data
    // For now, show ingredient count to indicate ingredient-based product
    return -1 // Return -1 to indicate "ingredient-based" for UI purposes
  }
  // If no ingredients, use direct stock
  return Number(product.current_stock ?? 0)
}

export function ProductsManager({ subdomain }: ProductsManagerProps) {
  const { settings } = useSettings()
  const theme = {
    primary: settings.brandColors.primary,
    secondary: settings.brandColors.secondary,
    accent: settings.brandColors.accent,
    background: settings.brandColors.background,
    surface: settings.brandColors.surface,
    text: settings.brandColors.text
  }

  const [products, setProducts] = useState<ProductRecord[]>([])
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [ingredients, setIngredients] = useState<IngredientRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null)
  const [formState, setFormState] = useState<ProductFormState>(defaultFormState)
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([])
  const [selectedIngredientId, setSelectedIngredientId] = useState('')
  const [selectedIngredientQuantity, setSelectedIngredientQuantity] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showVariantForm, setShowVariantForm] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [variantFormState, setVariantFormState] = useState<VariantFormState>(defaultVariantFormState)
  const [exporting, setExporting] = useState(false)
  const [showVariantIngredientsModal, setShowVariantIngredientsModal] = useState(false)
  const [variantIngredientsMap, setVariantIngredientsMap] = useState<Record<number, Array<{ingredientId: number; quantity: number}>>>({})

  // Recent items tracking
  const { addRecentItem } = useRecentItems(subdomain)

  const querySuffix = useMemo(
    () => (subdomain ? `?subdomain=${encodeURIComponent(subdomain)}` : ''),
    [subdomain]
  )

  const productsEndpoint = useMemo(() => `/api/products${querySuffix}`, [querySuffix])
  const productEndpoint = useCallback((id: number) => `/api/products/${id}${querySuffix}`, [querySuffix])
  const categoriesEndpoint = useMemo(() => `/api/categories${querySuffix}`, [querySuffix])
  const ingredientsEndpoint = useMemo(() => `/api/ingredients${querySuffix}`, [querySuffix])

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(productsEndpoint)
      if (!response.ok) {
        throw new Error('Failed to load products')
      }

      const payload = await response.json()
      const data: ProductRecord[] = payload?.data ?? []
      console.log('[ProductsManager] Fetched products:', {
        count: data.length,
        sampleProduct: data[0] ? {
          id: data[0].id,
          name: data[0].name,
          trackInventory: data[0].track_inventory,
          currentStock: data[0].current_stock,
          lowStockThreshold: data[0].low_stock_threshold
        } : null
      })
      setProducts(data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }, [productsEndpoint])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(categoriesEndpoint)
      if (!response.ok) {
        throw new Error('Failed to load categories')
      }

      const payload = await response.json()
      const data: CategoryRecord[] = payload?.data?.categories ?? []
      setCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }, [categoriesEndpoint])

  const fetchIngredients = useCallback(async () => {
    try {
      const response = await fetch(ingredientsEndpoint)
      if (!response.ok) {
        throw new Error('Failed to load ingredients')
      }

      const payload = await response.json()
      const data: IngredientRecord[] = payload?.data?.ingredients ?? []
      setIngredients(data)
    } catch (error) {
      console.error('Failed to fetch ingredients:', error)
    }
  }, [ingredientsEndpoint])

  useEffect(() => {
    void fetchProducts()
    void fetchCategories()
    void fetchIngredients()
  }, [fetchCategories, fetchIngredients, fetchProducts])

  const resetForm = useCallback(() => {
    setShowForm(false)
    setEditingProduct(null)
    setFormState(defaultFormState)
    setSelectedIngredients([])
    setSelectedIngredientId('')
    setSelectedIngredientQuantity('')
    setImagePreview(null)
  }, [])

  const openCreateModal = useCallback(() => {
    setEditingProduct(null)
    setFormState(defaultFormState)
    setSelectedIngredients([])
    setSelectedIngredientId('')
    setSelectedIngredientQuantity('')
    setImagePreview(null)
    setShowForm(true)
  }, [])

  const handleEdit = useCallback((product: ProductRecord) => {
    setEditingProduct(product)
    
    // Track as recent item
    addRecentItem({
      id: product.id,
      type: 'product',
      title: product.name,
      subtitle: product.category_name || 'Uncategorized',
      url: subdomain ? `/dashboard/${subdomain}/catalog` : '/catalog',
    })
    
    setFormState({
      name: product.name,
      sku: product.sku ?? '',
      categoryId: product.category_id ? String(product.category_id) : '',
      price: product.price != null ? String(product.price) : '',
      costPrice: product.cost_price != null ? String(product.cost_price) : '',
      description: product.description ?? '',
      image: product.image ?? '',
      trackInventory: Boolean(product.track_inventory),
      currentStock: product.current_stock != null ? String(product.current_stock) : '0',
      lowStockThreshold: product.low_stock_threshold != null ? String(product.low_stock_threshold) : '10',
      isActive: product.is_active
    })

    setSelectedIngredients(
      (product.Ingredients ?? []).map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        unitOfMeasure: ingredient.unit_of_measure,
        quantity: ingredient.ProductIngredient?.quantity_required != null
          ? String(ingredient.ProductIngredient.quantity_required)
          : '0'
      }))
    )

    setSelectedIngredientId('')
    setSelectedIngredientQuantity('')
    setImagePreview(product.image ?? null)
    setShowForm(true)
  }, [addRecentItem, subdomain])

  const handleDelete = useCallback(
    async (product: ProductRecord) => {
      if (!confirm(`Delete product "${product.name}"? This cannot be undone.`)) {
        return
      }

      try {
        const response = await fetch(productEndpoint(product.id), {
          method: 'DELETE'
        })

        if (!response.ok) {
          const error = await response
            .json()
            .catch(() => ({ message: 'Failed to delete product' }))
          throw new Error(error.message || 'Failed to delete product')
        }

        await fetchProducts()
      } catch (error) {
        console.error('Failed to delete product:', error)
        alert(error instanceof Error ? error.message : 'Failed to delete product')
      }
    },
    [fetchProducts, productEndpoint]
  )

  const handleExportCSV = useCallback(async () => {
    if (!subdomain) {
      alert('Subdomain is required for export')
      return
    }

    setExporting(true)
    try {
      const params = new URLSearchParams({
        subdomain,
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(searchTerm && { search: searchTerm }),
      })

      const result = await exportFromAPI(
        `/api/tenant/export/products?${params}`,
        `products_export_${subdomain}_${new Date().toISOString().split('T')[0]}`
      )

      if (!result.success) {
        alert(result.error || 'Failed to export products')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export products')
    } finally {
      setExporting(false)
    }
  }, [subdomain, selectedCategory, searchTerm])

  const handleImageChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result === 'string') {
        setImagePreview(result)
        setFormState((prev) => ({ ...prev, image: result }))
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const addIngredient = useCallback(() => {
    const ingredientId = Number(selectedIngredientId)
    const quantity = Number(selectedIngredientQuantity)

    if (!Number.isFinite(ingredientId) || ingredientId <= 0) {
      alert('Please select an ingredient to add.')
      return
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity.')
      return
    }

    if (selectedIngredients.some((ingredient) => ingredient.id === ingredientId)) {
      alert('This ingredient is already added.')
      return
    }

    const ingredient = ingredients.find((item) => item.id === ingredientId)
    if (!ingredient) {
      alert('Selected ingredient was not found.')
      return
    }

    setSelectedIngredients((previous) => [
      ...previous,
      {
        id: ingredient.id,
        name: ingredient.name,
        unitOfMeasure: ingredient.unit_of_measure ?? ingredient.unit ?? '',
        quantity: quantity.toString()
      }
    ])

    setSelectedIngredientId('')
    setSelectedIngredientQuantity('')
  }, [ingredients, selectedIngredientId, selectedIngredientQuantity, selectedIngredients])

  const removeIngredient = useCallback((id: number) => {
    setSelectedIngredients((previous) => previous.filter((ingredient) => ingredient.id !== id))
  }, [])

  const updateIngredientQuantity = useCallback((id: number, value: string) => {
    setSelectedIngredients((previous) =>
      previous.map((ingredient) =>
        ingredient.id === id ? { ...ingredient, quantity: value } : ingredient
      )
    )
  }, [])

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      try {
        setSubmitting(true)

        const priceValue = Number(formState.price)
        const costValue = Number(formState.costPrice)
        const categoryIdValue = formState.categoryId ? Number(formState.categoryId) : null

        if (!formState.name.trim()) {
          alert('Product name is required.')
          return
        }

        if (!Number.isFinite(priceValue)) {
          alert('Please provide a valid price.')
          return
        }

        if (categoryIdValue !== null && !Number.isInteger(categoryIdValue)) {
          alert('Please select a valid category.')
          return
        }

        const ingredientsPayload = selectedIngredients
          .map((ingredient) => ({
            ingredient_id: ingredient.id,
            quantity_required: Number(ingredient.quantity)
          }))
          .filter((ingredient) => Number.isFinite(ingredient.quantity_required) && ingredient.quantity_required > 0)

        const currentStockValue = Number(formState.currentStock)
        const lowStockValue = Number(formState.lowStockThreshold)

        const payload = {
          name: formState.name.trim(),
          description: formState.description.trim() || undefined,
          price: priceValue,
          cost_price: Number.isFinite(costValue) ? costValue : 0,
          image: formState.image.trim() || undefined,
          category_id: categoryIdValue,
          is_active: formState.isActive,
          track_inventory: formState.trackInventory,
          current_stock: Number.isFinite(currentStockValue) ? currentStockValue : 0,
          low_stock_threshold: Number.isFinite(lowStockValue) ? lowStockValue : 10,
          ingredients: ingredientsPayload
        }

        const targetUrl = editingProduct ? productEndpoint(editingProduct.id) : productsEndpoint
        const method = editingProduct ? 'PUT' : 'POST'

        console.log('[ProductsManager] Form submission:', {
          method,
          payload,
          isEditing: !!editingProduct,
          trackInventory: formState.trackInventory,
          currentStock: currentStockValue,
          lowStockThreshold: lowStockValue
        })

        const response = await fetch(targetUrl, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        console.log('[ProductsManager] API response status:', response.status)

        if (!response.ok) {
          const error = await response
            .json()
            .catch(() => ({ message: 'Failed to save product' }))
          throw new Error(error.message || 'Failed to save product')
        }

        await fetchProducts()
        resetForm()
      } catch (error) {
        console.error('Failed to save product:', error)
        alert(error instanceof Error ? error.message : 'Failed to save product')
      } finally {
        setSubmitting(false)
      }
    },
    [editingProduct, fetchProducts, formState, productEndpoint, productsEndpoint, resetForm, selectedIngredients]
  )

  const handleVariantSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!editingProduct) return

      try {
        setSubmitting(true)

        const priceValue = parseFloat(variantFormState.price)
        if (!variantFormState.name.trim()) {
          alert('Variant name is required')
          return
        }

        if (!Number.isFinite(priceValue) || priceValue <= 0) {
          alert('Price must be a valid positive number')
          return
        }

        const method = editingVariant ? 'PUT' : 'POST'
        const url = editingVariant
          ? `/api/products/${editingProduct.id}/variants/${editingVariant.id}${querySuffix}`
          : `/api/products/${editingProduct.id}/variants${querySuffix}`

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: variantFormState.name.trim(),
            price: priceValue,
            isActive: variantFormState.isActive
          })
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Failed to save variant' }))
          throw new Error(error.message || 'Failed to save variant')
        }

        const responseData = await response.json()
        const savedVariant = responseData.data

        // Update the product with new variant
        setEditingProduct((prev) => {
          if (!prev) return prev
          const variants = prev.productVariants ?? []

          if (editingVariant) {
            return {
              ...prev,
              productVariants: variants.map((v) =>
                v.id === editingVariant.id
                  ? { ...v, name: variantFormState.name, price: priceValue, isActive: variantFormState.isActive }
                  : v
              )
            }
          } else {
            // Use the real variant ID returned from the server
            const newVariant: ProductVariant = {
              id: savedVariant.id,
              name: savedVariant.name,
              price: savedVariant.price,
              isActive: savedVariant.isActive
            }
            return {
              ...prev,
              productVariants: [...variants, newVariant]
            }
          }
        })

        setVariantFormState(defaultVariantFormState)
        setEditingVariant(null)
        setShowVariantForm(false)
      } catch (error) {
        console.error('Failed to save variant:', error)
        alert(error instanceof Error ? error.message : 'Failed to save variant')
      } finally {
        setSubmitting(false)
      }
    },
    [editingProduct, editingVariant, variantFormState, querySuffix]
  )

  const handleDeleteVariant = useCallback(
    async (variant: ProductVariant) => {
      if (!editingProduct) return

      if (!confirm(`Delete variant "${variant.name}"?`)) {
        return
      }

      try {
        const response = await fetch(
          `/api/products/${editingProduct.id}/variants/${variant.id}${querySuffix}`,
          { method: 'DELETE' }
        )

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Failed to delete variant' }))
          throw new Error(error.message || 'Failed to delete variant')
        }

        setEditingProduct((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            productVariants: (prev.productVariants ?? []).filter((v) => v.id !== variant.id)
          }
        })
      } catch (error) {
        console.error('Failed to delete variant:', error)
        alert(error instanceof Error ? error.message : 'Failed to delete variant')
      }
    },
    [editingProduct, querySuffix]
  )

  const openVariantForm = useCallback((variant?: ProductVariant) => {
    if (variant) {
      setEditingVariant(variant)
      setVariantFormState({
        name: variant.name,
        price: variant.price.toString(),
        isActive: variant.isActive
      })
    } else {
      setEditingVariant(null)
      setVariantFormState(defaultVariantFormState)
    }
    setShowVariantForm(true)
  }, [])

  const closeVariantForm = useCallback(() => {
    setShowVariantForm(false)
    setEditingVariant(null)
    setVariantFormState(defaultVariantFormState)
  }, [])


  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return products.filter((product) => {
      const matchesSearch = term
        ? product.name.toLowerCase().includes(term) ||
          (product.sku ?? '').toLowerCase().includes(term)
        : true

      const matchesCategory =
        selectedCategory === 'all' ? true : String(product.category_id ?? '') === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [products, searchTerm, selectedCategory])

  const lowStockProducts = useMemo(
    () =>
      products.filter((product) => {
        if (!product.track_inventory) {
          return false
        }
        const current = Number(product.current_stock ?? 0)
        const threshold = Number(product.low_stock_threshold ?? 0)
        if (!Number.isFinite(current) || !Number.isFinite(threshold)) {
          return false
        }
        return current <= threshold
      }),
    [products]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">Loading products...</div>
      </div>
    )
  }

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex-1 p-8" 
      style={{ backgroundColor: theme.background || '#f9fafb' }}
    >
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h2 
            className="text-3xl font-bold tracking-tight"
            style={{ color: theme.text || '#111827' }}
          >
            {subdomain ? `${subdomain} Products` : 'Products'}
          </h2>
          <p 
            className="mt-2 text-sm"
            style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}
          >
            Organize products and manage categories for {subdomain || 'your store'}
          </p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportCSV}
            disabled={exporting || filteredProducts.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 border rounded-xl font-semibold shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              borderColor: `${theme.primary}40`,
              color: theme.primary,
              backgroundColor: 'white',
              boxShadow: `0 1px 2px rgba(0,0,0,0.04)`
            }}
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-semibold shadow-sm transition-shadow duration-200"
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
            Add Product
          </motion.button>
        </div>
      </motion.div>

      {lowStockProducts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="p-5 mb-6 border rounded-xl backdrop-blur-xl"
          style={{
            backgroundColor: '#fef3c7',
            borderColor: '#fbbf2420',
            boxShadow: '0 1px 3px rgba(251,191,36,0.1)'
          }}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-700" />
            </div>
            <h3 className="font-bold text-yellow-900">Low Stock Alert</h3>
          </div>
          <p className="text-sm font-medium text-yellow-800">
            {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's are' : ' is'} running low on stock
          </p>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-3"
      >
        <div className="relative">
          <MagnifyingGlassIcon 
            className="absolute w-5 h-5 top-3.5 left-4 transition-colors duration-200" 
            style={{ color: theme.text ? `${theme.text}60` : '#9ca3af' }}
          />
          <input
            type="text"
            placeholder="Search products..."
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
        <div className="relative">
          <FunnelIcon 
            className="absolute w-5 h-5 top-3.5 left-4 transition-colors duration-200" 
            style={{ color: theme.text ? `${theme.text}60` : '#9ca3af' }}
          />
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
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
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {filteredProducts.length === 0 ? (
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
          <p className="font-medium">No products found. Try adjusting your filters or add a new product.</p>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="p-6 bg-white border rounded-2xl shadow-sm backdrop-blur-xl overflow-hidden group"
              style={{
                borderColor: `${theme.primary}20`,
                boxShadow: `0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px ${theme.primary}10`
              }}
            >
              {product.image && (
                <div className="relative mb-5 h-48 rounded-xl overflow-hidden" style={{ backgroundColor: `${theme.primary}08` }}>
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    unoptimized
                  />
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 
                    className="font-bold text-lg"
                    style={{ color: theme.text || '#111827' }}
                  >
                    {product.name}
                  </h3>
                  {product.sku && (
                    <p 
                      className="text-xs mt-1 font-medium"
                      style={{ color: theme.text ? `${theme.text}80` : '#6b7280' }}
                    >
                      {product.sku}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEdit(product)}
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
                  >
                    <PencilIcon className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(product)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    style={{
                      backgroundColor: '#fee2e210'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fee2e2'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fee2e210'
                    }}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: `${theme.primary}15` }}
                  >
                    <span 
                      className="text-sm font-bold"
                      style={{ color: theme.primary }}
                    >
                      ₱
                    </span>
                  </div>
                  {/* Show variant price range if variants exist, otherwise show base price */}
                  {(product.productVariants?.length ?? 0) > 0 ? (
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 font-medium">From</span>
                      <span 
                        className="font-bold text-lg"
                        style={{ color: theme.primary }}
                      >
                        {formatCurrency(Math.min(...product.productVariants!.map(v => v.price)))}
                        {product.productVariants!.length > 1 && (
                          <span className="text-sm font-medium text-slate-500 ml-1">
                            - {formatCurrency(Math.max(...product.productVariants!.map(v => v.price)))}
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-blue-600 mt-0.5">
                        {product.productVariants!.length} size{product.productVariants!.length > 1 ? 's' : ''} available
                      </span>
                    </div>
                  ) : (
                    <span 
                      className="font-bold text-lg"
                      style={{ color: theme.primary }}
                    >
                      {formatCurrency(product.price)}
                    </span>
                  )}
                  {Number.isFinite(product.cost_price) && product.cost_price > 0 && (product.productVariants?.length ?? 0) === 0 && (
                    <span 
                      className="text-xs font-medium"
                      style={{ color: theme.text ? `${theme.text}70` : '#6b7280' }}
                    >
                      (Cost: {formatCurrency(product.cost_price)})
                    </span>
                  )}
                </div>

                {product.track_inventory && (
                  <div 
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                    style={{ backgroundColor: `${theme.primary}08` }}
                  >
                    <CubeIcon 
                      className="w-4 h-4"
                      style={{ color: theme.text ? `${theme.text}80` : '#6b7280' }}
                    />
                    {(product.Ingredients?.length ?? 0) > 0 ? (
                      <>
                        <span
                          className="text-sm font-semibold"
                          style={{ color: theme.text || '#111827' }}
                        >
                          Stock: Based on Ingredients
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-lg font-semibold"
                          style={{
                            backgroundColor: '#e0e7ff',
                            color: '#3730a3'
                          }}
                        >
                          {product.Ingredients?.length} ingredient(s)
                        </span>
                      </>
                    ) : (
                      <span
                        className="text-sm font-semibold"
                        style={{
                          color: Number(product.current_stock ?? 0) <= Number(product.low_stock_threshold ?? 0)
                            ? '#dc2626'
                            : theme.text || '#111827'
                        }}
                      >
                        Stock: {product.current_stock ?? 0}
                      </span>
                    )}
                  </div>
                )}

                {(product.Category || product.category_name) && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <TagIcon 
                      className="w-4 h-4"
                      style={{ color: theme.text ? `${theme.text}60` : '#6b7280' }}
                    />
                    <span 
                      className="font-medium"
                      style={{ color: theme.text ? `${theme.text}99` : '#111827' }}
                    >
                      {product.Category?.name ?? product.category_name}
                    </span>
                  </div>
                )}
              </div>

              {!product.is_active && (
                <div 
                  className="mt-4 px-3 py-1.5 rounded-lg text-xs font-semibold inline-block"
                  style={{
                    backgroundColor: `${theme.text}10`,
                    color: theme.text ? `${theme.text}80` : '#6b7280'
                  }}
                >
                  Inactive
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={resetForm}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl p-6 bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="mb-6 text-2xl font-semibold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">SKU</label>
                    <input
                      type="text"
                      value={formState.sku}
                      onChange={(event) => setFormState((prev) => ({ ...prev, sku: event.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Category</label>
                    <select
                      value={formState.categoryId}
                      onChange={(event) => setFormState((prev) => ({ ...prev, categoryId: event.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={String(category.id)}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Price (₱) 
                      {(editingProduct?.productVariants?.length ?? 0) > 0 ? (
                        <span className="text-gray-500 font-normal text-xs ml-2">(Optional - using size variant pricing)</span>
                      ) : (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required={(editingProduct?.productVariants?.length ?? 0) === 0}
                      value={formState.price}
                      onChange={(event) => setFormState((prev) => ({ ...prev, price: event.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      placeholder="0.00"
                    />
                    {(editingProduct?.productVariants?.length ?? 0) > 0 && (
                      <p className="text-xs text-blue-600 mt-1 flex items-center gap-1"><LightBulbIcon className="w-3.5 h-3.5" /> This product has size variants. Variant prices will be used instead of this base price.</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Cost Price (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formState.costPrice}
                      onChange={(event) => setFormState((prev) => ({ ...prev, costPrice: event.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 h-10">
                      <input
                        type="checkbox"
                        checked={formState.trackInventory}
                        onChange={(event) => setFormState((prev) => ({ ...prev, trackInventory: event.target.checked }))}
                        className="w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-opacity-50"
                      />
                      Track Inventory
                    </label>
                  </div>
                </div>

                {formState.trackInventory && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Current Stock</label>
                      <input
                        type="number"
                        value={formState.currentStock}
                        onChange={(event) => setFormState((prev) => ({ ...prev, currentStock: event.target.value }))}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Low Stock Threshold</label>
                      <input
                        type="number"
                        value={formState.lowStockThreshold}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, lowStockThreshold: event.target.value }))
                        }
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={3}
                    value={formState.description}
                    onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Product Image</label>
                  <div className="flex items-center gap-4">
                    {imagePreview && (
                      <div className="relative w-24 h-24 border-2 border-gray-200 rounded-lg overflow-hidden">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-cover"
                          sizes="96px"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 text-sm"
                      />
                      <input
                        type="url"
                        placeholder="Or paste an image URL"
                        value={formState.image}
                        onChange={(event) => setFormState((prev) => ({ ...prev, image: event.target.value }))}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 text-sm"
                      />
                      <p className="text-xs text-gray-500">Upload an image or paste a hosted URL.</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Recipe / Ingredients</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Associate ingredients used to prepare this product for more accurate inventory tracking.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <select
                      value={selectedIngredientId}
                      onChange={(event) => setSelectedIngredientId(event.target.value)}
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    >
                      <option value="">Select ingredient...</option>
                      {ingredients.map((ingredient) => (
                        <option key={ingredient.id} value={String(ingredient.id)}>
                          {ingredient.name} ({ingredient.unit_of_measure ?? ingredient.unit ?? ''})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Quantity required"
                      value={selectedIngredientQuantity}
                      onChange={(event) => setSelectedIngredientQuantity(event.target.value)}
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    />

                    <button
                      type="button"
                      onClick={addIngredient}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add Ingredient
                    </button>
                  </div>

                  {selectedIngredients.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Selected Ingredients</p>
                      {selectedIngredients.map((ingredient) => (
                        <div
                          key={ingredient.id}
                          className="flex items-center justify-between bg-white p-2 rounded border border-gray-200"
                        >
                          <div className="flex-1 mr-4">
                            <p className="text-sm font-medium text-gray-900">{ingredient.name}</p>
                            <p className="text-xs text-gray-500">{ingredient.unitOfMeasure}</p>
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={ingredient.quantity}
                            onChange={(event) => updateIngredientQuantity(ingredient.id, event.target.value)}
                            className="w-32 px-3 py-1 border border-gray-200 rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeIngredient(ingredient.id)}
                            className="ml-3 text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Size Variants Section - Redesigned */}
                <div className="border-t pt-6 mt-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Size Variants & Pricing</h3>
                    <p className="text-sm text-gray-500">
                      Enable size variants to set different prices for each size. Leave unchecked to use base price only.
                    </p>
                  </div>

                  {/* Use Variants Toggle */}
                  <div className="mb-4">
                    <label className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={(editingProduct?.productVariants?.length ?? 0) > 0 || showVariantForm}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setShowVariantForm(true)
                          } else {
                            // Clear all variants if unchecked
                            if (editingProduct?.productVariants?.length && confirm('This will remove all size variants. Continue?')) {
                              // Delete all variants via API
                              editingProduct.productVariants?.forEach(v => handleDeleteVariant(v))
                            }
                            setShowVariantForm(false)
                          }
                        }}
                        className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-blue-900">Enable Size Variants</span>
                        <p className="text-xs text-blue-700">Set different prices for Small, Medium, Large, etc.</p>
                      </div>
                    </label>
                  </div>

                  {/* Inline Variant Editor - Show when editing a product */}
                  {(showVariantForm || (editingProduct?.productVariants?.length ?? 0) > 0) && (
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold text-slate-700">Configure Size Prices</p>
                        {editingProduct && (
                          <button
                            type="button"
                            onClick={() => openVariantForm()}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1.5 transition-colors"
                          >
                            <PlusIcon className="w-4 h-4" />
                            Add Size
                          </button>
                        )}
                      </div>

                      {/* Quick Add Presets */}
                      {editingProduct && (editingProduct.productVariants?.length ?? 0) === 0 && (
                        <div className="mb-4 p-3 bg-white rounded-lg border border-slate-200">
                          <p className="text-xs font-medium text-slate-600 mb-2">Quick Add Common Sizes:</p>
                          <div className="flex flex-wrap gap-2">
                            {['Small', 'Medium', 'Large', 'Extra Large', '8oz', '12oz', '16oz', 'Solo', 'Duo', 'Family'].map((sizeName) => {
                              const exists = editingProduct.productVariants?.some(v => v.name.toLowerCase() === sizeName.toLowerCase())
                              return (
                                <button
                                  key={sizeName}
                                  type="button"
                                  disabled={exists}
                                  onClick={async () => {
                                    // Prompt for price
                                    const priceInput = prompt(`Enter price for ${sizeName}:`, formState.price || '0')
                                    if (priceInput === null) return // User cancelled
                                    
                                    const price = parseFloat(priceInput)
                                    if (isNaN(price) || price < 0) {
                                      alert('Please enter a valid price')
                                      return
                                    }
                                    
                                    try {
                                      const response = await fetch(`/api/products/${editingProduct.id}/variants${querySuffix}`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          name: sizeName,
                                          price: price,
                                          isActive: true
                                        })
                                      })
                                      if (response.ok) {
                                        const data = await response.json()
                                        setEditingProduct(prev => prev ? {
                                          ...prev,
                                          productVariants: [...(prev.productVariants ?? []), data.data]
                                        } : prev)
                                      }
                                    } catch (error) {
                                      console.error('Failed to add variant:', error)
                                    }
                                  }}
                                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                                    exists 
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                      : 'bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-700'
                                  }`}
                                >
                                  + {sizeName}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Variant List with Inline Price Editing */}
                      {(editingProduct?.productVariants?.length ?? 0) > 0 ? (
                        <div className="space-y-2">
                          {editingProduct?.productVariants?.map((variant) => (
                            <div
                              key={variant.id}
                              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-colors"
                            >
                              {/* Size Name */}
                              <div className="flex-1 min-w-0">
                                <input
                                  type="text"
                                  defaultValue={variant.name}
                                  onBlur={async (e) => {
                                    const newName = e.target.value.trim()
                                    if (newName && newName !== variant.name) {
                                      try {
                                        await fetch(`/api/products/${editingProduct.id}/variants/${variant.id}${querySuffix}`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ name: newName, price: variant.price, isActive: variant.isActive })
                                        })
                                        setEditingProduct(prev => prev ? {
                                          ...prev,
                                          productVariants: prev.productVariants?.map(v => 
                                            v.id === variant.id ? { ...v, name: newName } : v
                                          )
                                        } : prev)
                                      } catch (error) {
                                        console.error('Failed to update variant name:', error)
                                      }
                                    }
                                  }}
                                  className="w-full px-3 py-1.5 text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                                />
                              </div>

                              {/* Price Input */}
                              <div className="w-32">
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₱</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={variant.price.toFixed(2)}
                                    onBlur={async (e) => {
                                      const newPrice = parseFloat(e.target.value)
                                      if (!isNaN(newPrice) && newPrice !== variant.price) {
                                        try {
                                          await fetch(`/api/products/${editingProduct.id}/variants/${variant.id}${querySuffix}`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ name: variant.name, price: newPrice, isActive: variant.isActive })
                                          })
                                          setEditingProduct(prev => prev ? {
                                            ...prev,
                                            productVariants: prev.productVariants?.map(v => 
                                              v.id === variant.id ? { ...v, price: newPrice } : v
                                            )
                                          } : prev)
                                        } catch (error) {
                                          console.error('Failed to update variant price:', error)
                                        }
                                      }
                                    }}
                                    className="w-full pl-7 pr-3 py-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                                  />
                                </div>
                              </div>

                              {/* Active Toggle */}
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={variant.isActive}
                                  onChange={async (e) => {
                                    const newIsActive = e.target.checked
                                    try {
                                      await fetch(`/api/products/${editingProduct.id}/variants/${variant.id}${querySuffix}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ name: variant.name, price: variant.price, isActive: newIsActive })
                                      })
                                      setEditingProduct(prev => prev ? {
                                        ...prev,
                                        productVariants: prev.productVariants?.map(v => 
                                          v.id === variant.id ? { ...v, isActive: newIsActive } : v
                                        )
                                      } : prev)
                                    } catch (error) {
                                      console.error('Failed to update variant:', error)
                                    }
                                  }}
                                  className="sr-only"
                                />
                                <div className={`w-9 h-5 rounded-full transition-colors ${variant.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                  <div className={`w-4 h-4 mt-0.5 ml-0.5 bg-white rounded-full shadow transition-transform ${variant.isActive ? 'translate-x-4' : ''}`} />
                                </div>
                              </label>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteVariant(variant)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>

                              {/* Configure Ingredients Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingVariant(variant)
                                  setShowVariantIngredientsModal(true)
                                }}
                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Configure ingredient quantities for this variant"
                              >
                                <Cog6ToothIcon className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : !editingProduct ? (
                        <p className="text-sm text-slate-500 text-center py-4">
                          Save the product first, then you can add size variants.
                        </p>
                      ) : (
                        <p className="text-sm text-slate-500 text-center py-4">
                          No sizes added yet. Use quick add above or click &quot;Add Size&quot;.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Base Price Note when variants exist */}
                  {(editingProduct?.productVariants?.length ?? 0) > 0 && (
                    <p className="mt-3 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-start gap-2">
                      <LightBulbIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span><strong>Note:</strong> When size variants are enabled, the base price above is ignored. Customers will select a size and pay the variant price.</span>
                    </p>
                  )}
                </div>

                <div className="border-t pt-6 mt-6"></div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formState.trackInventory}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, trackInventory: event.target.checked }))
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-gray-700">Track Inventory</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formState.isActive}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, isActive: event.target.checked }))
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
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
                    {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Variant Form Modal */}
      <AnimatePresence>
        {showVariantForm && editingProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeVariantForm}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingVariant ? 'Edit Variant' : 'Add Variant'}
              </h2>

              <form onSubmit={handleVariantSubmit} className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Variant Name *</label>
                  <input
                    type="text"
                    value={variantFormState.name}
                    onChange={(e) => setVariantFormState({ ...variantFormState, name: e.target.value })}
                    placeholder="e.g., Small, Medium, Large"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Price (₱) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={variantFormState.price}
                    onChange={(e) => setVariantFormState({ ...variantFormState, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={variantFormState.isActive}
                    onChange={(e) => setVariantFormState({ ...variantFormState, isActive: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeVariantForm}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-60 transition-colors"
                  >
                    {submitting ? 'Saving...' : editingVariant ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Variant Ingredients Modal */}
        {showVariantIngredientsModal && editingVariant && editingProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowVariantIngredientsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">
                  Ingredient Quantities for &quot;{editingVariant.name}&quot;
                </h3>
                <button
                  onClick={() => setShowVariantIngredientsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">
                  Set ingredient quantities specific to this variant. Leave blank to use product-level quantities.
                </p>

                {(!editingProduct || !editingProduct.Ingredients || editingProduct.Ingredients.length === 0) ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No ingredients added to this product yet. Add ingredients to the product first.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {editingProduct.Ingredients.map((pi) => {
                      const currentQty = variantIngredientsMap[editingVariant.id]?.find(
                        (vi) => vi.ingredientId === pi.id
                      )?.quantity
                      return (
                        <div key={pi.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{pi.name}</p>
                              <p className="text-xs text-gray-500">Unit: {pi.unit_of_measure}</p>
                            </div>
                            <p className="text-sm font-semibold text-gray-600">
                              Product: {pi.ProductIngredient?.quantity_required} {pi.unit_of_measure}
                            </p>
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Leave blank to use product qty"
                            value={currentQty ?? ''}
                            onChange={(e) => {
                              const val = e.target.value
                              const qty = val ? parseFloat(val) : null
                              setVariantIngredientsMap((prev) => ({
                                ...prev,
                                [editingVariant.id]: [
                                  ...(prev[editingVariant.id] ?? []).filter((vi) => vi.ingredientId !== pi.id),
                                  ...(qty !== null ? [{ ingredientId: pi.id, quantity: qty }] : [])
                                ]
                              }))
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowVariantIngredientsModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      // Save variant ingredients to API
                      const ingredientsToSave = variantIngredientsMap[editingVariant.id] ?? []
                      try {
                        for (const ing of ingredientsToSave) {
                          await fetch(
                            `/api/products/${editingProduct.id}/variants/${editingVariant.id}/ingredients${querySuffix}`,
                            {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                ingredientId: ing.ingredientId,
                                quantity: ing.quantity
                              })
                            }
                          )
                        }
                        alert('Variant ingredients saved!')
                        setShowVariantIngredientsModal(false)
                      } catch (error) {
                        console.error('Failed to save variant ingredients:', error)
                        alert('Failed to save ingredient quantities')
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  )
}
