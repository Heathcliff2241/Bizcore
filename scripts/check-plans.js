const { PrismaClient } = require('@prisma/client');

async function checkPlans() {
  const prisma = new PrismaClient();
  try {
    const plans = await prisma.plan.findMany({});
    console.log('Total plans:', plans.length);
    plans.forEach(p => console.log(`id: ${p.id}, name: ${p.name}, billingCycle: ${p.billingCycle}`));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlans();