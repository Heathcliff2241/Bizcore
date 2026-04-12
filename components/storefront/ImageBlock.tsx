'use client'

import Image from 'next/image'
import { useState } from 'react'
import { X, ZoomIn } from 'lucide-react'
import type { StorefrontContext } from './types'
import { resolveStorefrontHref } from './utils/links'
import { getResponsiveSizes, getResponsiveQuality } from './utils/responsiveImages'

interface ImageBlockProps {
  src?: string
  alt?: string
  width?: number
  height?: number
  objectFit?: 'cover' | 'contain' | 'fill'
  caption?: string
  borderRadius?: number
  backgroundColor?: string
  fullWidth?: boolean
  linkUrl?: string
  enableLightbox?: boolean
  hoverEffect?: 'zoom' | 'opacity' | 'scale' | 'none'
  storefront?: StorefrontContext
}

export function ImageBlock({
  src = '/placeholder-image.jpg',
  alt = 'Image',
  width = 800,
  height = 600,
  objectFit = 'cover',
  caption,
  borderRadius = 8,
  backgroundColor = '#f3f4f6',
  fullWidth = true,
  linkUrl,
  enableLightbox = true,
  hoverEffect = 'zoom',
  storefront
}: ImageBlockProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const resolvedLink = linkUrl ? resolveStorefrontHref(linkUrl, storefront, { allowEmpty: true, label: alt }) : null

  const handleImageClick = () => {
    if (resolvedLink && resolvedLink.href !== '#') {
      if (resolvedLink.isExternal) {
        window.open(resolvedLink.href, '_blank', 'noopener,noreferrer')
      } else {
        // For internal navigation, you might want to use Next.js router
        window.location.href = resolvedLink.href
      }
    } else if (enableLightbox) {
      setIsLightboxOpen(true)
    }
  }

  const getHoverClasses = () => {
    switch (hoverEffect) {
      case 'zoom':
        return 'hover:scale-105 transition-transform duration-300 cursor-pointer'
      case 'opacity':
        return 'hover:opacity-80 transition-opacity duration-300 cursor-pointer'
      case 'scale':
        return 'hover:scale-110 transition-transform duration-300 cursor-pointer'
      default:
        return enableLightbox || resolvedLink ? 'cursor-pointer' : ''
    }
  }

  if (imageError) {
    return (
      <section 
        className={`w-full ${fullWidth ? '' : 'px-8 md:px-16 lg:px-24'}`}
        style={{ backgroundColor }}
      >
        <div className={`w-full ${!fullWidth ? 'max-w-7xl mx-auto' : ''}`}>
          <div 
            className="relative overflow-hidden flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300"
            style={{ 
              borderRadius: `${borderRadius}px`,
              aspectRatio: `${width} / ${height}`
            }}
          >
            <div className="text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Image failed to load</p>
              <p className="text-xs mt-1">{src}</p>
            </div>
          </div>
          
          {caption && (
            <div className="bg-white/90 p-4 text-center mt-2" style={{ borderRadius: `${borderRadius}px` }}>
              <p className="text-sm text-gray-700">{caption}</p>
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <>
      <section 
        className={`w-full ${fullWidth ? '' : 'px-8 md:px-16 lg:px-24'}`}
        style={{ backgroundColor }}
      >
        <div className={`w-full ${!fullWidth ? 'max-w-7xl mx-auto' : ''}`}>
          <div 
            className={`relative overflow-hidden group ${getHoverClasses()}`}
            style={{ 
              borderRadius: `${borderRadius}px`
            }}
            onClick={handleImageClick}
          >
            {/* Loading skeleton */}
            {!imageLoaded && (
              <div 
                className="absolute inset-0 bg-gray-200 animate-pulse"
                style={{ 
                  aspectRatio: `${width} / ${height}`
                }}
              />
            )}

            <div 
              className="relative"
              style={{ 
                width: '100%',
                aspectRatio: `${width} / ${height}`
              }}
            >
              <Image
                src={src}
                alt={alt}
                fill
                className={`object-${objectFit} transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                sizes={getResponsiveSizes('feature')}
                quality={getResponsiveQuality()}
                loading="lazy"
              />
            </div>
            
            {/* Hover overlay */}
            {(enableLightbox || resolvedLink) && (
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {resolvedLink ? (
                    <div className="bg-white rounded-full p-2">
                      <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  ) : (
                    <ZoomIn className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>
            )}

            {/* Caption */}
            {caption && (
              <div className="bg-white/90 p-4 text-center">
                <p className="text-sm text-gray-700">{caption}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative max-w-5xl max-h-screen p-4">
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsLightboxOpen(false)
              }}
              className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Image */}
            <div className="relative">
              <Image
                src={src}
                alt={alt}
                width={1200}
                height={800}
                className="max-w-full max-h-screen object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              
              {/* Caption in lightbox */}
              {caption && (
                <div className="bg-black bg-opacity-75 text-white p-4 mt-4 rounded">
                  <p className="text-center">{caption}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
