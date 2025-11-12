/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from 'react'

interface FreeformImageProps {
  src?: string | null
  alt?: string
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  borderRadius?: number
  borderColor?: string
  borderWidth?: number
  opacity?: number
  backgroundColor?: string
  boxShadow?: string
  padding?: number
  aspectRatio?: string | number
  size?: {
    width?: number
    height?: number
  }
}

function parseAspectRatio(value?: string | number): string | undefined {
  if (!value) return undefined
  if (typeof value === 'number') {
    return value.toString()
  }
  if (typeof value === 'string' && value.includes(':')) {
    const [w, h] = value.split(':').map(Number)
    if (!Number.isNaN(w) && !Number.isNaN(h) && h !== 0) {
      return (w / h).toString()
    }
  }
  return value
}

export function FreeformImage({
  src,
  alt,
  objectFit = 'cover',
  borderRadius,
  borderColor,
  borderWidth,
  opacity = 1,
  backgroundColor,
  boxShadow,
  padding,
  aspectRatio,
}: FreeformImageProps) {
  const resolvedSrc = typeof src === 'string' && src.length > 0 ? src : undefined

  const containerStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: backgroundColor ?? 'transparent',
    borderRadius: borderRadius !== undefined ? `${borderRadius}px` : undefined,
    border: borderWidth ? `${borderWidth}px solid ${borderColor ?? 'transparent'}` : undefined,
    opacity,
    boxShadow,
    padding,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }

  const ratio = parseAspectRatio(aspectRatio)
  if (ratio) {
    containerStyle.aspectRatio = ratio
  }

  if (!resolvedSrc) {
    return (
      <div style={containerStyle}>
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 10px, #e5e7eb 10px, #e5e7eb 20px)',
            borderRadius: 'inherit'
          }}
        />
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <img
        src={resolvedSrc}
        alt={alt ?? ''}
        style={{
          width: '100%',
          height: '100%',
          objectFit,
          display: 'block'
        }}
      />
    </div>
  )
}
