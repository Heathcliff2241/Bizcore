import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/tenant/export/products?subdomain=xxx
 * Export all products for a tenant as CSV
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const subdomain = searchParams.get('subdomain')

    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain is required' }, { status: 400 })
    }

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Get optional filters
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''

    // Build where clause
    const where: {
      tenantId: number
      categoryId?: number
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' }
        sku?: { contains: string; mode: 'insensitive' }
      }>
    } = {
      tenantId: tenant.id,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category && category !== 'all') {
      where.categoryId = parseInt(category)
    }

    // Fetch all products (no pagination for export)
    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            name: true,
          },
        },
        variants: {
          select: {
            id: true,
            name: true,
            price: true,
            isActive: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Format data for export
    const exportData: Record<string, unknown>[] = []
    
    products.forEach((product) => {
      const stockLevel = product.currentStock || 0
      const lowStockThreshold = product.lowStockThreshold || 0
      const stockStatus =
        stockLevel === 0
          ? 'Out of Stock'
          : stockLevel <= lowStockThreshold
            ? 'Low Stock'
            : 'In Stock'

      const baseProductData = {
        product_id: product.id,
        product_name: product.name,
        sku: product.slug || 'N/A',
        category: product.category?.name || 'Uncategorized',
        description: product.description || 'N/A',
        base_price: product.price.toFixed(2),
        cost: product.cost ? product.cost.toFixed(2) : 'N/A',
        stock_level: stockLevel.toFixed(0),
        low_stock_threshold: lowStockThreshold.toFixed(0),
        stock_status: stockStatus,
        is_active: product.isActive ? 'Yes' : 'No',
        is_featured: product.isFeatured ? 'Yes' : 'No',
        track_inventory: product.trackInventory ? 'Yes' : 'No',
        created_at: product.createdAt.toISOString(),
        updated_at: product.updatedAt.toISOString(),
      }

      // If product has no variants, export as single row
      if (product.variants.length === 0) {
        exportData.push({
          ...baseProductData,
          variant_name: 'Default',
          variant_price: product.price.toFixed(2),
          variant_status: product.isActive ? 'Active' : 'Inactive',
        })
      } else {
        // Export each variant as a separate row
        product.variants.forEach((variant) => {
          exportData.push({
            ...baseProductData,
            variant_name: variant.name,
            variant_price: variant.price.toFixed(2),
            variant_status: variant.isActive ? 'Active' : 'Inactive',
          })
        })
      }
    })

    return NextResponse.json(exportData)
  } catch (error) {
    console.error('Export products error:', error)
    return NextResponse.json({ error: 'Failed to export products' }, { status: 500 })
  }
}

