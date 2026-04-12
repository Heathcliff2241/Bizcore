const { PrismaClient } = require('@prisma/client');

async function createAndVerify(upgradeRequestId) {
  const prisma = new PrismaClient();
  try {
    const ur = await prisma.planUpgradeRequest.findUnique({ where: { id: Number(upgradeRequestId) }, include: { subscription: true } });
    if (!ur) {
      console.error('Upgrade request not found:', upgradeRequestId);
      return;
    }

    const amount = ur.amountDue || 0;
    const subscriptionId = ur.subscription.id;

    const payment = await prisma.payment.create({
      data: {
        subscriptionId: subscriptionId,
        status: 'unpaid',
        amount: amount,
        currency: 'PHP',
        paymentMethod: 'gcash',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        metadata: {
          upgradeRequestId: ur.id,
          gcashTransactionId: 'TEST-REF-' + Date.now(),
          submittedAt: new Date().toISOString(),
          verificationStatus: 'pending',
        }
      }
    });

    await prisma.planUpgradeRequest.update({ where: { id: ur.id }, data: { paymentId: payment.id, status: 'payment_submitted', paymentSubmittedAt: new Date() } });

    console.log('Created payment', payment.id, 'for upgradeRequest', ur.id);

    // Now verify via simulate script
    console.log('Simulating admin verification...');
    const { execSync } = require('child_process');
    execSync(`node scripts/simulate-payment-verification.js ${payment.id}`, { stdio: 'inherit' });

  } catch (e) {
    console.error('Error in createAndVerify:', e);
  } finally {
    await prisma.$disconnect();
  }
}

const id = process.argv[2];
if (!id) {
  console.error('Usage: node create-and-verify-upgrade-payment.js <upgradeRequestId>');
  process.exit(1);
}

createAndVerify(id);
