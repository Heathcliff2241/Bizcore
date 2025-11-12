import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface IngredientInput {
  ingredient_id: number;
  quantity_required: number;
}

async function getTenantId(userId: string): Promise<number | null> {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId, 10) },
    include: { tenantUsers: true },
  });
  return user?.tenantUsers[0]?.tenantId ?? null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = await getTenantId(session.user.id);
  if (!tenantId) {
    return NextResponse.json({ message: 'User is not associated with a tenant' }, { status: 403 });
  }

  try {
    const products = await prisma.product.findMany({
      where: { tenantId },
      include: {
        category: true,
        productIngredients: {
          include: {
            ingredient: true,
          },
        },
        productVariants: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      cost_price: product.cost,
      image: product.image,
      sku: null,
      category_id: product.categoryId,
      category_name: product.category?.name,
      track_inventory: false,
      current_stock: 0,
      low_stock_threshold: 10,
      is_active: product.isActive,
      Ingredients: product.productIngredients.map(pi => ({
        id: pi.ingredient.id,
        name: pi.ingredient.name,
        unit_of_measure: pi.ingredient.unit,
        ProductIngredient: {
          quantity_required: pi.quantity,
        },
      })),
      Category: product.category ? { id: product.category.id, name: product.category.name } : null,
    }));

    return NextResponse.json({ success: true, data: formattedProducts });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = await getTenantId(session.user.id);
  if (!tenantId) {
    return NextResponse.json({ message: 'User is not associated with a tenant' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      name,
      description,
      price,
      cost_price,
      image,
      category_id,
      is_active,
      ingredients,
    } = body;

    if (!name || !price) {
      return NextResponse.json({ success: false, message: 'Name and price are required' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        cost: parseFloat(cost_price || 0),
        image,
        categoryId: category_id ? parseInt(category_id, 10) : null,
        isActive: is_active,
        tenantId,
        productIngredients: {
          create: ingredients
            ? ingredients.map((ing: IngredientInput) => ({
                ingredientId: ing.ingredient_id,
                quantity: ing.quantity_required,
              }))
            : [],
        },
      },
      include: {
        category: true,
        productIngredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: { product } });
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json({ success: false, message: 'Failed to create product' }, { status: 500 });
  }
}
