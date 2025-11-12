import type { CSSProperties, ReactNode } from 'react'
import { componentMap, hasComponent } from './index'
import type { StorefrontContext } from './types'

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
  const visibleComponents = components
    .filter(component => !component.hidden)
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

        const positionStyle: CSSProperties = {
          position: 'absolute',
          left: absoluteX,
          top: absoluteY,
          width: size?.width ?? 'auto',
          height: size?.height ?? 'auto',
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

        result.push(
          <div key={id} style={positionStyle}>
            <Component {...componentProps} storefront={storefront} />
          </div>
        )

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

  return (
    <div className="relative w-full min-h-screen bg-white">
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
