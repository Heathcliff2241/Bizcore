import type { CSSProperties } from 'react'

interface LineShapeProps {
  stroke?: string
  strokeWidth?: number
  opacity?: number
  dash?: boolean
  orientation?: 'horizontal' | 'vertical'
  size?: {
    width?: number
    height?: number
  }
  boxShadow?: string
}

export function LineShape({
  stroke = '#1f2937',
  strokeWidth = 2,
  opacity = 1,
  dash,
  orientation,
  size,
  boxShadow
}: LineShapeProps) {
  const width = size?.width ?? 0
  const height = size?.height ?? 0
  const isVertical = orientation
    ? orientation === 'vertical'
    : height > width

  const baseStyle: CSSProperties = {
    opacity,
    boxShadow
  }

  if (isVertical) {
    baseStyle.width = 0
    baseStyle.height = '100%'
    baseStyle.borderLeftWidth = strokeWidth
    baseStyle.borderLeftStyle = dash ? 'dashed' : 'solid'
    baseStyle.borderLeftColor = stroke
  } else {
    baseStyle.height = 0
    baseStyle.width = '100%'
    baseStyle.borderTopWidth = strokeWidth
    baseStyle.borderTopStyle = dash ? 'dashed' : 'solid'
    baseStyle.borderTopColor = stroke
  }

  return <div style={baseStyle} />
}
