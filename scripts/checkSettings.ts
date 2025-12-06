import { prisma } from '@/lib/prisma'

async function checkSettings() {
  try {
    const advena = await prisma.tenant.findUnique({
      where: { subdomain: 'advena' }
    })

    console.log('\n=== ADVENA TENANT ===')
    console.log('ID:', advena?.id)
    console.log('Name:', advena?.name)
    console.log('Subdomain:', advena?.subdomain)
    console.log('\n=== RAW SETTINGS ===')
    console.log(JSON.stringify(advena?.settings, null, 2))

    if (advena?.settings && typeof advena.settings === 'object') {
      const settings = advena.settings as Record<string, unknown>
      console.log('\n=== PARSED SETTINGS ===')
      console.log('Brand Colors:', settings.brandColors)
      console.log('Business Info:', settings.businessInfo)
      console.log('Payment Settings:', settings.paymentSettings)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSettings()
