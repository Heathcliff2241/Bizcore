import type { CSSProperties } from 'react'

interface RectangleShapeProps {
  fill?: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
  borderRadius?: number
  boxShadow?: string
}

export function RectangleShape({
  fill = '#94a3b8',
  stroke,
  strokeWidth = 0,
  opacity = 1,
  borderRadius,
  boxShadow
}: RectangleShapeProps) {
  const style: CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: fill,
    borderRadius: borderRadius !== undefined ? `${borderRadius}px` : undefined,
    opacity,
    boxShadow,
    border: strokeWidth > 0 ? `${strokeWidth}px solid ${stroke ?? 'transparent'}` : stroke ? `1px solid ${stroke}` : undefined
  }

  return <div style={style} />
}
