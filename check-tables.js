const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // List all tables
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' 
      ORDER BY table_name;
    `;
    
    console.log('Tables in database:');
    result.forEach(row => {
      console.log('  - ' + row.table_name);
    });
  } finally {
    await prisma.$disconnect();
  }
}

main();
