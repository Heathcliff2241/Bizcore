'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { PageRenderer } from '@/components/storefront/PageRenderer'
import type { Component } from '@/brandstudio-vite/src/types/component'

interface PageData {
  id: string
  title: string
  slug: string
  content: Component[]
  isDraft: boolean
}

interface StorefrontSettings {
  primaryColor?: string
  secondaryColor?: string
  logoUrl?: string
}

export default function SubdomainPreviewPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const subdomain = params.subdomain as string
  const pageId = searchParams.get('pageId')
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [storefrontSettings, setStorefrontSettings] = useState<StorefrontSettings>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pageId) {
      setError('No page ID provided')
      setLoading(false)
      return
    }

    if (!subdomain) {
      setError('No subdomain provided')
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        // Fetch page data
        const pageResponse = await fetch(`/api/pages/${pageId}?draft=true`)
        if (!pageResponse.ok) {
          throw new Error(`Failed to fetch page: ${pageResponse.statusText}`)
        }
        const page = await pageResponse.json()
        setPageData(page)

        // Fetch tenant/storefront settings
        try {
          const tenantResponse = await fetch(`/api/tenants/by-subdomain/${subdomain}`)
          if (tenantResponse.ok) {
            const tenantData = await tenantResponse.json()
            setStorefrontSettings({
              primaryColor: tenantData.primaryColor,
              secondaryColor: tenantData.secondaryColor,
              logoUrl: tenantData.logoUrl
            })
          }
        } catch (err) {
          console.warn('Could not fetch tenant settings:', err)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load page')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [pageId, subdomain])

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="text-red-600 text-lg font-semibold">Preview Error</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.close()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  if (!pageData) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">No page data found</p>
      </div>
    )
  }

  return (
    <div className="w-full bg-white">
      {/* Preview Header */}
      <div className="sticky top-0 z-50 bg-blue-600 text-white px-6 py-3 flex items-center justify-between border-b border-blue-700 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Preview Mode (Draft)</span>
        </div>
        <div className="text-xs opacity-75">
          {subdomain} / {pageData.title}
        </div>
        <button
          onClick={() => window.close()}
          className="text-sm px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
        >
          Close Preview
        </button>
      </div>

      {/* Page Content */}
      <div className="w-full">
        <PageRenderer 
          components={pageData.content || []} 
          storefront={storefrontSettings}
          isPreview={true}
        />
      </div>
    </div>
  )
}
