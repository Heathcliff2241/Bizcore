import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  console.log('Admin user:', admin?.email, admin?.role);
  await prisma.$disconnect();
}

checkAdmin().catch(console.error);