import type { CSSProperties } from 'react'

export interface MobileConfig {
  scalePercent?: number
  offsetX?: number
  offsetY?: number
  hideOnMobile?: boolean
  // NEW: Apple-style responsive behavior
  stackOnMobile?: boolean       // Stack elements vertically on mobile (default: true)
  mobileOrder?: number          // Order when stacked (lower = higher)
  mobileFullWidth?: boolean     // Take full width on mobile (default: true for text/buttons)
  mobileCenterContent?: boolean // Center content on mobile
}

// Breakpoints matching Tailwind defaults
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

/**
 * Get current breakpoint name based on viewport width
 */
export function getBreakpoint(viewportWidth: number): Breakpoint {
  if (viewportWidth < BREAKPOINTS.sm) return 'mobile'
  if (viewportWidth < BREAKPOINTS.lg) return 'tablet'
  return 'desktop'
}

/**
 * Check if viewport is mobile-sized
 */
export function isMobile(viewportWidth: number): boolean {
  return viewportWidth < BREAKPOINTS.sm
}

/**
 * Check if viewport is tablet-sized
 */
export function isTablet(viewportWidth: number): boolean {
  return viewportWidth >= BREAKPOINTS.sm && viewportWidth < BREAKPOINTS.lg
}

/**
 * Calculate responsive scale based on viewport width
 * Apple approach: Subtle scaling, content reflow is preferred
 */
export function getResponsiveScale(mobileConfig?: MobileConfig, viewportWidth: number = 1440): number {
  if (!mobileConfig) return 1

  // Desktop: no scaling
  if (viewportWidth >= BREAKPOINTS.lg) {
    return 1
  }

  // Tablet: very subtle scaling (95%)
  if (viewportWidth >= BREAKPOINTS.sm) {
    return 0.95
  }

  // Mobile: use configured scale or default to 85% (less aggressive than before)
  const configuredScale = mobileConfig.scalePercent ?? 85
  return configuredScale / 100
}

/**
 * Apple-style: Should this element stack on mobile instead of absolute positioning?
 * Default behavior varies by component type
 */
export function shouldStackOnMobile(
  componentType: string,
  mobileConfig?: MobileConfig,
  viewportWidth: number = 1440
): boolean {
  // Only on mobile viewport
  if (viewportWidth >= BREAKPOINTS.sm) return false
  
  // Explicit override in config
  if (mobileConfig?.stackOnMobile !== undefined) {
    return mobileConfig.stackOnMobile
  }

  // Default: Most content types should stack on mobile for better UX
  const stackableTypes = [
    'text', 'heading', 'paragraph', 'button', 'image', 
    'card', 'feature', 'testimonial', 'badge', 'icon'
  ]
  
  return stackableTypes.some(t => componentType.toLowerCase().includes(t))
}

/**
 * Get CSS for stacked mobile layout (Apple-style vertical flow)
 */
export function getStackedMobileStyles(
  componentType: string,
  mobileConfig?: MobileConfig
): CSSProperties {
  const shouldFullWidth = mobileConfig?.mobileFullWidth ?? 
    ['text', 'heading', 'paragraph', 'button'].some(t => componentType.toLowerCase().includes(t))
  
  const shouldCenter = mobileConfig?.mobileCenterContent ?? true

  return {
    position: 'relative',
    width: shouldFullWidth ? '100%' : 'auto',
    maxWidth: '100%',
    margin: shouldCenter ? '0 auto' : undefined,
    textAlign: shouldCenter ? 'center' : undefined,
    // Responsive padding
    padding: '12px 16px',
  }
}

/**
 * Apply mobile transforms (scale + reposition) to component styles
 * Used when NOT stacking (maintaining absolute position with scaling)
 */
export function getMobileTransformStyles(
  mobileConfig: MobileConfig | undefined,
  viewportWidth: number = 1440
): CSSProperties {
  if (!mobileConfig) return {}

  const scale = getResponsiveScale(mobileConfig, viewportWidth)
  const offsetX = mobileConfig.offsetX ?? 0
  const offsetY = mobileConfig.offsetY ?? 0

  // Only apply transforms on mobile/tablet, not desktop
  if (viewportWidth >= BREAKPOINTS.lg) {
    return {}
  }

  const transforms: string[] = []

  // Apply scale transform
  if (scale !== 1) {
    transforms.push(`scale(${scale})`)
  }

  // Apply translation AFTER scale
  if (offsetX !== 0 || offsetY !== 0) {
    transforms.push(`translate(${offsetX}px, ${offsetY}px)`)
  }

  return {
    transform: transforms.length > 0 ? transforms.join(' ') : undefined,
    transformOrigin: 'top left',
    transition: 'transform 0.3s ease-out',
  }
}

/**
 * Check if element should be hidden on mobile
 */
export function shouldHideOnMobile(mobileConfig: MobileConfig | undefined, viewportWidth: number = 1440): boolean {
  if (!mobileConfig?.hideOnMobile) return false
  return viewportWidth < BREAKPOINTS.sm
}

/**
 * Get responsive container styles for a section
 * Apple-style: Fluid padding, constrained max-width on larger screens
 */
export function getResponsiveSectionStyles(viewportWidth: number): CSSProperties {
  const breakpoint = getBreakpoint(viewportWidth)
  
  switch (breakpoint) {
    case 'mobile':
      return {
        padding: '24px 16px',
        width: '100%',
      }
    case 'tablet':
      return {
        padding: '32px 24px',
        width: '100%',
        maxWidth: '768px',
        margin: '0 auto',
      }
    case 'desktop':
    default:
      return {
        padding: '48px 32px',
        width: '100%',
        maxWidth: '1280px',
        margin: '0 auto',
      }
  }
}

/**
 * Get responsive typography scale factor
 * Apple uses ~16px base on mobile, scaling up on larger screens
 */
export function getTypographyScale(viewportWidth: number): number {
  if (viewportWidth < BREAKPOINTS.sm) return 0.875  // 14px base
  if (viewportWidth < BREAKPOINTS.md) return 0.9375 // 15px base
  return 1 // 16px base
}

/**
 * Get responsive gap/spacing scale factor
 */
export function getSpacingScale(viewportWidth: number): number {
  if (viewportWidth < BREAKPOINTS.sm) return 0.75
  if (viewportWidth < BREAKPOINTS.md) return 0.875
  return 1
}
