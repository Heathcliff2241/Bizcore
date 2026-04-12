import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRequests() {
  const requests = await prisma.planUpgradeRequest.findMany({
    include: { tenant: true, payment: true }
  });

  console.log('Upgrade requests:');
  requests.forEach(r => {
    console.log(`ID: ${r.id}, Status: ${r.status}, Tenant: ${r.tenant.name}, Payment: ${r.paymentId}, Created: ${r.requestedAt}`);
  });

  await prisma.$disconnect();
}

checkRequests().catch(console.error);