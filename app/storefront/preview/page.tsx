'use client'

import { useSearchParams } from 'next/navigation'
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

export default function PreviewPage() {
  const searchParams = useSearchParams()
  const pageId = searchParams.get('pageId')
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pageId) {
      setError('No page ID provided')
      setLoading(false)
      return
    }

    const fetchPageData = async () => {
      try {
        const response = await fetch(`/api/pages/${pageId}?draft=true`)
        if (!response.ok) {
          throw new Error(`Failed to fetch page: ${response.statusText}`)
        }
        const data = await response.json()
        setPageData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load page')
      } finally {
        setLoading(false)
      }
    }

    fetchPageData()
  }, [pageId])

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
      <div className="sticky top-0 z-40 bg-blue-600 text-white px-6 py-3 flex items-center justify-between border-b border-blue-700">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Preview Mode (Draft)</span>
        </div>
        <div className="text-xs opacity-75">
          Page: {pageData.title}
        </div>
        <button
          onClick={() => window.close()}
          className="text-sm px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
        >
          Close Preview
        </button>
      </div>

      {/* Preview Content */}
      <PageRenderer
        components={pageData.content}
        storefront={{
          subdomain: 'preview',
          id: 0,
          name: 'Preview',
        }}
        isPreview={true}
      />
    </div>
  )
}
