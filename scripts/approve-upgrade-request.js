const { PrismaClient } = require('@prisma/client');

async function approveUpgrade(upgradeRequestId) {
  const prisma = new PrismaClient();
  try {
    const upgrade = await prisma.planUpgradeRequest.findUnique({
      where: { id: Number(upgradeRequestId) },
      include: { subscription: true, payment: true, tenant: true },
    });

    if (!upgrade) {
      console.error('Upgrade request not found');
      return;
    }

    if (upgrade.status !== 'payment_submitted') {
      console.error('Upgrade status is not payment_submitted, found:', upgrade.status);
      return;
    }

    // Resolve plan
    let plan = await prisma.plan.findUnique({ where: { id: upgrade.newPlan } });
    if (!plan) plan = await prisma.plan.findFirst({ where: { name: upgrade.newPlan } });
    if (!plan) {
      console.error('Plan resolution failed for', upgrade.newPlan);
      return;
    }

    console.log('Resolved plan to', plan.id, plan.name);

    // Update payment to paid
    if (upgrade.payment) {
      await prisma.payment.update({ where: { id: upgrade.payment.id }, data: { status: 'paid', verifiedAt: new Date() } });
    }

    // Compute billing cycle
    const billingCycle = plan.billingCycle !== 'trial' ? plan.billingCycle : 'monthly';
    const cycleStart = new Date();
    const cycleEnd = billingCycle === 'annual' ? new Date(cycleStart.getTime() + 365 * 24 * 60 * 60 * 1000) : new Date(cycleStart.getTime() + 30 * 24 * 60 * 60 * 1000);

    const updatedSub = await prisma.subscription.update({
      where: { id: upgrade.subscription.id },
      data: {
        planId: plan.id,
        billingCycle,
        currentPeriodStart: cycleStart,
        currentPeriodEnd: cycleEnd,
        renewalDate: cycleEnd,
        nextPaymentDate: cycleEnd,
        status: 'active',
        planChangedAt: new Date(),
        pendingUpgradePlanId: null,
        upgradePendingAt: null,
      }
    });

    console.log('Subscription updated to plan:', updatedSub.planId);

    const applied = await prisma.planUpgradeRequest.update({ where: { id: upgrade.id }, data: { status: 'applied', approvedAt: new Date(), appliedAt: new Date() } });

    console.log('Upgrade request applied:', applied.id);
  } catch (e) {
    console.error('Error approving upgrade:', e);
  } finally {
    await prisma.$disconnect();
  }
}

const id = process.argv[2];
if (!id) {
  console.error('Usage: node approve-upgrade-request.js <upgradeRequestId>');
  process.exit(1);
}

approveUpgrade(id);