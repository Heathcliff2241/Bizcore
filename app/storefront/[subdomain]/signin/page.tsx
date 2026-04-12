import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Sign in' }
}

/**
 * Signin page now redirects to home with login modal open
 * Auth is handled via HeaderSection modals for single-page experience
 */
export default async function SignInPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params
  // Redirect to home page with loginModal param to auto-open the modal
  redirect(`/storefront/${subdomain}?auth=signin`)
}
