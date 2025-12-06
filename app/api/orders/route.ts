import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveTenant } from '@/lib/tenant'
import { logTenantActivity } from '@/lib/activityLogger'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const subdomain = searchParams.get('subdomain')

  const tenant = await resolveTenant(session, subdomain)
  if (!tenant) {
    return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
  }

  try {
    const orders = await prisma.order.findMany({
      where: { tenantId: tenant.id },
      include: {
        customer: true,
        orderItems: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedOrders = orders.map((order) => {
      const orderWithPayment = order as typeof order & Record<string, unknown>
      return {
        id: order.id,
        order_number: order.orderNumber,
        customer_name: order.customer
          ? `${order.customer.firstName} ${order.customer.lastName}`.trim()
          : 'Guest',
        customer_email: order.customer?.email ?? null,
        customer_phone: order.customer?.phone ?? null,
        created_at: order.createdAt,
        total_amount: order.total,
        subtotal_amount: order.orderItems.reduce((sum: number, item) => sum + item.price * item.quantity, 0),
        tax_amount: order.tax,
        order_status: order.status,
        payment_status: orderWithPayment.paymentStatus,
        payment_method: orderWithPayment.paymentMethod,
        amount_paid: orderWithPayment.amountPaid,
        order_type: orderWithPayment.orderType,
        delivery_address: orderWithPayment.deliveryAddress || null,
        paymentProof: orderWithPayment.paymentProof || null
      }
    })

    return NextResponse.json({ success: true, data: { orders: formattedOrders } })
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('POST /api/orders - Request body:', JSON.stringify(body, null, 2))
    
    const { customer, items, deliveryType, address, subtotal, paymentMethod, paymentProof, tip = 0, discount = 0 } = body
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('POST /api/orders - Invalid items:', items)
      return NextResponse.json({ success: false, message: 'Cart is empty' }, { status: 400 })
    }

    // Resolve tenant by header or default to environment
    const url = new URL(request.url)
    const subdomain = url.searchParams.get('subdomain') || request.headers.get('x-tenant-subdomain') || undefined
    console.log('POST /api/orders - Resolving tenant for subdomain:', subdomain)
    const tenant = subdomain ? await prisma.tenant.findUnique({ where: { subdomain: String(subdomain).toLowerCase() } }) : null
    console.log('POST /api/orders - Found tenant:', tenant ? { id: tenant.id, name: tenant.name } : null)
    if (!tenant) {
      console.error('POST /api/orders - Tenant not found for subdomain:', subdomain)
      return NextResponse.json({ success: false, message: 'Tenant not found' }, { status: 404 })
    }

    // Recalculate totals and validate
    const productIds = items.map((i: any) => Number(i.productId))
    console.log('POST /api/orders - Looking for products:', productIds, 'in tenant:', tenant.id)
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, tenantId: tenant.id }, include: { productIngredients: true } })
    console.log('POST /api/orders - Found products:', products.map(p => ({ id: p.id, name: p.name })))
    if (!products || products.length === 0) {
      console.error('POST /api/orders - No products found for IDs:', productIds, 'in tenant:', tenant.id)
      return NextResponse.json({ success: false, message: 'Products not found' }, { status: 400 })
    }

    // Recalculate subtotal to be safe
    let serverSubtotal = 0
    const productMap = new Map<number, any>()
    for (const p of products) {
      productMap.set(p.id, p)
    }

    for (const i of items) {
      const pid = Number(i.productId)
      const product = productMap.get(pid)
      if (!product) return NextResponse.json({ success: false, message: `Product ${pid} not found` }, { status: 400 })
      const qty = Number(i.quantity || 1)
      const unitPrice = Number(product.price || i.price || 0)
      serverSubtotal += unitPrice * qty
    }

    // Basic validation for totals
    const serverTax = Number((serverSubtotal * 0.12).toFixed(2))
    const deliveryFee = body.deliveryFee || 0
    const serverTotal = Math.round((serverSubtotal + serverTax - (discount || 0) + (tip || 0) + deliveryFee) * 100) / 100
    if (Math.abs(serverSubtotal - (Number(subtotal) || 0)) > 0.5) {
      // Not an exact match — this is OK, but warn in logs and prefer server amounts
      console.warn('Client subtotal mismatch, using server subtotal', { client: subtotal, server: serverSubtotal })
    }

    // Verify ingredient stock (check against available = currentStock - reservedStock)
    const ingredientUsage = new Map<number, number>() // ingredientId -> qtyUsed
    for (const i of items) {
      const pid = Number(i.productId)
      const qty = Number(i.quantity || 1)
      const product = productMap.get(pid)
      if (!product) continue
      for (const pi of product.productIngredients) {
        const existing = ingredientUsage.get(pi.ingredientId) ?? 0
        ingredientUsage.set(pi.ingredientId, existing + (Number(pi.quantity) * qty))
      }
    }

    // Load all ingredients and verify available stock
    const ingredientIds = Array.from(ingredientUsage.keys())
    console.log('POST /api/orders - Checking ingredients:', ingredientIds)
    const ingredients = await prisma.ingredient.findMany({ where: { id: { in: ingredientIds }, tenantId: tenant.id } })
    console.log('POST /api/orders - Found ingredients:', ingredients.map(i => ({ id: i.id, name: i.name, currentStock: i.currentStock, reservedStock: i.reservedStock })))
    const insufficient: Array<{ ingredientId: number; name: string; needed: number; available: number }> = []
    for (const ing of ingredients) {
      const needed = ingredientUsage.get(ing.id) ?? 0
      const availableStock = ing.currentStock - ing.reservedStock  // Available = current - reserved
      console.log('POST /api/orders - Ingredient', ing.name, 'needed:', needed, 'available:', availableStock, `(current: ${ing.currentStock}, reserved: ${ing.reservedStock})`)
      if (availableStock < needed) {
        insufficient.push({ ingredientId: ing.id, name: ing.name, needed, available: Number(availableStock) })
      }
    }
    if (insufficient.length > 0) {
      console.error('POST /api/orders - Insufficient inventory:', insufficient)
      return NextResponse.json({ success: false, message: 'Insufficient inventory', insufficient }, { status: 409 })
    }

    // Create order within a transaction and RESERVE inventory
    const orderNumber = `ORD-${Date.now()}`
    console.log('POST /api/orders - Starting transaction for order:', orderNumber)
    const createResult = await prisma.$transaction(async (tx) => {
      // Handle customer - use existing customer ID if logged in, otherwise upsert by email
      let customerId: number | null = null
      console.log('POST /api/orders - Processing customer:', customer)
      if (customer && customer.id) {
        // User is logged in, verify the customer exists and belongs to this tenant
        console.log('POST /api/orders - Looking for existing customer ID:', customer.id, 'in tenant:', tenant.id)
        const existingCustomer = await tx.customer.findFirst({
          where: { id: Number(customer.id), tenantId: tenant.id }
        })
        console.log('POST /api/orders - Found existing customer:', existingCustomer ? { id: existingCustomer.id, email: existingCustomer.email } : null)
        if (existingCustomer) {
          customerId = existingCustomer.id
          // Use customer's saved address if available and not provided
          if (!address && existingCustomer.address) {
            address = existingCustomer.address
            console.log('POST /api/orders - Using customer saved address:', address)
          }
          // Update customer info if provided
          if (customer.name || customer.email || customer.phone) {
            await tx.customer.update({
              where: { id: customerId },
              data: {
                firstName: customer.name?.split(' ')[0] || existingCustomer.firstName,
                lastName: customer.name?.split(' ').slice(1).join(' ') || existingCustomer.lastName,
                email: customer.email || existingCustomer.email,
                phone: customer.phone || existingCustomer.phone
              }
            })
          }
        } else {
          console.error('POST /api/orders - Customer ID', customer.id, 'not found in tenant', tenant.id)
          throw new Error(`Customer ${customer.id} not found`)
        }
      } else if (customer && customer.email) {
        // Guest checkout - upsert customer by email
        const existing = await tx.customer.findFirst({ where: { tenantId: tenant.id, email: customer.email } }).catch(() => null)
        if (existing) {
          customerId = existing.id
          // Use customer's saved address if available and not provided
          if (!address && existing.address) {
            address = existing.address
            console.log('POST /api/orders - Using customer saved address:', address)
          }
        } else {
          const [firstName, ...rest] = (customer.name || '').split(' ')
          const created = await tx.customer.create({
            data: {
              tenantId: tenant.id,
              firstName: firstName ?? '',
              lastName: rest.join(' ') ?? '',
              email: customer.email,
              phone: customer.phone ?? null,
              address: address ?? null
            }
          })
          customerId = created.id
        }
      }

      const order = await tx.order.create({ data: { tenantId: tenant.id, customerId: customerId ?? undefined, orderNumber, status: 'pending', paymentStatus: 'unpaid', orderType: deliveryType || 'delivery', total: serverTotal, tax: serverTax, discount: discount || 0, amountPaid: 0, paymentMethod: paymentMethod || 'cash', ...(paymentProof ? { paymentProof } : {}), ...(address ? { deliveryAddress: address } : {}), notes: '' } })

      // Create order items and record ingredients usage
      for (const i of items) {
        const product = productMap.get(Number(i.productId))
        const qty = Number(i.quantity || 1)
        await tx.orderItem.create({ data: { orderId: order.id, productId: product.id, quantity: qty, price: Number(product.price) } })
      }

      // RESERVE inventory for each ingredient (don't permanently deduct yet)
      const ingredientIds = Array.from(ingredientUsage.keys())
      for (const ingId of ingredientIds) {
        const qtyNeeded = ingredientUsage.get(ingId) ?? 0
        const ing = ingredients.find((v) => v.id === ingId)
        if (!ing) continue
        
        // Reserve the stock (increment reservedStock, don't touch currentStock)
        await tx.ingredient.update({ 
          where: { id: ingId }, 
          data: { reservedStock: { increment: qtyNeeded } } 
        })
        
        // Log the reservation (type: 'reserved')
        await tx.inventoryTransaction.create({ 
          data: { 
            tenantId: tenant.id, 
            ingredientId: ingId, 
            type: 'reserved', 
            quantity: Number(qtyNeeded), 
            reason: `Order ${orderNumber} - RESERVED`,
            performedBy: null 
          } 
        })
      }

      return order
    })

    // Log the activity
    await logTenantActivity(
      tenant.id,
      'ORDER_CREATED',
      undefined,
      {
        orderId: createResult.id,
        orderNumber: createResult.orderNumber,
        total: serverTotal,
        itemCount: items.length,
        customerEmail: customer?.email,
        paymentMethod: paymentMethod || 'cash',
        orderType: deliveryType || 'delivery'
      }
    )

    return NextResponse.json({ success: true, message: 'Order created', orderId: createResult.id, orderNumber: createResult.orderNumber }, { status: 201 })
  } catch (error) {
    console.error('POST /api/orders failed with error:', error)
    console.error('POST /api/orders - Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ success: false, message: 'Failed to create order' }, { status: 500 })
  }
}
