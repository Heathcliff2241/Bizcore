'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'

interface BrandStudioFrameProps {
  className?: string
}

interface TenantData {
  id: number
  name: string
  subdomain: string
}

export default function BrandStudioFrame({ className = '' }: BrandStudioFrameProps) {
  const { data: session } = useSession()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [tenantData, setTenantData] = useState<TenantData | null>(null)

  const sendAuthMessage = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage({
      type: 'AUTH_TOKEN',
      token: session?.user?.email, // Using email as identifier for now
      user: session?.user
    }, process.env.NEXT_PUBLIC_BRANDSTUDIO_URL!)
  }, [session])

  const sendTenantMessage = useCallback(() => {
    if (tenantData) {
      iframeRef.current?.contentWindow?.postMessage({
        type: 'TENANT_DATA',
        tenant: tenantData
      }, process.env.NEXT_PUBLIC_BRANDSTUDIO_URL!)
    }
  }, [tenantData])

  // Fetch tenant data when user is authenticated
  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/tenants')
        .then(res => res.json())
        .then(data => {
          if (data.tenant) {
            setTenantData(data.tenant)
          }
        })
        .catch(error => {
          console.error('Failed to fetch tenant data:', error)
        })
    }
  }, [session])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle messages from BrandStudio
      if (event.origin === process.env.NEXT_PUBLIC_BRANDSTUDIO_URL) {
        console.log('Message from BrandStudio:', event.data)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    // Send auth token to BrandStudio when session changes and iframe is ready
    if (iframeRef.current && session) {
      const iframe = iframeRef.current
      // Send immediately and also when iframe loads
      sendAuthMessage()
      iframe.addEventListener('load', sendAuthMessage)

      return () => {
        iframe.removeEventListener('load', sendAuthMessage)
      }
    }
  }, [session, sendAuthMessage])

  useEffect(() => {
    // Send tenant data when it's available and iframe is ready
    if (iframeRef.current && tenantData) {
      const iframe = iframeRef.current
      // Send immediately and also when iframe loads
      sendTenantMessage()
      iframe.addEventListener('load', sendTenantMessage)

      return () => {
        iframe.removeEventListener('load', sendTenantMessage)
      }
    }
  }, [tenantData, sendTenantMessage])

  return (
    <iframe
      ref={iframeRef}
      src={`${process.env.NEXT_PUBLIC_BRANDSTUDIO_URL}/?user=${session?.user?.email || ''}`}
      className={`w-full h-full border-0 ${className}`}
      title="BrandStudio"
      sandbox="allow-scripts allow-same-origin allow-forms"
    />
  )
}