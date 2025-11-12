'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function BrandStudioPage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  const [tenantData, setTenantData] = useState<{ id: number; name: string; subdomain: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch tenant data
    const fetchTenant = async () => {
      try {
        const response = await fetch(`/api/tenants/by-subdomain/${subdomain}`)
        if (response.ok) {
          const data = await response.json()
          setTenantData(data)
        }
      } catch (error) {
        console.error('Failed to fetch tenant:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTenant()
  }, [subdomain])

  useEffect(() => {
    // Send tenant data to iframe when loaded
    if (tenantData) {
      const iframe = document.getElementById('brandstudio-iframe') as HTMLIFrameElement
      if (iframe?.contentWindow) {
        const message = {
          type: 'TENANT_DATA',
          tenant: tenantData
        }
        // Try sending to the actual iframe origin
        try {
          iframe.contentWindow.postMessage(message, 'http://localhost:5174')
        } catch (error) {
          console.error('Failed to send message to iframe:', error)
        }
      }
    }
  }, [tenantData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading BrandStudio...</p>
        </div>
      </div>
    )
  }

  if (!tenantData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tenant not found</h2>
          <p className="text-gray-600">Unable to load BrandStudio for this subdomain</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">BrandStudio</h1>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Tenant:</span>
            <span className="text-sm font-medium text-gray-900">{tenantData.name}</span>
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              {tenantData.subdomain}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.href = `/dashboard/${subdomain}`}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* BrandStudio Iframe */}
      <div className="flex-1 relative overflow-hidden">
        <iframe
          id="brandstudio-iframe"
          src={`http://localhost:5174?tenantId=${tenantData.id}&subdomain=${tenantData.subdomain}`}
          className="w-full h-full border-0"
          title="BrandStudio Editor"
          allow="clipboard-read; clipboard-write"
          onLoad={() => {
            // Send tenant data when iframe loads
            const iframe = document.getElementById('brandstudio-iframe') as HTMLIFrameElement
            if (iframe?.contentWindow) {
              const message = {
                type: 'TENANT_DATA',
                tenant: tenantData
              }
              // Wait a bit for iframe to be ready
              setTimeout(() => {
                try {
                  iframe.contentWindow?.postMessage(message, 'http://localhost:5174')
                } catch (error) {
                  console.error('Failed to send message on load:', error)
                }
              }, 500)
            }
          }}
        />
      </div>
    </div>
  )
}
