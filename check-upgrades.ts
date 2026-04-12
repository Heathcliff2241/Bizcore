import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUpgradeRequests() {
  console.log('Checking upgrade requests in database...');

  const requests = await prisma.planUpgradeRequest.findMany({
    include: {
      tenant: true
    }
  });

  console.log(`Found ${requests.length} upgrade requests:`);
  requests.forEach(req => {
    console.log(`- ID: ${req.id}, Tenant: ${req.tenant.name} (${req.tenant.subdomain}), ${req.currentPlan} → ${req.newPlan}, Status: ${req.status}`);
  });

  await prisma.$disconnect();
}

checkUpgradeRequests().catch(console.error);