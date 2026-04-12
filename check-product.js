const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    const product = await prisma.product.findFirst({
      where: { name: 'hehe' },
      include: {
        productVariants: {
          include: {
            variantIngredients: {
              include: { ingredient: true }
            }
          }
        },
        productIngredients: {
          include: { ingredient: true }
        }
      }
    });
    
    if (product) {
      console.log('Product:', product.name);
      console.log('\nBase Product Ingredients:');
      for (const pi of product.productIngredients) {
        const current = pi.ingredient.currentStock;
        const reserved = pi.ingredient.reservedStock;
        const available = current - reserved;
        const canMake = Math.floor(available / pi.quantity);
        console.log(`  ${pi.ingredient.name}: current=${current}, reserved=${reserved}, available=${available}, needs=${pi.quantity}, canMake=${canMake}`);
      }
      
      console.log('\nVariants:');
      for (const variant of product.productVariants) {
        console.log(`  ${variant.name} (₱${variant.price})`);
        console.log(`    Variant-specific ingredients: ${variant.variantIngredients.length}`);
        if (variant.variantIngredients.length > 0) {
          for (const vi of variant.variantIngredients) {
            const current = vi.ingredient.currentStock;
            const reserved = vi.ingredient.reservedStock;
            const available = current - reserved;
            const canMake = Math.floor(available / vi.quantity);
            console.log(`      - ${vi.ingredient.name}: current=${current}, reserved=${reserved}, available=${available}, needs=${vi.quantity}, canMake=${canMake}`);
          }
        }
      }
    }
    
    // Fix negative reserved stock
    const ingredient = await prisma.ingredient.findFirst({
      where: { name: 'dgdfgdrdr' }
    });
    
    if (ingredient && ingredient.reservedStock < 0) {
      console.log(`\nFixing negative reservedStock for ingredient "${ingredient.name}"`);
      await prisma.ingredient.update({
        where: { id: ingredient.id },
        data: { reservedStock: 0 }
      });
      console.log('Fixed! Set reservedStock to 0');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
