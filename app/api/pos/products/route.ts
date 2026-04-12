import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key'

type DecodedToken = {
  employeeId?: number
  tenantId?: number
  role?: string
  id?: string
  userType?: string
}

const verifyToken = async (request: NextRequest): Promise<DecodedToken | null> => {
  try {
    // Try to get NextAuth token from cookies
    const token = await getToken({
      req: request,
      secret: JWT_SECRET
    })

    if (!token) {
      return null
    }

    return {
      employeeId: parseInt(token.id as string),
      tenantId: parseInt((token as any).tenantId as string),
      role: token.role as string,
      userType: (token as any).userType as string
    }
  } catch (error) {
    console.error('[POS Auth] Token verification failed:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const products = await prisma.product.findMany({
      where: {
        tenantId: decoded.tenantId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        price: true,
        image: true,
        currentStock: true,
        trackInventory: true,
        productVariants: {
          select: {
            id: true,
            name: true,
            price: true,
            isActive: true,
            variantIngredients: {
              select: {
                ingredientId: true,
                quantity: true,
                ingredient: {
                  select: {
                    currentStock: true,
                    reservedStock: true,
                    id: true
                  }
                }
              }
            }
          },
          where: {
            isActive: true
          }
        },
        productIngredients: {
          select: {
            ingredient: {
              select: {
                currentStock: true,
                reservedStock: true,
                id: true
              }
            },
            quantity: true
          }
        },
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    const payload = products.map((product) => {
      let availableStock = 0
      let variantsWithStock: any[] = []
      
      // If product has variants, calculate stock for EACH variant
      if (product.productVariants.length > 0) {
        variantsWithStock = product.productVariants.map((variant) => {
          console.log(`[POS] Processing variant "${variant.name}" with ${variant.variantIngredients.length} ingredients`)
          
          let variantStock = 0
          
          if (variant.variantIngredients.length > 0) {
            // Has variant-specific ingredients
            const stockCalculations = variant.variantIngredients
              .filter(vi => vi.quantity > 0)
              .map((vi) => {
                const currentStock = vi.ingredient.currentStock ?? 0
                const reservedStock = vi.ingredient.reservedStock ?? 0
                const availableIngredient = currentStock - reservedStock
                const unitsPossible = Math.floor(availableIngredient / vi.quantity)
                console.log(`[POS] Ingredient ${vi.ingredientId}: current=${currentStock}, reserved=${reservedStock}, available=${availableIngredient}, needed=${vi.quantity}, units=${unitsPossible}`)
                return unitsPossible
              })
            
            if (stockCalculations.length > 0) {
              variantStock = Math.max(0, Math.min(...stockCalculations))
              console.log(`[POS] Variant "${variant.name}" calculated stock: ${variantStock} (min of ${stockCalculations})`)
            } else {
              variantStock = Math.max(0, product.currentStock ?? 0)
              console.log(`[POS] Variant "${variant.name}" has no stock calculations, using product stock: ${variantStock}`)
            }
          } else if (product.productIngredients.length > 0) {
            console.log(`[POS] Variant "${variant.name}" has no variant ingredients, falling back to product ingredients`)
            // Use product-level ingredients
            const stockCalculations = product.productIngredients
              .filter(pi => pi.quantity > 0)
              .map((pi) => {
                const currentStock = pi.ingredient.currentStock ?? 0
                const reservedStock = pi.ingredient.reservedStock ?? 0
                const availableIngredient = currentStock - reservedStock
                return Math.floor(availableIngredient / pi.quantity)
              })
            
            if (stockCalculations.length > 0) {
              variantStock = Math.max(0, Math.min(...stockCalculations))
            } else {
              variantStock = Math.max(0, product.currentStock ?? 0)
            }
          } else if (product.trackInventory) {
            variantStock = Math.max(0, product.currentStock ?? 0)
            console.log(`[POS] Variant "${variant.name}" using product current stock: ${variantStock}`)
          } else {
            variantStock = 999
            console.log(`[POS] Variant "${variant.name}" has no inventory tracking, stock: ${variantStock}`)
          }
          
          return {
            ...variant,
            stockQuantity: variantStock
          }
        })
        
        // Overall product stock is the maximum of all variants (product is in stock if ANY variant is available)
        availableStock = Math.max(...variantsWithStock.map(v => v.stockQuantity))
      } else if (product.productIngredients.length > 0) {
        // No variants: calculate based on product ingredients
        const stockCalculations = product.productIngredients
          .filter(pi => pi.quantity > 0)
          .map((pi) => {
            const currentStock = pi.ingredient.currentStock ?? 0
            const reservedStock = pi.ingredient.reservedStock ?? 0
            const availableIngredient = currentStock - reservedStock
            return Math.floor(availableIngredient / pi.quantity)
          })
        
        if (stockCalculations.length > 0) {
          availableStock = Math.max(0, Math.min(...stockCalculations))
        } else {
          availableStock = Math.max(0, product.currentStock ?? 0)
        }
      } else if (product.trackInventory) {
        availableStock = Math.max(0, product.currentStock ?? 0)
      } else {
        availableStock = 999
      }

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        stockQuantity: availableStock,
        category: product.category ?? undefined,
        productVariants: product.productVariants.length > 0 
          ? product.productVariants.map((v, idx) => ({
              id: v.id,
              name: v.name,
              price: v.price,
              isActive: v.isActive,
              stockQuantity: variantsWithStock[idx]?.stockQuantity ?? 0
            }))
          : product.productVariants.map(v => ({
              id: v.id,
              name: v.name,
              price: v.price,
              isActive: v.isActive,
              stockQuantity: availableStock
            }))
      }
    })

    return NextResponse.json({ products: payload })
  } catch (error) {
    console.error('Failed to fetch POS products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
