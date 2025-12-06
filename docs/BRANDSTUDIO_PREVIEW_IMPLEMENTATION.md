// HOW SECTION PREVIEWS WORK IN BRANDSTUDIO
// =========================================

// The key insight: Use Konva's <Html> component to embed React components
// This gives us the best of both worlds:
// - Konva handles selection, dragging, resizing (canvas-like editing)
// - React handles display and styling (real appearance)

import { Group, Rect } from 'react-konva'
import { Html } from 'react-konva-utils'
import { useUIStore } from '../../store/useUIStore'
import { HeaderSectionPreview } from './SectionPreviews/HeaderSectionPreview'
import type { Component } from '../../types/component'

// BEFORE: Simple placeholder rendering
function OldHeaderRendering(props: { size: { width: number; height: number }; props: Record<string, unknown> }) {
  return (
    <>
      <Rect
        width={props.size.width}
        height={props.size.height}
        fill={props.props.backgroundColor as string || '#ffffff'}
      />
      <Text text="Header Placeholder" fontSize={16} x={20} y={30} />
    </>
  )
}

// AFTER: Full React component preview
function NewHeaderRendering(props: { component: Component; size: { width: number; height: number } }) {
  return (
    <>
      {/* Transparent rect for clicking/selecting in canvas */}
      <Rect
        width={props.size.width}
        height={props.size.height}
        fill="transparent"
        onClick={() => {
          // Selection handled by CanvasComponent
        }}
      />

      {/* Use Html wrapper to embed React component */}
      <Html
        divProps={{
          style: {
            position: 'absolute',
            top: '0',
            left: '0',
            width: `${props.size.width}px`,
            height: `${props.size.height}px`,
            // Don't let React steal mouse events - Konva handles those
            pointerEvents: 'none',
            // Keep content within bounds
            overflow: 'hidden',
          }
        }}
      >
        {/* Scale wrapper to handle zoom */}
        <div
          style={{
            width: '100%',
            height: '100%',
            // This is key - scale based on canvas zoom
            transform: `scale(${useUIStore.getState().zoom})`,
            transformOrigin: 'top left',
          }}
        >
          {/* The actual React component that renders like the storefront */}
          <HeaderSectionPreview component={props.component} />
        </div>
      </Html>
    </>
  )
}

// ARCHITECTURE COMPARISON
// =======================

/*
BEFORE (Plain Konva):
┌─ Canvas (Konva) ────────────────┐
│ ┌─ Header (Rect + Text) ────┐   │
│ │ "Your Brand  🛒 Menu"      │   │  Hard to modify
│ │ (Very simple placeholder)  │   │  Doesn't match storefront
│ └────────────────────────────┘   │  High maintenance
│ ┌─ Hero (Multiple Rect+Text) ──┐ │
│ │ (Lots of positioning logic)   │ │
│ └───────────────────────────────┘ │
└─────────────────────────────────┘

AFTER (Konva + React Overlay):
┌─ Canvas (Konva) ──────────────────────┐
│ ┌─ Invisible Rect (selection layer) ─┐│
│ │                                     ││
│ ├─ Html Wrapper (React) ────────────┐││
│ │ ┌─ Scale Container ──────────────┐│││
│ │ │ ┌─ HeaderSectionPreview ─────┐ │││  Easy to maintain
│ │ │ │  (Real header layout)       │ │││  Matches storefront exactly
│ │ │ │  (Navigation, mobile menu)  │ │││  Animations work
│ │ │ │  (Responsive design)        │ │││
│ │ │ └─────────────────────────────┘ │││
│ │ └────────────────────────────────┘ ││
│ └──────────────────────────────────── ┘│
└─────────────────────────────────────────┘
*/

// KEY IMPLEMENTATION DETAILS
// ==========================

interface SectionPreviewProps {
  component: Component
}

// Pattern used for ALL section previews:
export function SectionPreview({ component }: SectionPreviewProps) {
  // Extract props from the component being edited
  const props = component.props || {}
  const size = component.size || { width: 1440, height: 600 }

  // Extract values with defaults
  const title = (props.title as string) || 'Section Title'
  const backgroundColor = (props.backgroundColor as string) || '#ffffff'
  const textColor = (props.textColor as string) || '#000000'

  // Render using standard React/HTML/Tailwind
  // This is exactly what appears in the storefront!
  return (
    <section
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        backgroundColor,
        color: textColor,
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <h2>{title}</h2>
      {/* Rest of your JSX */}
    </section>
  )
}

// THE MAGIC FORMULA
// =================

// In CanvasComponent.renderComponentContent():
function RenderSectionExample(component: Component) {
  return (
    <>
      {/* Layer 1: Invisible rect for Konva to handle clicks/drags/resizes */}
      <Rect
        width={component.size.width}
        height={component.size.height}
        fill="transparent"
        onClick={/* selection handler */}
        onDragEnd={/* position update */}
        /* etc */
      />

      {/* Layer 2: Html wrapper embedding React */}
      <Html
        divProps={{
          style: {
            // These exact styles are critical:
            position: 'absolute',
            top: '0',
            left: '0',
            width: `${component.size.width}px`,
            height: `${component.size.height}px`,
            pointerEvents: 'none', // Let Konva handle clicks
            overflow: 'hidden', // Clip content
          }
        }}
      >
        {/* Layer 3: Scale container for zoom */}
        <div
          style={{
            width: '100%',
            height: '100%',
            transform: `scale(${useUIStore.getState().zoom})`,
            transformOrigin: 'top left',
          }}
        >
          {/* Layer 4: The actual preview component */}
          <SectionPreview component={component} />
        </div>
      </Html>
    </>
  )
}

// BENEFITS OF THIS APPROACH
// ==========================

/*
✅ Single Source of Truth
   - Section components exist only in storefront
   - BrandStudio renders them via import, not duplicate code

✅ Perfect Fidelity
   - What you edit in BrandStudio = what users see
   - Styling, layout, animations all match

✅ Easier Maintenance
   - Edit storefront component = automatically updated in BrandStudio
   - No need to maintain two rendering implementations

✅ Real Interactions
   - Mobile menu actually toggles
   - Animations play
   - Responsive design visible

✅ Performance
   - React components only re-render when props change
   - Konva handles interaction (selection, dragging, etc)
   - No conflict between React and Canvas rendering

✅ Scalability
   - Same pattern works for any section type
   - Easy to add previews for ProductGrid, CTA, Newsletter, etc.
*/

// EXTENDING THE PATTERN
// =====================

// To add a preview for any new section:

// 1. Create preview component:
export function NewSectionPreview({ component }: SectionPreviewProps) {
  // Copy the section component from storefront
  // Remove interactive features (auth, API calls)
  // Keep layout and styling
  return <div>{/* JSX */}</div>
}

// 2. Import in CanvasComponent:
// import { NewSectionPreview } from './SectionPreviews/NewSectionPreview'

// 3. Add case statement:
// case 'new-section':
//   return (
//     <>
//       <Rect width={size.width} height={size.height} fill="transparent" />
//       <Html>
//         <div style={{ transform: `scale(${useUIStore.getState().zoom})` }}>
//           <NewSectionPreview component={component} />
//         </div>
//       </Html>
//     </>
//   )

// That's it! Repeat for all 20+ section types.
