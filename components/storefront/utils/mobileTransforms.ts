import type { CSSProperties } from 'react'

export interface MobileConfig {
  scalePercent?: number  // 50-100, default 100. How much to scale on mobile (70 = 70%)
  offsetX?: number       // Pixels to shift right on mobile
  offsetY?: number       // Pixels to shift down on mobile
  hideOnMobile?: boolean // Hide element on mobile devices
}

/**
 * Calculate responsive scale based on viewport width
 * Mobile (<640px): Use specified scalePercent or 75%
 * Tablet (640-1024px): Use 85-90% scale
 * Desktop (>1024px): Use 100% scale (no scaling)
 */
export function getResponsiveScale(mobileConfig?: MobileConfig, viewportWidth: number = 1440): number {
  if (!mobileConfig) return 1

  // Desktop: no scaling
  if (viewportWidth > 1024) {
    return 1
  }

  // Tablet: partial scaling
  if (viewportWidth > 640) {
    return 0.9
  }

  // Mobile: use configured scale or default to 75%
  const configuredScale = mobileConfig.scalePercent ?? 75
  return configuredScale / 100
}

/**
 * Apply mobile transforms (scale + reposition) to component styles
 * Returns CSS properties to apply for mobile responsiveness
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
  if (viewportWidth > 1024) {
    return {}
  }

  const transforms: string[] = []

  // Apply scale transform
  if (scale !== 1) {
    transforms.push(`scale(${scale})`)
  }

  // Apply translation AFTER scale (so offsets are in original coordinates)
  if (offsetX !== 0 || offsetY !== 0) {
    // Translate after scaling, accounting for scale origin
    transforms.push(`translate(${offsetX}px, ${offsetY}px)`)
  }

  return {
    transform: transforms.length > 0 ? transforms.join(' ') : undefined,
    // Use transform-origin to scale from top-left corner
    transformOrigin: 'top left',
    // Add transition for smooth scaling changes
    transition: 'transform 0.3s ease-out',
  }
}

/**
 * Check if element should be hidden on mobile
 */
export function shouldHideOnMobile(mobileConfig: MobileConfig | undefined, viewportWidth: number = 1440): boolean {
  if (!mobileConfig?.hideOnMobile) return false

  // Hide on mobile and tablet, show on desktop
  return viewportWidth <= 1024
}

/**
 * Get viewport-aware mobile config
 * Used in client components that know the actual viewport
 */
export function useMobileDeviceType(windowWidth?: number): 'mobile' | 'tablet' | 'desktop' {
  if (!windowWidth) return 'desktop'
  
  if (windowWidth < 640) return 'mobile'
  if (windowWidth < 1024) return 'tablet'
  return 'desktop'
}
