import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function POSRoot() {
  const session = await getServerSession(authOptions)

  // If user is logged in, redirect to their tenant's POS
  if (session?.user?.subdomain) {
    redirect(`/pos/${session.user.subdomain}`)
  }

  // If no subdomain in session, try to get it from tenant
  if (session?.user?.tenantId) {
    // For now, redirect to signin - user needs to authenticate first
    redirect('/auth/signin')
  }

  // Not logged in, go to signin
  redirect('/auth/signin')
}
