const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'thirdyheathcliff@gmail.com' },
      include: {
        tenantUsers: {
          include: { tenant: true }
        }
      }
    });

    if (user) {
      console.log('User:', user.email);
      console.log('Tenant users:', user.tenantUsers.map(tu => ({
        tenantId: tu.tenantId,
        tenantName: tu.tenant.name,
        role: tu.role
      })));
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();