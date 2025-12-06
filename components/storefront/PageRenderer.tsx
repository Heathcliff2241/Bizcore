'use client'

import type { CSSProperties, ReactNode } from 'react'
import { componentMap, hasComponent } from './index'
import type { StorefrontContext } from './types'
import { FontLoader } from './FontLoader'

interface ComponentData {
  id: string
  type: string
  props: Record<string, unknown>
  position?: { x: number; y: number }
  size?: { width: number; height: number }
  rotation?: number
  zIndex?: number
  hidden?: boolean
  children?: ComponentData[]
}

interface PageRendererProps {
  components: ComponentData[]
  storefront: StorefrontContext
  isPreview?: boolean
}

export function PageRenderer({ components, storefront, isPreview = false }: PageRendererProps) {
  // Flatten hierarchical components for rendering
  function flattenComponents(items: ComponentData[], parentPosition = { x: 0, y: 0 }, parentId = ''): ComponentData[] {
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
      'cta', 'cta-banner', 'cta-split', 'newsletter',
      'footer', 'footer-minimal', 'footer-detailed',
      'testimonials', 'testimonials-grid', 'testimonials-carousel', 'trust-badges',
      'login-form', 'signup-form',
      'divider', 'spacer', 'block', 'blank'
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
    const result: ReactNode[] = []

    items
      .filter(item => !item.hidden)
      .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
      .forEach((component) => {
        const { id, type, props, position, size, rotation, zIndex, children } = component
        const absoluteX = offsets.x + (position?.x ?? 0)
        const absoluteY = offsets.y + (position?.y ?? 0)
        const computedZ = offsets.z + (zIndex ?? 0)

        // For sections at top level, use relative/block layout; for freeform elements, use absolute positioning
        const isSection = isSectionType(type)
        const isTopLevel = offsets.x === 0 && offsets.y === 0
        
        // For images with contain mode, allow height to be auto to respect aspect ratio
        const isImage = type === 'image'

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
          boxSizing: 'border-box'
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
            renderedChildren = childComponents.map(child => {
              // Calculate position relative to the section
              const childAbsoluteX = (child.position?.x ?? 0) - (position?.x ?? 0)
              const childAbsoluteY = (child.position?.y ?? 0) - (position?.y ?? 0)
              const childComputedZ = (child.zIndex ?? 0)

              const childPositionStyle: CSSProperties = {
                position: 'absolute',
                left: childAbsoluteX,
                top: childAbsoluteY,
                width: child.size?.width ?? 'auto',
                height: child.size?.height ?? 'auto',
                transform: child.rotation ? `rotate(${child.rotation}deg)` : undefined,
                zIndex: childComputedZ,
                boxSizing: 'border-box'
              }

              const ChildComponent = componentMap[child.type]
              if (!ChildComponent) return null

              const childComponentProps: Record<string, unknown> = { ...child.props }
              if (child.size) {
                const existingSize = (childComponentProps.size as { width?: number; height?: number } | undefined) || {}
                childComponentProps.size = {
                  ...existingSize,
                  ...child.size
                }
                if (child.size.height !== undefined) {
                  childComponentProps.height = child.size.height
                }
                if (child.size.width !== undefined) {
                  childComponentProps.width = child.size.width
                }
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
            minHeight: computedMinHeight > 0 ? `${computedMinHeight}px` : (size?.height ?? 'auto'), // Ensure section reserves space for children
            height: size?.height !== undefined ? `${size.height}px` : undefined,
            position: 'relative',
            zIndex: computedZ,
            boxSizing: 'border-box'
          }

          result.push(
            <div key={id} style={sectionPositionStyle}>
              <Component {...sectionProps} storefront={storefront} />
              {renderedChildren}
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
