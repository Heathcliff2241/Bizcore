import type { CSSProperties } from 'react'

interface CircleShapeProps {
  fill?: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
  boxShadow?: string
}

export function CircleShape({
  fill = '#34d399',
  stroke,
  strokeWidth = 0,
  opacity = 1,
  boxShadow
}: CircleShapeProps) {
  const style: CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: fill,
    borderRadius: '50%',
    opacity,
    boxShadow,
    border: strokeWidth > 0 ? `${strokeWidth}px solid ${stroke ?? 'transparent'}` : stroke ? `1px solid ${stroke}` : undefined
  }

  return <div style={style} />
}
