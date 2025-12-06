import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

// POS root layout: isolated from storefront UI. No header/footer.
export default function POSRootLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {children}
    </div>
  )
}
