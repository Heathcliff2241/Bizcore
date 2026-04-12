const { PrismaClient } = require('@prisma/client');

async function checkRequests() {
  const prisma = new PrismaClient();

  try {
    const requests = await prisma.planUpgradeRequest.findMany({
      include: { tenant: true, payment: true },
      orderBy: { requestedAt: 'desc' }
    });

    console.log(`Total upgrade requests: ${requests.length}`);

    if (requests.length === 0) {
      console.log('No upgrade requests found in database.');
      return;
    }

    requests.forEach(r => {
      console.log(`ID: ${r.id}, Tenant: ${r.tenant.name}, Status: ${r.status}, Created: ${r.requestedAt}`);
      if (r.payment) {
        console.log(`  Payment: ${r.payment.status}, Amount: ₱${r.payment.amount}`);
      }
    });
  } catch (error) {
    console.error('Error checking requests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRequests();