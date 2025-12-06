import { z } from 'zod'

export const createPOSOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.number().positive('Product ID required'),
      quantity: z.number().positive('Quantity must be positive'),
      notes: z.string().optional()
    })
  ).min(1, 'At least one item required'),
  paymentMethod: z.enum(['cash', 'card', 'digital']),
  discount: z.number().nonnegative().optional().default(0)
})

export const createIngredientSchema = z.object({
  name: z.string().min(1, 'Name required').max(100),
  unit: z.string().min(1, 'Unit required'),
  minStock: z.number().nonnegative(),
  currentStock: z.number().nonnegative()
})
