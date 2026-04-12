import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestUpgradeRequests() {
  console.log('Creating test upgrade requests...');

  // Get existing tenants and plans
  const tenants = await prisma.tenant.findMany();
  const plans = await prisma.plan.findMany();

  if (tenants.length === 0 || plans.length === 0) {
    console.log('No tenants or plans found. Please run the main seed first.');
    return;
  }

  // Create subscriptions for tenants (if they don't exist)
  for (const tenant of tenants.slice(0, 2)) { // Use first 2 tenants
    const currentPlan = plans.find(p => p.name === 'Starter') || plans[0];
    const targetPlan = plans.find(p => p.name === 'Professional') || plans[1];

    if (!currentPlan || !targetPlan) continue;

    // Check if subscription already exists
    let subscription = await prisma.subscription.findUnique({
      where: { tenantId: tenant.id }
    });

    if (!subscription) {
      // Create subscription
      subscription = await prisma.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: currentPlan.id,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        }
      });
    }

    // Create upgrade request
    const upgradeRequest = await prisma.planUpgradeRequest.create({
      data: {
        tenantId: tenant.id,
        currentPlan: currentPlan.name,
        newPlan: targetPlan.name,
        amountDue: Math.max(0, targetPlan.price - currentPlan.price),
        prorationDetails: {
          currentCycleDays: 15,
          totalCycleDays: 30,
          creditApplied: currentPlan.price * 0.5, // Half credit for remaining period
          upgradeFee: Math.max(0, targetPlan.price - currentPlan.price)
        },
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    });

    console.log(`✓ Created upgrade request for ${tenant.subdomain}: ${currentPlan.name} → ${targetPlan.name}`);
  }

  console.log('✅ Test upgrade requests created successfully!');
}

createTestUpgradeRequests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());