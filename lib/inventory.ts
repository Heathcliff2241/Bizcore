import { prisma } from './prisma'

export async function checkLowStockItems(tenantId: number) {
  return await prisma.ingredient.findMany({
    where: {
      tenantId,
      isActive: true,
      currentStock: { lte: prisma.raw('minStock') }
    }
  })
}
