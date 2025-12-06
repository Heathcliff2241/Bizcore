import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key'

type DecodedToken = {
  employeeId: number
  tenantId: number
  role: string
}

const verifyToken = (request: NextRequest): DecodedToken | null => {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  try {
    const token = authHeader.substring(7)
    return jwt.verify(token, JWT_SECRET) as DecodedToken
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
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
            isActive: true
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
      
      if (product.productIngredients.length > 0) {
        // Has ingredients: calculate based on limiting ingredient
        // Available = (currentStock - reservedStock) / quantity_needed
        availableStock = Math.min(
          ...product.productIngredients.map((pi) => 
            Math.floor((pi.ingredient.currentStock - pi.ingredient.reservedStock) / pi.quantity)
          )
        )
      } else if (product.trackInventory) {
        // No ingredients but tracking inventory: use product stock
        availableStock = Math.max(0, product.currentStock)
      } else {
        // No ingredients and not tracking: show high availability
        availableStock = 999
      }

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        stockQuantity: availableStock,
        category: product.category ?? undefined,
        variants: product.productVariants
      }
    })

    return NextResponse.json({ products: payload })
  } catch (error) {
    console.error('Failed to fetch POS products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
