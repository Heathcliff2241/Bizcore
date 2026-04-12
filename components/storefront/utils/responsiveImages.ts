/**
 * Responsive Image Utilities for Next.js Image Component
 * Handles srcSet, sizes, and lazy loading for different screen sizes
 */

export interface ResponsiveImageConfig {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  quality?: number
  lazy?: boolean  // Default true for below-fold images
}

/**
 * Generate responsive sizes attribute for Next.js Image component
 * Tells browser which image size to load based on viewport
 * 
 * Returns CSS media query string for optimal image loading
 */
export function getResponsiveSizes(
  type: 'hero' | 'product' | 'thumbnail' | 'feature' | 'full' = 'full'
): string {
  const sizes: Record<string, string> = {
    // Hero images: take full width, but with viewport awareness
    hero: '(max-width: 640px) 100vw, (max-width: 1024px) 100vw, (max-width: 1440px) 100vw, 100vw',
    
    // Product images: typically in grid, responsive width
    product: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1440px) 33vw, 25vw',
    
    // Thumbnails: small images, minimal responsive behavior
    thumbnail: '(max-width: 640px) 80px, (max-width: 1024px) 100px, 120px',
    
    // Feature/About images: take ~half width on desktop, more on mobile
    feature: '(max-width: 640px) 100vw, (max-width: 1024px) 100vw, (max-width: 1440px) 50vw, 50vw',
    
    // Full width container
    full: '100vw',
  }
  
  return sizes[type] || sizes.full
}

/**
 * Get recommended widths for srcSet generation
 * These breakpoints match common device sizes
 */
export function getResponsiveWidths(
  maxWidth: number = 1440
): number[] {
  // Common viewport widths to generate images for
  const baseWidths = [
    320,  // Small mobile
    480,  // Mobile
    640,  // Small tablet / large mobile
    768,  // Tablet
    1024, // Large tablet
    1280, // Desktop
    1440, // Large desktop
  ]
  
  // Filter to only include widths up to maxWidth, and include 1.5x/2x densities
  const widths = new Set<number>()
  
  baseWidths.forEach(width => {
    if (width <= maxWidth) {
      widths.add(width)
      // For mobile/tablet, also add 2x density variant
      if (width <= 768) {
        widths.add(width * 2)
      }
    }
  })
  
  // Always include max width
  widths.add(maxWidth)
  
  return Array.from(widths).sort((a, b) => a - b)
}

/**
 * Get optimal image quality based on viewport width
 * Smaller devices get lower quality to reduce file size
 */
export function getResponsiveQuality(viewportWidth: number = 1440): number {
  if (viewportWidth < 640) return 60  // Mobile: lower quality, smaller file
  if (viewportWidth < 1024) return 75 // Tablet: medium quality
  return 85  // Desktop: high quality
}

/**
 * Calculate optimal image dimensions for viewport
 * Maintains aspect ratio
 */
export function getResponsiveDimensions(
  originalWidth: number,
  originalHeight: number,
  containerWidth: number,
  viewportWidth: number
): { width: number; height: number } {
  // Calculate aspect ratio
  const aspectRatio = originalWidth / originalHeight
  
  // Calculate max width based on viewport and container
  let maxWidth = containerWidth
  
  // On mobile, images might need to be smaller to avoid layout shift
  if (viewportWidth < 640) {
    maxWidth = Math.min(containerWidth, viewportWidth - 32) // 16px padding each side
  }
  
  // Calculate height maintaining aspect ratio
  const width = Math.min(originalWidth, maxWidth)
  const height = Math.round(width / aspectRatio)
  
  return { width, height }
}

/**
 * Generate Next.js Image component props for responsive loading
 */
export function getResponsiveImageProps(
  config: ResponsiveImageConfig & { type?: 'hero' | 'product' | 'thumbnail' | 'feature' | 'full' },
  viewportWidth: number = 1440
) {
  const {
    src,
    alt,
    width,
    height,
    priority = false,
    quality,
    lazy = true,
    type = 'full',
  } = config

  return {
    src,
    alt,
    width: width || 1440,
    height: height || 900,
    priority: priority || viewportWidth < 640, // Prioritize above-fold on mobile
    quality: quality || getResponsiveQuality(viewportWidth),
    sizes: getResponsiveSizes(type),
    loading: priority ? ('eager' as const) : (lazy ? ('lazy' as const) : ('eager' as const)),
    // Enable placeholder blur for better UX (requires blurDataURL)
    placeholder: 'empty' as const,
  }
}

/**
 * Generate srcSet attribute for image tag
 * Used for custom image implementations
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[],
  format: 'jpg' | 'webp' | 'avif' = 'webp'
): string {
  return widths
    .map(width => `${baseUrl}?w=${width}&q=75&fm=${format} ${width}w`)
    .join(', ')
}

/**
 * Check if image should be lazy loaded
 * Images above the fold (priority=true) should be eager
 */
export function shouldLazyLoad(isAboveFold: boolean = false): 'lazy' | 'eager' {
  return isAboveFold ? 'eager' : 'lazy'
}
