import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Sign up' }
}

/**
 * Signup page now redirects to home with signup modal open
 * Auth is handled via HeaderSection modals for single-page experience
 */
export default async function SignUpPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params
  // Redirect to home page with auth=signup param to auto-open the signup modal
  redirect(`/storefront/${subdomain}?auth=signup`)
}
