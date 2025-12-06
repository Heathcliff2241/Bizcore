import type { Session } from 'next-auth'
import type { Tenant } from '@prisma/client'
import { prisma } from './prisma'

export async function resolveTenant(session: Session | null, subdomain?: string | null): Promise<Tenant | null> {
  if (!session?.user?.id) {
    return null
  }

  const userId = Number(session.user.id)
  if (!Number.isFinite(userId)) {
    return null
  }

  if (subdomain) {
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: subdomain.toLowerCase() },
      include: { tenantUsers: true }
    })

    if (!tenant) {
      return null
    }

    const isOwner = tenant.ownerId === userId
    const isTenantUser = tenant.tenantUsers.some((membership) => membership.userId === userId)

    return isOwner || isTenantUser ? tenant : null
  }

  const ownedTenant = await prisma.tenant.findFirst({
    where: { ownerId: userId }
  })

  if (ownedTenant) {
    return ownedTenant
  }

  const membership = await prisma.tenantUser.findFirst({
    where: { userId },
    include: { tenant: true }
  })

  return membership?.tenant ?? null
}
