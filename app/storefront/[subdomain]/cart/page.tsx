import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

interface Props {
  params: Promise<{
    subdomain: string
  }> | {
    subdomain: string
  }
}

export default async function CartPage({ params }: Props) {
  const paramsResult = params as Promise<{ subdomain: string }> | { subdomain: string }
  const resolvedParams = typeof (paramsResult as PromiseLike<{ subdomain: string }>).then === 'function'
    ? await (paramsResult as PromiseLike<{ subdomain: string }>)
    : (paramsResult as { subdomain: string })
  const { subdomain } = resolvedParams

  const tenant = await prisma.tenant.findUnique({ where: { subdomain } })
  if (!tenant) {
    return notFound()
  }

  // Cart is now a modal - redirect to home
  return null
}

