const { PrismaClient } = require('@prisma/client');

async function simulate(paymentId) {
  const prisma = new PrismaClient();
  try {
    // Fetch payment
    const payment = await prisma.payment.findUnique({ where: { id: Number(paymentId) }, include: { subscription: true } });
    if (!payment) {
      console.error('Payment not found');
      return;
    }

    console.log('Payment:', JSON.stringify(payment, null, 2));

    // Simulate admin verifying payment: update payment and subscription as the API does
    // We'll reuse some of the logic from app/api/admin/payments/route.ts
    const metadata = payment.metadata || {};
    const upgradeRequestId = metadata.upgradeRequestId ? Number(metadata.upgradeRequestId) : null;

    // Update payment status to 'paid'
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'paid', verifiedAt: new Date() } });

    // Determine upgrade plan id
    let upgradingPlanId = null;
    if (upgradeRequestId) {
      const ur = await prisma.planUpgradeRequest.findUnique({ where: { id: upgradeRequestId } });
      if (ur) upgradingPlanId = ur.newPlan;
    }

    if (!upgradingPlanId) upgradingPlanId = payment.subscription.pendingUpgradePlanId || null;

    if (upgradingPlanId) {
      // Resolve plan
      let plan = await prisma.plan.findUnique({ where: { id: upgradingPlanId } });
      if (!plan) plan = await prisma.plan.findFirst({ where: { name: upgradingPlanId } });
      if (!plan) {
        console.error("Plan couldn't be resolved", upgradingPlanId);
      } else {
        const billingCycle = plan.billingCycle !== 'trial' ? plan.billingCycle : 'monthly';
        const cycleStart = new Date();
        const cycleEnd = billingCycle === 'annual' ? new Date(cycleStart.getTime() + 365*24*60*60*1000) : new Date(cycleStart.getTime() + 30*24*60*60*1000);

        const updatedSub = await prisma.subscription.update({
          where: { id: payment.subscriptionId },
          data: {
            planId: plan.id,
            billingCycle: billingCycle,
            currentPeriodStart: cycleStart,
            currentPeriodEnd: cycleEnd,
            renewalDate: cycleEnd,
            nextPaymentDate: cycleEnd,
            status: 'active',
            planChangedAt: new Date(),
            pendingUpgradePlanId: null,
            upgradePendingAt: null,
          },
          include: { tenant: true }
        });

        console.log('Updated subscription:', updatedSub.planId, updatedSub.billingCycle);

        // Update tenant subscriptionPlan
        const tenantPlanVal = plan.id === 'trial' ? 'free' : (['free', 'basic', 'premium', 'enterprise'].includes(plan.id) ? plan.id : 'free');
        await prisma.tenant.update({ where: { id: updatedSub.tenant.id }, data: { subscriptionPlan: tenantPlanVal } });

        console.log('Tenant subscriptionPlan now:', tenantPlanVal);
      }

      // If planUpgradeRequest present, mark it applied
      if (upgradeRequestId) {
        await prisma.planUpgradeRequest.update({ where: { id: upgradeRequestId }, data: { status: 'applied', approvedAt: new Date(), appliedAt: new Date() } });
        console.log('PlanUpgradeRequest updated to applied:', upgradeRequestId);
      }
    } else {
      console.log('No upgrade to apply.');
    }
  } catch (e) {
    console.error('simulate error', e);
  } finally {
    await prisma.$disconnect();
  }
}

const pid = process.argv[2];
if (!pid) {
  console.error('Usage: node simulate-payment-verification.js <paymentId>');
  process.exit(1);
}

simulate(pid);
