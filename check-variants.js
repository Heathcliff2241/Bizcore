const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVariants() {
  try {
    console.log('Checking tenants...');
    const tenants = await prisma.tenant.findMany();
    console.log('Tenants:', tenants.map(t => ({ id: t.id, name: t.name })));

    console.log('\nChecking all variants...');
    const allVariants = await prisma.productVariant.findMany({
      include: {
        product: {
          select: { name: true, tenantId: true }
        }
      }
    });

    console.log('All variants:');
    allVariants.forEach(v => {
      console.log('  - ' + v.name + ': ₱' + v.price + ' (product: ' + v.product.name + ', tenant: ' + v.product.tenantId + ')');
    });

    console.log('\nChecking products with variants...');
    const products = await prisma.product.findMany({
      include: {
        productVariants: true
      }
    });

    products.forEach(p => {
      if (p.productVariants.length > 0) {
        console.log('Product: ' + p.name + ' (tenant: ' + p.tenantId + '), Variants:');
        p.productVariants.forEach(v => {
          console.log('  - ' + v.name + ': ₱' + v.price + ' (active: ' + v.isActive + ')');
        });
      }
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVariants();