# Glass Variants Implementation Guide

Complete step-by-step guide for creating glass morphism variant components (like `header-glass`, `footer-glass`) in BizCore.

## Overview

Glass variants are alternative visual designs for existing section components that add a glass morphism effect. Each glass variant requires implementation across 4 main areas:

1. **Canvas Preview Component** - BrandStudio design tool preview
2. **Canvas Interaction** - Resize handles, action buttons, height indicator
3. **Storefront Component** - Production-ready rendered component
4. **Component Registration** - Registration in component maps and exports

---

## Architecture & Key Files

### File Structure for a Glass Variant (e.g., header-glass)

```
BrandStudio (Design Tool):
├── src/components/Editor/SectionPreviews/HeaderGlassPreview.tsx
├── src/components/Editor/CanvasComponent.tsx (case statement)
├── src/store/useComponentProps.ts (control panel config)
└── src/utils/componentLibrary.ts (registration & defaults)

Main App (Storefront):
├── components/storefront/HeaderGlass.tsx (production component)
└── components/storefront/index.ts (registration & export)
```

---

## Step-by-Step Implementation

### STEP 1: Create the Canvas Preview Component

**File**: `brandstudio-vite/src/components/Editor/SectionPreviews/HeaderGlassPreview.tsx`

This component renders the glass variant on the canvas during design. Key aspects:

- **React.FC Pattern**: Use `React.FC<ComponentProps>` for proper typing
- **Props**: Accepts `component: Component` from CanvasComponent
- **Props Extraction**: Extract glass properties from `component.props`:
  ```tsx
  const glassBlurAmount = props.glassBlurAmount as number || 10
  const glassOpacity = props.glassOpacity as number ?? 0.1
  const glassBorderColor = props.glassBorderColor as string || 'rgba(255, 255, 255, 0.2)'
  const backgroundColor = props.backgroundColor as string || 'linear-gradient(...)'
  ```

#### Glass Morphism CSS Pattern

```tsx
// Glass overlay layer (absolute positioning)
<div
  style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `rgba(255, 255, 255, ${glassOpacity})`,
    backdropFilter: `blur(${glassBlurAmount}px)`,
    border: `1px solid ${glassBorderColor}`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    zIndex: 0,
    pointerEvents: 'none'
  }}
/>

// Content wrapper (relative z-index > 0)
<div
  style={{
    position: 'relative',
    zIndex: 1,
    // ... content here
  }}
/>
```

#### Key Implementation Details

1. **Import React.FC**: `import React from 'react'`
2. **Define Props Interface**:
   ```tsx
   interface HeaderGlassPreviewProps {
     component: Component
   }
   ```

3. **Export as Arrow Function**:
   ```tsx
   export const HeaderGlassPreview: React.FC<HeaderGlassPreviewProps> = ({ component }) => {
     // implementation
   }
   ```

4. **Handle Responsive Design**:
   - Use `clamp()` for padding
   - Use mobile breakpoints (Tailwind's `md:` prefix)
   - Extract height from `component.size?.height || defaultHeight`

5. **Support Dynamic Props**:
   - Glass effect properties (opacity, blur, border)
   - Background color/gradient
   - Content properties (text, links, buttons)
   - Responsive sizing

---

### STEP 2: Configure Control Panel Properties

**File**: `brandstudio-vite/src/store/useComponentProps.ts`

Add a new case for your glass variant in the component props switch statement:

```tsx
case 'header-glass': {
  return {
    sections: [
      {
        name: 'Logo',
        fields: [
          { name: 'logoImage', label: 'Logo Image', type: 'text' },
          { name: 'logoText', label: 'Logo Text', type: 'text' },
        ]
      },
      {
        name: 'Layout',
        fields: [
          { name: 'showCart', label: 'Show Cart', type: 'toggle' },
          { name: 'height', label: 'Height', type: 'number', min: 50, max: 150, step: 1 },
          { name: 'sticky', label: 'Sticky', type: 'toggle' },
        ]
      },
      {
        name: 'Style',
        fields: [
          { name: 'textColor', label: 'Text Color', type: 'color' },
        ]
      },
      {
        name: 'Background',
        fields: [
          { name: 'backgroundColor', label: 'Background', type: 'color' },
        ]
      },
      {
        name: 'Glass Effect',
        fields: [
          { name: 'glassOpacity', label: 'Opacity', type: 'number', min: 0, max: 1, step: 0.05 },
          { name: 'glassBlurAmount', label: 'Blur Amount', type: 'number', min: 0, max: 30, step: 1 },
          { name: 'glassBorderColor', label: 'Border Color', type: 'text' },
        ]
      },
    ]
  }
}
```

#### Field Type Reference

| Type | Use Case | Example |
|------|----------|---------|
| `text` | Text input (deprecated for colors) | `logoText`, `glassBorderColor` |
| `color` | Color picker (no-code) | `backgroundColor`, `textColor` |
| `number` | Numeric input | `height`, `glassOpacity`, `glassBlurAmount` |
| `toggle` | Boolean switch | `showCart`, `sticky` |
| `select` | Dropdown options | Component variants |

**Best Practice**: Use `color` type for background/border/text colors instead of text input for better UX.

---

### STEP 3: Register in Component Library

**File**: `brandstudio-vite/src/utils/componentLibrary.ts`

Add your glass variant to the component library with default props:

```tsx
{
  id: 'header-glass',
  name: 'Header - Glass',
  category: 'navigation',
  type: 'header-glass',
  description: 'Header with glass morphism effect',
  defaultProps: {
    logoText: 'Your Brand',
    logoImage: undefined,
    navigationLinks: [
      { label: 'Home', url: '/' },
      { label: 'Shop', url: '/shop' },
      { label: 'About', url: '/about' },
      { label: 'Contact', url: '/contact' }
    ],
    showCart: true,
    textColor: '#ffffff',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    glassOpacity: 0.1,
    glassBlurAmount: 10,
    glassBorderColor: 'rgba(255, 255, 255, 0.2)',
    sticky: false,
  },
  size: {
    width: 1440,
    height: 80
  }
}
```

#### Guidelines for Default Props

- **Glass Opacity**: 0.1 (subtle) - adjust per variant
- **Glass Blur**: 10px (readable) - range typically 5-20px
- **Glass Border**: `rgba(255, 255, 255, 0.2)` (light border on glass)
- **Background**: Full-height gradient or solid color
- **Height**: Matches default component size

---

### STEP 4: Add Canvas Rendering & Interaction

**File**: `brandstudio-vite/src/components/Editor/CanvasComponent.tsx`

Add a new case statement in the `renderComponentContent` switch for your variant. This is the most complex step.

#### 4a. Basic Structure

```tsx
case 'header-glass': {
  const backgroundColor = (component.props?.backgroundColor as string) 
    || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  
  return (
    <>
      {/* Background Rect */}
      <Rect
        width={size.width}
        height={size.height}
        fill={backgroundColor}
        onClick={handleClick}
        onTap={handleClick}
      />
      
      {/* HTML wrapper for interactive elements */}
      <Html
        divProps={{
          style: {
            position: 'absolute',
            top: '0',
            left: '0',
            width: `${size.width}px`,
            height: isSelected ? `${(isResizing ? tempHeight : size.height) + 80}px` : `${isResizing ? tempHeight : size.height}px`,
            pointerEvents: 'none',
            overflow: 'visible',
            zIndex: component.zIndex ?? 0,
          }
        }}
      >
        {/* Content goes here */}
      </Html>
    </>
  )
}
```

#### 4b. Add Action Buttons

Inside the Html wrapper, add action buttons (only when selected):

```tsx
{isSelected && (
  <ComponentActionButtons 
    component={component} 
    isTopSection={isTopSection} 
    isBottomSection={isBottomSection} 
    onMoveUp={moveComponentUp} 
    onMoveDown={moveComponentDown} 
    onDuplicate={duplicateComponent} 
    onDelete={deleteComponent} 
  />
)}
```

This renders a button toolbar above the component with:
- **Duplicate** - Clone the entire component
- **Move Up** (↑) - Move component up in z-index/DOM order
- **Move Down** (↓) - Move component down in z-index/DOM order
- **Delete** (×) - Remove component from page

#### 4c. Add Resize Handles

**Top Resize Handle** (positioned above the component):

```tsx
{isSelected && (
  <div
    style={{
      position: 'absolute',
      top: '-12px',
      left: '0',
      width: '100%',
      height: '24px',
      cursor: 'ns-resize',
      zIndex: 9999,
      pointerEvents: 'auto',
      backgroundColor: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.15s ease-out',
    }}
    onMouseDown={handleHtmlTopMouseDown}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)'
      const bar = e.currentTarget.querySelector('[data-handle-bar]') as HTMLElement
      if (bar) {
        bar.style.opacity = '1'
        bar.style.height = '3px'
      }
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent'
      const bar = e.currentTarget.querySelector('[data-handle-bar]') as HTMLElement
      if (bar) {
        bar.style.opacity = '0.4'
        bar.style.height = '2px'
      }
    }}
  >
    <div
      data-handle-bar
      style={{
        width: '32px',
        height: '2px',
        backgroundColor: '#3b82f6',
        borderRadius: '1px',
        opacity: 0.4,
        transition: 'all 0.15s ease-out',
      }}
    />
  </div>
)}
```

**Bottom Resize Handle** (positioned below the component):

```tsx
{isSelected && (
  <div
    style={{
      position: 'absolute',
      top: `${isResizing ? tempHeight : size.height}px`,
      left: '0',
      width: '100%',
      height: '24px',
      cursor: 'ns-resize',
      zIndex: 9999,
      pointerEvents: 'auto',
      backgroundColor: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.15s ease-out',
    }}
    onMouseDown={handleHtmlBottomMouseDown}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)'
      const bar = e.currentTarget.querySelector('[data-handle-bar]') as HTMLElement
      if (bar) {
        bar.style.opacity = '1'
        bar.style.height = '3px'
      }
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent'
      const bar = e.currentTarget.querySelector('[data-handle-bar]') as HTMLElement
      if (bar) {
        bar.style.opacity = '0.4'
        bar.style.height = '2px'
      }
    }}
  >
    <div
      data-handle-bar
      style={{
        width: '32px',
        height: '2px',
        backgroundColor: '#3b82f6',
        borderRadius: '1px',
        opacity: 0.4,
        transition: 'all 0.15s ease-out',
      }}
    />
  </div>
)}
```

#### 4d. Add Height Indicator

Displays current height during resize, positioned to the right:

```tsx
{isSelected && (
  <div
    style={{
      position: 'absolute',
      right: '-90px',
      top: '50%',
      transform: 'translateY(-50%)',
      backgroundColor: '#f3f4f6',
      color: '#1f2937',
      padding: '6px 10px',
      borderRadius: '8px',
      fontSize: '11px',
      fontWeight: '500',
      whiteSpace: 'nowrap',
      zIndex: 9999,
      pointerEvents: 'none',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(0, 0, 0, 0.06)',
    }}
  >
    {Math.round(isResizing ? tempHeight : size.height)}px
  </div>
)}
```

#### 4e. Add Preview Content

Wrap the preview component to handle selection border and opacity:

```tsx
<div
  style={{
    position: 'relative',
    width: '100%',
    height: `${isResizing ? tempHeight : size.height}px`,
    opacity: 1,
    pointerEvents: 'none',
  }}
>
  <div
    style={{
      border: isSelected ? '2px solid #3b82f6' : 'none',
      boxSizing: 'border-box',
    }}
  >
    <HeaderGlassPreview component={component} />
  </div>
</div>
```

#### Complete Case Example

See `CanvasComponent.tsx` lines 1209-1335 for the full `header-glass` implementation.

---

### STEP 5: Create Storefront Production Component

**File**: `components/storefront/HeaderGlass.tsx`

This is the production-ready component that renders on actual storefront pages. Key differences from preview:

1. **Uses Real Data**: Integrates with hooks (useCustomerSession, useCart, etc.)
2. **Full Functionality**: Auth modals, cart management, etc.
3. **Client-Side**: Marked with `'use client'`
4. **Props Interface**: Accepts individual props, not a Component object

#### Basic Structure

```tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

interface HeaderGlassProps {
  logoText?: string
  logoImage?: string
  textColor?: string
  backgroundColor?: string
  glassOpacity?: number
  glassBlurAmount?: number
  glassBorderColor?: string
  showCart?: boolean
  sticky?: boolean
  [key: string]: unknown
}

export function HeaderGlass({
  logoText = 'Your Brand',
  logoImage,
  textColor = '#ffffff',
  backgroundColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  glassOpacity = 0.1,
  glassBlurAmount = 10,
  glassBorderColor = 'rgba(255, 255, 255, 0.2)',
  showCart = true,
  sticky = false,
}: HeaderGlassProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header
      style={{
        position: sticky ? 'sticky' : 'relative',
        top: sticky ? 0 : undefined,
        background: backgroundColor,
        zIndex: sticky ? 100 : 'auto',
      }}
    >
      {/* Glass overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `rgba(255, 255, 255, ${glassOpacity})`,
          backdropFilter: `blur(${glassBlurAmount}px)`,
          border: `1px solid ${glassBorderColor}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header content here */}
      </div>
    </header>
  )
}
```

#### Implementation Checklist

- ✅ Glass morphism CSS (overlay layer + content layer)
- ✅ Responsive design
- ✅ Sticky positioning support
- ✅ Dark mode compatibility (if applicable)
- ✅ Mobile menu support
- ✅ All customizable props supported
- ✅ Proper TypeScript interfaces
- ✅ 'use client' directive for interactivity

---

### STEP 6: Register in Component Maps

#### 6a. Main Storefront Index

**File**: `components/storefront/index.ts`

```tsx
// Add import
import { HeaderGlass } from './HeaderGlass'

// Add to componentMap
export const componentMap: Record<string, React.ComponentType<any>> = {
  // ...
  // Header
  'header': HeaderSection,
  'header-default': HeaderSection,
  'header-glass': HeaderGlass,  // ← Add here
  // ...
}

// Add to exports
export {
  HeaderSection,
  HeaderGlass,  // ← Add here
  // ...
}
```

#### 6b. Register in PageRenderer Section Types

**File**: `components/storefront/PageRenderer.tsx`

This is **critical** - PageRenderer needs to know your component is a full-width section:

```tsx
// Determine if a component is a section (full-width block) or a freeform element
const isSectionType = (type: string): boolean => {
  const sectionTypes = [
    'header', 'header-default', 'header-glass',  // ← Add your variant here
    'hero', 'hero-default', 'hero-split', 'hero-minimal',
    'product-grid', 'product-carousel', 'product-featured',
    'cta', 'cta-banner', 'cta-split', 'newsletter',
    'footer', 'footer-minimal', 'footer-detailed', 'footer-glass',  // ← And here
    'testimonials', 'testimonials-grid', 'testimonials-carousel', 'trust-badges',
    'login-form', 'signup-form',
    'divider', 'spacer', 'block', 'blank'
  ]
  return sectionTypes.includes(type)
}
```

**Why this matters**: Without this registration, the component won't be treated as a full-width section. Instead, it will be positioned absolutely and won't span the full width of the page.

#### 6c. BrandStudio Components Index

**File**: `brandstudio-vite/src/components/storefront/index.ts`

Similar structure - register the storefront component for preview purposes.

---

## Visual Reference: Glass Morphism Effect

### CSS Layering

```
Layer 1 (Bottom):    Background color/gradient
Layer 2 (Overlay):   Glass effect
  └─ background: rgba(255, 255, 255, opacity)
  └─ backdropFilter: blur(Xpx)
  └─ border: 1px solid rgba(255, 255, 255, Y)
  └─ boxShadow: depth effect
Layer 3 (Top):       Content (text, images, buttons)
```

### Visual Hierarchy

```
Header Height: 80px
├── Glass Overlay (full height)
│   ├── Opacity: 10% white
│   ├── Blur: 10px
│   └── Border: 1px white 20% opacity
└── Content Layer
    ├── Logo (left)
    ├── Nav Links (center)
    └── Cart + Menu (right)
```

---

## Common Patterns & Best Practices

### 1. Glass Properties Convention

Always use consistent naming and ranges:

```tsx
glassOpacity: number (0-1, step 0.05)        // White overlay opacity
glassBlurAmount: number (0-30, step 1)       // Backdrop filter blur
glassBorderColor: string (rgba format)       // Glass edge definition
```

### 2. Props Extraction Pattern

```tsx
const propertyName = props.propertyName as ExpectedType || defaultValue
```

Use nullish coalescing (`??`) for boolean-like numbers:
```tsx
const glassOpacity = props.glassOpacity as number ?? 0.1
```

Use OR operator (`||`) for strings:
```tsx
const textColor = props.textColor as string || '#ffffff'
```

### 3. Component Props in Canvas vs Storefront

**Canvas (Preview)**:
```tsx
// Receives full Component object
function HeaderGlassPreview({ component }: { component: Component })
```

**Storefront (Production)**:
```tsx
// Receives flattened props
function HeaderGlass({ logoText, backgroundColor, ... }: HeaderGlassProps)
```

### 4. Responsive Design

Use Tailwind breakpoints:
```tsx
className="hidden md:flex"  // Hidden on mobile, visible on desktop
className="md:hidden"        // Visible on mobile, hidden on desktop
```

### 5. Selection Styling

When selected in canvas, components show:
- Blue border: `border: 2px solid #3b82f6`
- Opacity reduction: `opacity: 0.5` (allows seeing what's behind)
- Resize handles (top/bottom)
- Height indicator (right)

---

## Troubleshooting

### Issue: Component Not Rendering

**Solution**: Check if registered in componentMap:
```tsx
// ✅ Correct - shows in storefront
'header-glass': HeaderGlass,

// ❌ Missing - shows "Unknown component"
```

### Issue: Props Not Updating in Canvas

**Solution**: Check useComponentProps case statement for your variant type.

### Issue: Glass Effect Not Visible

**Solution**: Verify:
1. `backdropFilter: blur(Xpx)` syntax is correct
2. Content layer has `position: relative; zIndex: 1`
3. Glass overlay has `position: absolute; zIndex: 0`
4. Parent container has `overflow: visible`

### Issue: Resize Handles Not Working

**Solution**: Ensure handlers use correct state:
- `handleHtmlTopMouseDown` for top handle
- `handleHtmlBottomMouseDown` for bottom handle
- `isResizing` state tracks active resize
- `tempHeight` stores interim value

### Issue: Component Not Full-Width on Storefront

**Solution**: Add your variant to `PageRenderer.tsx` isSectionType array. Without this, the component will be positioned absolutely instead of as a full-width section.

```tsx
// In components/storefront/PageRenderer.tsx
const isSectionType = (type: string): boolean => {
  const sectionTypes = [
    // ... existing types ...
    'header-glass',  // ← Add your variant here
  ]
  return sectionTypes.includes(type)
}
```

This is **critical** - forgetting this is the #1 cause of glass variants not displaying correctly on storefronts.

---

## Testing Checklist

Before considering a variant complete:

- [ ] Canvas preview renders correctly
- [ ] All control panel fields work (colors, numbers, toggles)
- [ ] Resize handles function smoothly
- [ ] Action buttons appear when selected
- [ ] Height indicator shows during resize
- [ ] Component renders on storefront page
- [ ] All props map correctly from design to storefront
- [ ] Glass effect is visible and looks intentional
- [ ] Mobile responsive behavior works
- [ ] No console errors or TypeScript warnings

---

## Quick Reference: Files to Modify

For a new glass variant (e.g., `hero-glass`):

| File | Action | Lines Approx | Critical? |
|------|--------|-------------|-----------|
| `brandstudio-vite/src/components/Editor/SectionPreviews/HeroGlassPreview.tsx` | CREATE | 200-250 | No |
| `brandstudio-vite/src/components/Editor/CanvasComponent.tsx` | ADD CASE | ~100 | Yes |
| `brandstudio-vite/src/store/useComponentProps.ts` | ADD CASE | ~50 | Yes |
| `brandstudio-vite/src/utils/componentLibrary.ts` | REGISTER | ~20 | Yes |
| `components/storefront/HeroGlass.tsx` | CREATE | 150-200 | Yes |
| `components/storefront/index.ts` | REGISTER | ~5 | **CRITICAL** |
| `components/storefront/PageRenderer.tsx` | ADD TYPE | ~2 | **CRITICAL** |
| `brandstudio-vite/src/components/storefront/index.ts` | REGISTER | ~5 | No |

---

## Next Steps: Creating Hero-Glass Variant

Following this guide, the next glass variant (e.g., `hero-glass`) would:

1. Copy HeroSectionPreview structure
2. Add glass overlay div with blur, opacity, border
3. Add 100-line case statement to CanvasComponent
4. Create useComponentProps case for hero-glass
5. Register in componentLibrary with hero-appropriate defaults
6. Create HeroGlass.tsx in storefront
7. Register in both component maps

Estimated time: 2-3 hours for experienced implementation.

---

## Summary

Glass variants follow a consistent 5-step pattern across the design tool and storefront:

1. **Preview** - How it looks in the canvas (interactive)
2. **Interaction** - How users manipulate it (resize, move, duplicate)
3. **Configuration** - What users can customize (control panel)
4. **Defaults** - Sensible starting values (component library)
5. **Production** - How it renders for customers (storefront)

Each step builds on the previous, with clear separation between design-time (BrandStudio) and runtime (storefront).
