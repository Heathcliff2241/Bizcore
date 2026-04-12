'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { componentMap, hasComponent } from './index'
import type { StorefrontContext } from './types'
import { FontLoader } from './FontLoader'
import { 
  getMobileTransformStyles,
  shouldHideOnMobile,
  shouldStackOnMobile,
  isMobile,
  isTablet,
} from './utils/mobileResponsive'

interface ComponentData {
  id: string
  type: string
  props: Record<string, unknown>
  position?: { x: number; y: number }
  size?: { width: number; height: number }
  rotation?: number
  zIndex?: number
  hidden?: boolean
  mobile?: {
    scalePercent?: number
    offsetX?: number
    offsetY?: number
    hideOnMobile?: boolean
  }
  children?: ComponentData[]
  anchored?: boolean
  anchor?: string
}

interface PageRendererProps {
  components: ComponentData[]
  storefront: StorefrontContext
  isPreview?: boolean
}

// Map section types to semantic anchor IDs for single-page navigation
const SECTION_ANCHOR_MAP: Record<string, string> = {
  'hero': 'hero',
  'hero-default': 'hero',
  'hero-split': 'hero',
  'hero-minimal': 'hero',
  'hero-glass': 'hero',
  'product-grid': 'products',
  'product-carousel': 'products',
  'product-featured': 'featured',
  'about': 'about',
  'about-split': 'about',
  'contact-form': 'contact',
  'testimonials': 'testimonials',
  'testimonials-grid': 'testimonials',
  'testimonials-carousel': 'testimonials',
  'trust-badges': 'trust',
  'cta': 'cta',
  'cta-banner': 'cta',
  'cta-split': 'cta',
  'newsletter': 'newsletter',
  'footer': 'footer',
  'footer-minimal': 'footer',
  'footer-detailed': 'footer',
  'blank': 'custom',
  'blank-section': 'custom',
}

// Track used anchors to avoid duplicates (append number if needed)
function getAnchorId(component: ComponentData, usedAnchors: Set<string>): string | undefined {
  // First, check if component has an explicit anchor set in BrandStudio
  if (component.anchor && typeof component.anchor === 'string' && component.anchor.trim()) {
    const explicitAnchor = component.anchor.trim().toLowerCase().replace(/\s+/g, '-')
    let anchor = explicitAnchor
    let counter = 2
    while (usedAnchors.has(anchor)) {
      anchor = `${explicitAnchor}-${counter}`
      counter++
    }
    usedAnchors.add(anchor)
    return anchor
  }
  
  // Fall back to type-based anchor mapping
  let baseAnchor = SECTION_ANCHOR_MAP[component.type]
  
  // If not in map, derive from component type (matches BrandStudio behavior)
  if (!baseAnchor) {
    const derivedType = component.type?.replace(/section/i, '').trim() || 'section'
    baseAnchor = derivedType.toLowerCase().replace(/\s+/g, '-')
  }
  
  if (!baseAnchor) return undefined
  
  let anchor = baseAnchor
  let counter = 2
  while (usedAnchors.has(anchor)) {
    anchor = `${baseAnchor}-${counter}`
    counter++
  }
  usedAnchors.add(anchor)
  return anchor
}

