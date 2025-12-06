import Link from 'next/link'
import { resolveStorefrontHref } from '@/components/storefront/utils/links'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The requested storefront page could not be found.'
}

export default function StorefrontNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
        <p className="text-lg text-slate-600 mb-6">The page you're looking for doesn't exist or has been removed. You can return to the homepage or explore our menu.</p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/" className="px-4 py-2 rounded-md bg-slate-900 text-white">Home</Link>
        </div>
      </div>
    </div>
  )
}
