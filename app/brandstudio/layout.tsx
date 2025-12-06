import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BrandStudio',
  description: 'design tool built with Next.js',
}

export default function BrandstudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      {children}
    </div>
  )
}