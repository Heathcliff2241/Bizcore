import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Only create demo data when explicitly requested. This avoids adding default passwords to production.
  if (String(process.env.SEED_DEMO).toLowerCase() !== 'true') {
    console.log('SEED_DEMO not enabled - skipping demo seed. Set SEED_DEMO=true to create demo data.')
    return
  }
  console.log('Seeding database (DEMO)...')

  // Hash the password
  const plainPassword = 'admin123'
  const hashedPassword = await bcrypt.hash(plainPassword, 10)
  
  console.log('Hashed password:', hashedPassword)

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'cesaresmero2@gmail.com' },
    update: {},
    create: {
      email: 'cesaresmero2@gmail.com',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      emailVerified: true,
    },
  })

  console.log('✓ Created admin user:', adminUser.email)

  // Create tenant owner user for Advena
  const tenantOwnerUser = await prisma.user.upsert({
    where: { email: 'owner@advena.local' },
    update: {},
    create: {
      email: 'owner@advena.local',
      firstName: 'Advena',
      lastName: 'Owner',
      password: hashedPassword, // same password as admin: admin123
      role: 'tenant_owner',
      isActive: true,
      emailVerified: true,
    },
  })

  console.log('✓ Created tenant owner user:', tenantOwnerUser.email)

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'olaf' },
    update: {},
    create: {
      name: 'Olaf Store',
      subdomain: 'olaf',
      domain: 'olaf.local',
      ownerId: adminUser.id,
      description: 'Demo storefront for testing',
      isActive: true,
      isPremium: true,
      subscriptionPlan: 'premium',
      subscriptionExpires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
    },
  })

  console.log('✓ Created tenant:', tenant.subdomain)

  // Create another demo tenant for "advena" owned by tenant owner
  const tenant2 = await prisma.tenant.upsert({
    where: { subdomain: 'advena' },
    update: {
      settings: {
        gcashNumber: '09123456789',
        gcashQrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      }
    },
    create: {
      name: 'Advena Store',
      subdomain: 'advena',
      domain: 'advena.local',
      ownerId: tenantOwnerUser.id,
      description: 'Another demo storefront',
      isActive: true,
      isPremium: false,
      subscriptionPlan: 'free',
      primaryColor: '#8B5CF6',
      secondaryColor: '#EC4899',
      settings: {
        gcashNumber: '09123456789',
        gcashQrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      }
    },
  })

  console.log('✓ Created tenant:', tenant2.subdomain)

  // Create sample products
  await prisma.product.create({
    data: {
      tenantId: tenant.id,
      name: 'Sample Product 1',
      description: 'This is a demo product',
      price: 29.99,
      cost: 10.00,
      isActive: true,
    },
  })

  await prisma.product.create({
    data: {
      tenantId: tenant.id,
      name: 'Sample Product 2',
      description: 'Another demo product',
      price: 49.99,
      cost: 20.00,
      isActive: true,
    },
  })

  console.log('✓ Created sample products')

  // Create test customer for olaf tenant
  const customerPassword = await bcrypt.hash('password123', 10)
  const testCustomer = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      firstName: 'Test',
      lastName: 'Customer',
      email: 'customer@olaf.local',
      password: customerPassword,
      phone: '+1 (555) 123-4567',
      address: {
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105'
      },
      isActive: true,
      emailVerified: true
    }
  })

  console.log('✓ Created test customer:', testCustomer.email)

  // Create test customer for advena tenant
  const advenaCustomer = await prisma.customer.create({
    data: {
      tenantId: tenant2.id,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: customerPassword,
      phone: '+1 (555) 987-6543',
      address: {
        street: '456 Oak Ave',
        city: 'New York',
        state: 'NY',
        zip: '10001'
      },
      isActive: true,
      emailVerified: true
    }
  })

  console.log('✓ Created advena customer:', advenaCustomer.email)

  console.log('\n✅ Database seeded successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })