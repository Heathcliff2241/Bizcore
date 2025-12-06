'use client'

import { Suspense, useEffect, useState } from 'react'
import LoadingScreen from './LoadingScreen'

interface PageWrapperProps {
  children: React.ReactNode
  minLoadingTime?: number // Minimum time to show loading screen in ms
}

export function PageWrapper({ children, minLoadingTime = 300 }: PageWrapperProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Ensure minimum loading time for visual effect
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, minLoadingTime)

    return () => clearTimeout(timer)
  }, [minLoadingTime])

  if (isLoading) {
    return <LoadingScreen />
  }

  return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
}
