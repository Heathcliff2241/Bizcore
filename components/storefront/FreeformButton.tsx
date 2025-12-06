import type { CSSProperties } from 'react'
import type { StorefrontContext } from './types'
import { resolveStorefrontHref } from './utils/links'

type SpacingConfig = {
  x?: number
  y?: number
  top?: number
  right?: number
  bottom?: number
  left?: number
}

interface FreeformButtonProps {
  text?: string
  link?: string
  url?: string
  storefront?: StorefrontContext
  backgroundColor?: string
  textColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  letterSpacing?: number
  uppercase?: boolean
  textTransform?: CSSProperties['textTransform']
  padding?: number | SpacingConfig
  justifyContent?: 'flex-start' | 'center' | 'flex-end'
  alignItems?: 'flex-start' | 'center' | 'flex-end'
  boxShadow?: string
  opacity?: number
}

function resolvePadding(padding?: number | SpacingConfig): string | number | undefined {
  if (typeof padding === 'number') {
    return padding
  }

  if (padding && typeof padding === 'object') {
    const { top, right, bottom, left, x, y } = padding
    const topValue = top ?? y ?? 0
    const bottomValue = bottom ?? y ?? 0
    const rightValue = right ?? x ?? 0
    const leftValue = left ?? x ?? 0
    return `${topValue}px ${rightValue}px ${bottomValue}px ${leftValue}px`
  }

  return undefined
}

function resolveTextTransform(
  explicit?: CSSProperties['textTransform'],
  uppercase?: boolean
): CSSProperties['textTransform'] {
  if (explicit) {
    return explicit
  }
  if (uppercase) {
    return 'uppercase'
  }
  return undefined
}

export function FreeformButton({
  text = 'Button',
  link,
  url,
  backgroundColor,
  textColor = '#ffffff',
  borderColor,
  borderWidth,
  borderRadius,
  fontSize,
  fontFamily,
  fontWeight,
  fontStyle,
  letterSpacing,
  uppercase,
  textTransform,
  padding,
  justifyContent = 'center',
  alignItems = 'center',
  boxShadow,
  opacity = 1,
  storefront,
}: FreeformButtonProps) {
  const rawHref = link || url || '#'
  const resolvedLink = resolveStorefrontHref(rawHref, storefront, { allowEmpty: true, label: text })
  const resolvedPadding = resolvePadding(padding)
  const resolvedTextTransform = resolveTextTransform(textTransform, uppercase)

  // Use theme primary color or fallback to dark gray
  const resolvedBackgroundColor = backgroundColor || 'var(--color-primary, #1f2937)'

  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems,
    justifyContent,
    width: '100%',
    height: '100%',
    backgroundColor: resolvedBackgroundColor,
    color: textColor,
    fontSize: fontSize ? `${fontSize}px` : undefined,
    fontFamily,
    fontWeight,
    fontStyle,
    letterSpacing: letterSpacing !== undefined ? `${letterSpacing}px` : undefined,
    borderRadius: borderRadius !== undefined ? `${borderRadius}px` : undefined,
    textDecoration: 'none',
    border: borderWidth ? `${borderWidth}px solid ${borderColor ?? textColor}` : borderColor ? `1px solid ${borderColor}` : undefined,
    boxShadow,
    opacity,
    padding: resolvedPadding,
    textTransform: resolvedTextTransform,
    transition: 'all 0.2s ease'
  }

  return (
    <a
      href={resolvedLink.href}
      style={style}
      target={resolvedLink.isExternal ? '_blank' : undefined}
      rel={resolvedLink.isExternal ? 'noopener noreferrer' : undefined}
    >
      {text}
    </a>
  )
}
