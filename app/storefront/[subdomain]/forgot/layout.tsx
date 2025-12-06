import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

// Auth pages layout: no header/footer
export default function AuthLayout({ children }: Props) {
  return <>{children}</>
}
