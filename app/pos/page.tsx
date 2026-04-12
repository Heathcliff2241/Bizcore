import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function POSRoot() {
  const session = await getServerSession(authOptions)
  
  console.log('[POS ROOT] Session:', {
    user: session?.user?.email,
    role: session?.user?.role,
    userType: (session?.user as any)?.userType,
    subdomain: session?.user?.subdomain,
    tenantId: session?.user?.tenantId
  })

  // If user is logged in, redirect to their tenant's POS
  if (session?.user?.subdomain) {
    console.log('[POS ROOT] Redirecting POS employee to:', `/pos/${session.user.subdomain}`)
    redirect(`/pos/${session.user.subdomain}`)
  }

  // If no subdomain in session, redirect to signin
  console.log('[POS ROOT] No subdomain in session, redirecting to /auth/signin')
  redirect('/auth/signin')
}