export function PageRenderer({ components, storefront, isPreview = false }: PageRendererProps) {
  // Track viewport width for mobile transforms - ALL HOOKS MUST be before any early returns
  const [viewportWidth, setViewportWidth] = useState(1440)

  useEffect(() => {
    // Set initial viewport width
    setViewportWidth(typeof window !== 'undefined' ? window.innerWidth : 1440)

    // Listen for resize events to update viewport
    const handleResize = () => {
      setViewportWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Enable smooth scrolling for anchor navigation
  useEffect(() => {
    // Add smooth scroll behavior to document
    document.documentElement.style.scrollBehavior = 'smooth'
    
    // Handle anchor clicks with offset for sticky header
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a[href^="#"]')
      if (anchor) {
        const href = anchor.getAttribute('href')
        if (href && href.startsWith('#') && href.length > 1) {
          e.preventDefault()
          const element = document.getElementById(href.slice(1))
          if (element) {
            const headerHeight = 80 // Sticky header height
            const elementPosition = element.getBoundingClientRect().top + window.scrollY
            window.scrollTo({
              top: elementPosition - headerHeight,
              behavior: 'smooth'
            })
          }
        }
      }
    }
    
    document.addEventListener('click', handleAnchorClick)
    return () => {
      document.removeEventListener('click', handleAnchorClick)
      document.documentElement.style.scrollBehavior = ''
    }
  }, [])

  // Guard against undefined components - AFTER all hooks
  if (!components || !Array.isArray(components)) {
    return null
  }

  // Build navigation links from page sections
  const navigationLinks: Array<{ label: string; url: string }> = []
  const sectionAnchors = new Set<string>()
  
  // Scan components to collect section anchors - ONLY if anchored is enabled
  function collectSectionAnchors(items: ComponentData[]): void {
    if (!items) return
    items.forEach((component) => {
      console.log(`[PageRenderer] Checking component: ${component.type}, anchored=${component.anchored}`)
      // IMPORTANT: Only add to nav if anchoring is explicitly enabled
      if (component.anchored) {
        const anchor = getAnchorId(component, sectionAnchors)
        if (anchor) {
          // Use the anchor ID as the label, formatted nicely
          // Convert 'about-us' to 'About Us', 'products' to 'Products'
          const label = anchor
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
          navigationLinks.push({ label, url: `#${anchor}` })
          console.log(`[PageRenderer] ✓ Added anchored section: ${component.type} -> ${label} (#${anchor})`)
        }
      }
      if (component.children?.length) {
        collectSectionAnchors(component.children)
      }
    })
  }
  
  collectSectionAnchors(components)
  console.log(`[PageRenderer] Total anchored sections found: ${navigationLinks.length}`, navigationLinks)
  
  // Track used anchor IDs to avoid duplicates
  const usedAnchors = new Set<string>()
  // Flatten hierarchical components for rendering
  function flattenComponents(items: ComponentData[], parentPosition = { x: 0, y: 0 }, parentId = ''): ComponentData[] {
    if (!items) return []
    const result: ComponentData[] = []
    
    items.forEach((item) => {
      const flatItem = { ...item }
      // Adjust position for children
      if (flatItem.position) {
        flatItem.position = {
          x: flatItem.position.x + parentPosition.x,
          y: flatItem.position.y + parentPosition.y
        }
      } else {
        flatItem.position = { ...parentPosition }
      }
      
      // Make id unique for flattened children
      if (parentId) {
        flatItem.id = `${parentId}-${item.id}`
      }

      // Remove children so flattened items do not re-render nested children (prevents duplicates)
      if (flatItem.children && flatItem.children.length > 0) {
        delete flatItem.children
      }
      
      result.push(flatItem)
      
      if (item.children && item.children.length > 0) {
        result.push(...flattenComponents(item.children, flatItem.position, flatItem.id))
      }
    })
    
    return result
  }
  
  const flatComponents = flattenComponents(components)

  // Determine if a component is a section (full-width block) or a freeform element
  const isSectionType = (type: string): boolean => {
    const sectionTypes = [
      'header', 'header-default', 'header-glass',
      'hero', 'hero-default', 'hero-split', 'hero-minimal', 'hero-glass',
      'product-grid', 'product-carousel', 'product-featured',
      'about', 'about-split', 'contact-form',
      'cta', 'cta-banner', 'cta-split', 'newsletter',
      'footer', 'footer-minimal', 'footer-detailed',
      'testimonials', 'testimonials-grid', 'testimonials-carousel', 'trust-badges',
      'login-form', 'signup-form',
      'divider', 'spacer', 'block', 'blank', 'blank-section', 'glass-section'
    ]
    return sectionTypes.includes(type)
  }

  const visibleComponents = flatComponents
    .filter(component => !component.hidden)
    .filter(component => {
      // Skip children of sections - they're rendered inside the section
      const isChildOfSection = flatComponents.some(parent => 
        isSectionType(parent.type) && component.id.startsWith(`${parent.id}-`)
      )
      return !isChildOfSection
    })
    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))

  const renderComponentTree = (
    items: ComponentData[],
    offsets: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
  ): ReactNode[] => {
    if (!items || !Array.isArray(items)) {
      return []
    }
    const result: ReactNode[] = []

    items
      .filter(item => !item.hidden)
      .filter(item => {
        // Filter out elements that should be hidden on mobile
        if (shouldHideOnMobile(item.mobile, viewportWidth)) {
          return false
        }
        return true
      })
      .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
      .forEach((component) => {
        const { id, type, props, position, size, rotation, zIndex, children, mobile } = component
        const absoluteX = offsets.x + (position?.x ?? 0)
        const absoluteY = offsets.y + (position?.y ?? 0)
        const computedZ = offsets.z + (zIndex ?? 0)

        // For sections at top level, use relative/block layout; for freeform elements, use absolute positioning
        const isSection = isSectionType(type)
        const isTopLevel = offsets.x === 0 && offsets.y === 0
        
        // For images with contain mode, allow height to be auto to respect aspect ratio
        const isImage = type === 'image'

        // Get mobile transform styles for freeform elements
        const mobileTransforms = !isSection && !isTopLevel ? getMobileTransformStyles(mobile, viewportWidth) : {}

        const positionStyle: CSSProperties = isSection && isTopLevel
          ? {
// Section: full-width if full-bleed, otherwise canvas width centered
              width: '1528px',
              margin: '0 auto',
              minHeight: size?.height ?? 'auto', // Use min-height instead of height to allow content expansion
              position: 'relative',
              zIndex: computedZ,
              boxSizing: 'border-box'
            }
          : {
              // Freeform or nested element: use absolute positioning
          position: 'absolute',
          left: absoluteX,
          top: absoluteY,
          width: size?.width ?? 'auto',
          height: isImage ? 'auto' : (size?.height ?? 'auto'),
          transform: rotation ? `rotate(${rotation}deg)` : undefined,
          zIndex: computedZ,
          boxSizing: 'border-box',
          ...mobileTransforms  // Apply mobile transforms to freeform elements
        }

                if (!hasComponent(type)) {
          if (!isPreview) {
            return
          }

          result.push(
            <div
              key={id}
              style={positionStyle}
              className="flex items-center justify-center border border-dashed border-gray-300 bg-gray-100/60 text-xs text-gray-500"
            >
              Unknown component: {type}
            </div>
          )
          return
        }

        const Component = componentMap[type]
        const componentProps: Record<string, unknown> = { ...props }
        
        // Map 'columns' to 'itemsToShow' for product-carousel
        if (type === 'product-carousel' && 'columns' in componentProps && !('itemsToShow' in componentProps)) {
          componentProps.itemsToShow = componentProps.columns
          delete componentProps.columns
        }
        
        if (size) {
          const existingSize = (componentProps.size as { width?: number; height?: number } | undefined) || {}
          componentProps.size = {
            ...existingSize,
            ...size
          }
          if (size.height !== undefined) {
            componentProps.height = size.height
          }
          if (size.width !== undefined) {
            componentProps.width = size.width
          }
        }

        // For top-level sections, wrap in a constrained container
        if (isSection && isTopLevel) {
          // For top-level sections remove the canvas-derived width and let the component
          // decide whether it's constrained (max-w-7xl) or full-bleed. This prevents
          // double-centering where both PageRenderer and the component constrain width.
          const sectionProps = { ...componentProps }
          // If tenant has a storefront setting for full-width sections, default to that
          try {
            const s = (storefront?.settings as Record<string, unknown> | undefined) ?? undefined
            if (sectionProps.fullWidth === undefined && s && s['fullWidthSections'] !== undefined) {
              sectionProps.fullWidth = Boolean(s['fullWidthSections'])
            }
          } catch {
            // ignore malformed settings
          }
          // Default to full-bleed for any section type unless explicit override
          if (sectionProps.fullWidth === undefined && isSectionType(type)) {
            sectionProps.fullWidth = true
          }
          delete sectionProps.width  // Remove canvas width so section can take 100% if desired

          // Calculate computed minHeight from any absolute-positioned children
          let computedMinHeight = size?.height ?? 0
          if (isSection && isTopLevel) {
            const sectionAbsY = position?.y ?? 0
            const childExtents = flatComponents
              .filter(c => c.id.startsWith(`${id}-`) && !c.hidden)
              .map(c => ((c.position?.y ?? 0) + (c.size?.height ?? 0)))
            if (childExtents.length > 0) {
              const maxChildBottom = Math.max(...childExtents)
              const requiredMin = Math.max(0, maxChildBottom - sectionAbsY)
              computedMinHeight = Math.max(computedMinHeight || 0, requiredMin)
            }
          }

          // Collect and render children for all sections
          let renderedChildren: ReactNode[] = []
          if (isSection && isTopLevel) {
            const childComponents = flatComponents.filter(c => c.id.startsWith(`${id}-`) && !c.hidden)
            
            // Apple-style: On mobile, sort children by vertical position and stack them
            const sortedChildren = [...childComponents].sort((a, b) => {
              // Sort by Y position (top to bottom), then by X position (left to right)
              const yDiff = (a.position?.y ?? 0) - (b.position?.y ?? 0)
              if (Math.abs(yDiff) > 50) return yDiff // Different rows
              return (a.position?.x ?? 0) - (b.position?.x ?? 0) // Same row, sort left to right
            })

            const isMobileView = isMobile(viewportWidth)
            const isTabletView = isTablet(viewportWidth)

            renderedChildren = sortedChildren.map((child, childIndex) => {
              // Calculate position relative to the section
              // IMPORTANT: Sections start at x=0 on the canvas, so childAbsoluteX should be
              // relative to the section's left edge, NOT the canvas origin
              const sectionX = position?.x ?? 0
              const sectionY = position?.y ?? 0
              const childAbsoluteX = (child.position?.x ?? 0) - sectionX
              const childAbsoluteY = (child.position?.y ?? 0) - sectionY
              const childComputedZ = (child.zIndex ?? 0)

              // Apple-style: Stack children vertically on mobile for better UX
              const shouldStack = shouldStackOnMobile(child.type, child.mobile, viewportWidth)

              // CANVAS_WIDTH is the BrandStudio canvas width - children are positioned on this
              const CANVAS_WIDTH = 1440
              // Section width in canvas coordinates (usually same as CANVAS_WIDTH for full-width sections)
              const sectionCanvasWidth = size?.width ?? CANVAS_WIDTH
              
              // Calculate position as percentage of the SECTION width (in canvas coordinates)
              // This ensures the child stays in the same relative position within the section
              const positionLeftPercent = (childAbsoluteX / sectionCanvasWidth) * 100
              const widthPercent = ((child.size?.width ?? 200) / sectionCanvasWidth) * 100
              
              // For height, we use pixels to maintain visual consistency
              const childHeight = child.size?.height

              let childPositionStyle: CSSProperties

              if (isMobileView && shouldStack) {
                // Apple-style: Stacked vertical layout on mobile
                // Elements flow naturally, centered, with consistent spacing
                childPositionStyle = {
                  position: 'relative',
                  width: '100%',
                  maxWidth: child.size?.width ? `${Math.min(child.size.width, 400)}px` : '100%',
                  margin: '0 auto',
                  marginTop: childIndex === 0 ? '16px' : '12px',
                  marginBottom: '12px',
                  padding: '0 16px',
                  boxSizing: 'border-box',
                  zIndex: childComputedZ,
                }
              } else if (isTabletView) {
                // Tablet: Use percentage-based positioning within the 1440px container
                childPositionStyle = {
                  position: 'absolute',
                  left: `${positionLeftPercent}%`,
                  top: childAbsoluteY,
                  width: `${widthPercent}%`,
                  height: childHeight ? `${childHeight}px` : 'auto',
                  transform: child.rotation ? `rotate(${child.rotation}deg)` : undefined,
                  zIndex: childComputedZ,
                  boxSizing: 'border-box',
                }
              } else {
                // Desktop: Original absolute positioning within the 1440px container
                childPositionStyle = {
                  position: 'absolute',
                  left: `${positionLeftPercent}%`,
                  top: childAbsoluteY,
                  width: `${widthPercent}%`,
                  height: childHeight ? `${childHeight}px` : 'auto',
                  transform: child.rotation ? `rotate(${child.rotation}deg)` : undefined,
                  zIndex: childComputedZ,
                  boxSizing: 'border-box',
                }
              }

              const ChildComponent = componentMap[child.type]
              if (!ChildComponent) return null

              const childComponentProps: Record<string, unknown> = { ...child.props }
              if (child.size) {
                const existingSize = (childComponentProps.size as { width?: number; height?: number } | undefined) || {}
                childComponentProps.size = {
                  ...existingSize,
                  width: undefined, // Remove explicit width since it's handled by the container percentage
                  height: child.size.height
                }
                if (child.size.height !== undefined) {
                  childComponentProps.height = child.size.height
                }
                // Don't set width in component props - let the container percentage handle it
              }

              return (
                <div key={child.id} style={childPositionStyle}>
                  <ChildComponent {...childComponentProps} storefront={storefront} />
                </div>
              )
            })
          }

          const sectionPositionStyle: CSSProperties = {
            // Section: full-width if full-bleed, otherwise canvas width centered
            width: sectionProps.fullWidth ? '100%' : '1528px',
            margin: sectionProps.fullWidth ? '0' : '0 auto',
            minHeight: computedMinHeight > 0 ? `${computedMinHeight}px` : (size?.height ?? 'auto'),
            // Apple-style: On mobile, use flexible height to accommodate stacked content
            height: isMobile(viewportWidth) ? 'auto' : (size?.height !== undefined ? `${size.height}px` : undefined),
            position: 'relative',
            zIndex: computedZ,
            boxSizing: 'border-box',
            // Apple-style: Smooth transitions between breakpoints
            transition: 'all 0.3s ease-out',
          }

          // Wrapper styles for children container - enables flex stacking on mobile
          // IMPORTANT: On desktop, constrain to canvas width so percentage positioning works correctly
          const childrenWrapperStyle: CSSProperties = isMobile(viewportWidth) ? {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            padding: '16px 0',
          } : {
            // Desktop: absolute positioning container, constrained to canvas width
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '1440px', // Match BrandStudio canvas width
            height: '100%',
          }

          // Generate anchor ID for single-page navigation (prefer explicit anchor from BrandStudio)
          const anchorId = getAnchorId(component, usedAnchors)
          
          // Inject navigationLinks into header components for single-page nav
          // Always inject if we have anchored sections, overriding defaults
          if ((type === 'header' || type === 'header-default' || type === 'header-glass') && navigationLinks.length > 0) {
            sectionProps.navigationLinks = navigationLinks
            console.log(`[PageRenderer] Injecting ${navigationLinks.length} anchored sections into ${type} header`)
          }

          result.push(
            <div key={id} id={anchorId} style={sectionPositionStyle}>
              <Component {...sectionProps} storefront={storefront} />
              {/* Apple-style: Responsive children container */}
              {renderedChildren.length > 0 && (
                <div style={childrenWrapperStyle}>
                  {renderedChildren}
                </div>
              )}
            </div>
          )
        } else {
          result.push(
            <div key={id} style={positionStyle}>
              <Component {...componentProps} storefront={storefront} />
            </div>
          )
        }

        if (children && children.length > 0) {
          result.push(
            ...renderComponentTree(children, {
              x: absoluteX,
              y: absoluteY,
              z: computedZ + 1
            })
          )
        }
      })

    return result
  }

  const renderedComponents = renderComponentTree(visibleComponents)

  // Generate CSS variables for theme colors
  const cssVariables = {
    '--color-primary': storefront.primaryColor || '#3b82f6',
    '--color-secondary': storefront.secondaryColor || '#10b981',
    '--color-accent': storefront.primaryColor ? `${storefront.primaryColor}dd` : '#3b82f6dd'
  } as React.CSSProperties

  return (
    <div className="relative w-full min-h-screen bg-white overflow-x-hidden" style={cssVariables}>
      <FontLoader components={components} />
      {visibleComponents.length === 0 && (
        <div className="flex min-h-screen items-center justify-center text-gray-400">
          <div className="text-center">
            <svg className="mx-auto mb-4 h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-xl">This page has no content yet</p>
          </div>
        </div>
      )}

              {renderedComponents}
          </div>
  )
}
