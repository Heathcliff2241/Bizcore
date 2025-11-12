import type { Metadata } from 'next'
import '../styles/globals.css'
import { Providers } from '../lib/providers'

export const metadata: Metadata = {
  title: 'BizCore',
  description: 'Multi-Tenant Saas For SMEs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}