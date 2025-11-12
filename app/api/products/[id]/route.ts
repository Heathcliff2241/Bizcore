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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = await getTenantId(session.user.id);
  if (!tenantId) {
    return NextResponse.json({ message: 'User is not associated with a tenant' }, { status: 403 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id, 10), tenantId },
      include: {
        category: true,
        productIngredients: {
          include: {
            ingredient: true,
          },
        },
        productVariants: true,
      },
    });

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

    // Verify product belongs to tenant
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existingProduct || existingProduct.tenantId !== tenantId) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    // Delete existing ingredients
    await prisma.productIngredient.deleteMany({
      where: { productId: parseInt(id, 10) },
    });

    const product = await prisma.product.update({
      where: { id: parseInt(id, 10) },
      data: {
        name,
        description,
        price: parseFloat(price),
        cost: parseFloat(cost_price || 0),
        image,
        categoryId: category_id ? parseInt(category_id, 10) : null,
        isActive: is_active,
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
    console.error('Failed to update product:', error);
    return NextResponse.json({ success: false, message: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = await getTenantId(session.user.id);
  if (!tenantId) {
    return NextResponse.json({ message: 'User is not associated with a tenant' }, { status: 403 });
  }

  try {
    // Verify product belongs to tenant
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!product || product.tenantId !== tenantId) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Failed to delete product:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete product' }, { status: 500 });
  }
}
