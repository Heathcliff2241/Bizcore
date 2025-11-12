import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create a demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@brandstudio.com' },
    update: {},
    create: {
      email: 'demo@brandstudio.com',
      firstName: 'Demo',
      lastName: 'User',
      password: 'password', // In real app, hash this
    },
  })

  console.log('Created user:', user)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })