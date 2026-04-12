# Creating Section Variants - Pattern Guide

This guide explains the systematic approach used for HeaderGlass and how to apply it to create variants for other sections.

## Architecture Overview

Each section variant follows this pattern:

```
Section Type (e.g., "header")
├── Default Variant (e.g., "header-default")
│   ├── Preview Component (HeaderSectionPreview.tsx)
│   ├── Storefront Component (HeaderSection.tsx)
│   └── Default Props
│
└── Glass Variant (e.g., "header-glass")
    ├── Preview Component (HeaderGlassPreview.tsx)
    ├── Storefront Component (HeaderGlass.tsx)
    └── Glass-specific Props
```

## 5-Step Implementation Process

### Step 1: Create BrandStudio Preview Component

**File**: `brandstudio-vite/src/components/Editor/SectionPreviews/{SectionName}GlassPreview.tsx`

**Key Requirements**:
- Accept `Component` type prop
- Extract props from `component.props`
- Render canvas preview (NOT interactive)
- Apply glass morphism styling
- Use same dimensions as `component.size`
- Set `pointerEvents: 'none'` on container

**Template**:
```tsx
export function {SectionName}GlassPreview({ component }: { component: Component }) {
  const props = component.props || {}
  const size = component.size || { width: 1440, height: 600 }

  // Extract editable properties
  const property1 = props.property1 || defaultValue
  const glassBackground = props.glassBackground || 'rgba(255, 255, 255, 0.1)'
  const glassBackdropBlur = props.glassBackdropBlur || 10

  return (
    <section style={{
      width: size.width,
      height: size.height,
      background: backgroundGradient,
      position: 'relative',
      pointerEvents: 'none',
      overflow: 'hidden'
    }}>
      {/* Glass overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: glassBackground,
        backdropFilter: `blur(${glassBackdropBlur}px)`,
        border: `1px solid ${glassBorderColor}`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Your section content */}
      </div>
    </section>
  )
}
```

**Critical Details**:
- Use `component.size` for dimensions, never hardcode
- Glass background should always be first layer
- Content should be in a relative z-indexed div on top
- Extract all customizable values from `props`
- Handle undefined values with sensible defaults

---

### Step 2: Create Storefront Component

**File**: `components/storefront/{SectionName}Glass.tsx`

**Key Requirements**:
- Accept all props (glass + regular)
- Include full client-side functionality
- Add interactive features (modals, forms, etc.)
- Implement responsive design
- Use Next.js Image component
- Add framer-motion animations
- Server component compatible

**Template**:
```tsx
'use client'

import { motion } from "framer-motion"
import { useState, useEffect } from "react"

type {SectionName}GlassProps = {
  // Regular props
  property1?: string
  
  // Glass effect props
  glassBackground?: string
  glassBackdropBlur?: number
  glassBorderColor?: string
  glassBorderWidth?: number
  hasGlassGradientBg?: boolean
  backgroundGradient?: string
  textColor?: string
}

export function {SectionName}Glass({
  property1 = 'default',
  glassBackground = 'rgba(255, 255, 255, 0.1)',
  glassBackdropBlur = 10,
  glassBorderColor = 'rgba(255, 255, 255, 0.2)',
  glassBorderWidth = 1,
  hasGlassGradientBg = true,
  backgroundGradient = 'linear-gradient(...)',
  textColor = '#ffffff',
}: {SectionName}GlassProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section style={{
      background: hasGlassGradientBg ? backgroundGradient : '#000000',
      position: 'relative',
    }}>
      {/* Glass overlay */}
      <div className="absolute inset-0" style={{
        background: glassBackground,
        backdropFilter: `blur(${glassBackdropBlur}px)`,
        border: `${glassBorderWidth}px solid ${glassBorderColor}`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Content */}
      <div className="relative z-10">
        {mounted && (
          // Your content
        )}
      </div>
    </section>
  )
}
```

---

### Step 3: Update useComponentProps Hook

**File**: `brandstudio-vite/src/hooks/useComponentProps.ts`

**Add this block**:
```tsx
// {SECTION NAME IN CAPS} GLASS
if (type === '{section-glass}') {
  // Content-specific fields
  addField({
    key: 'property1',
    label: 'Property 1',
    type: 'text',
    value: props.property1 || '',
    section: 'Content'
  })

  // Layout fields
  addField({
    key: 'height',
    label: 'Section Height',
    type: 'number',
    value: props.height || 400,
    min: 200,
    max: 1000,
    step: 50,
    section: 'Layout'
  })

  // Style fields
  addField({
    key: 'textColor',
    label: 'Text Color',
    type: 'color',
    value: props.textColor || '#ffffff',
    section: 'Style'
  })

  // Glass effect fields (ALWAYS INCLUDE THESE)
  addField({
    key: 'backgroundGradient',
    label: 'Background Gradient',
    type: 'text',
    value: props.backgroundGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    placeholder: 'CSS gradient value',
    section: 'Glass Effect'
  })

  addField({
    key: 'hasGlassGradientBg',
    label: 'Use Gradient Background',
    type: 'toggle',
    value: props.hasGlassGradientBg !== false,
    section: 'Glass Effect'
  })

  addField({
    key: 'glassBackground',
    label: 'Glass Background Color',
    type: 'text',
    value: props.glassBackground || 'rgba(255, 255, 255, 0.1)',
    placeholder: 'RGBA color value',
    section: 'Glass Effect'
  })

  addField({
    key: 'glassBackdropBlur',
    label: 'Blur Intensity',
    type: 'number',
    value: props.glassBackdropBlur ?? 10,
    min: 0,
    max: 30,
    step: 1,
    section: 'Glass Effect'
  })

  addField({
    key: 'glassBorderColor',
    label: 'Border Color',
    type: 'text',
    value: props.glassBorderColor || 'rgba(255, 255, 255, 0.2)',
    placeholder: 'RGBA color value',
    section: 'Glass Effect'
  })

  addField({
    key: 'glassBorderWidth',
    label: 'Border Width',
    type: 'number',
    value: props.glassBorderWidth ?? 1,
    min: 0,
    max: 5,
    step: 0.5,
    section: 'Glass Effect'
  })
}
```

**Section Organization**:
- `Content`: Text, headings, descriptions
- `Layout`: Sizing, spacing, positioning
- `Style`: Colors, text styling
- `Glass Effect`: Glass morphism specific (ALWAYS GROUP TOGETHER)

---

### Step 4: Register in Component Library

**File**: `brandstudio-vite/src/utils/componentLibrary.ts`

**Add to appropriate category**:
```tsx
{
  id: '{section-glass}',
  name: '{Section Name} Glass',
  type: '{section-glass}',
  thumbnail: '/templates/{section}-glass-1.jpg',
  category: '{category}',
  description: 'Glass morphism variant with frosted glass effect',
  defaultProps: {
    // Your content defaults
    property1: 'value',
    
    // Glass effect defaults
    backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    hasGlassGradientBg: true,
    glassBackground: 'rgba(255, 255, 255, 0.1)',
    glassBackdropBlur: 10,
    glassBorderColor: 'rgba(255, 255, 255, 0.2)',
    glassBorderWidth: 1,
    textColor: '#ffffff',
    
    // Size
    size: { width: 1440, height: {appropriate height} }
  }
}
```

**Placement**: Add glass variant right after the default variant in its section

---

### Step 5: Update Canvas Renderer

**File**: `brandstudio-vite/src/components/Editor/CanvasComponent.tsx`

**Step 5a: Import**
```tsx
import { {SectionName}GlassPreview } from './SectionPreviews/{SectionName}GlassPreview'
```

**Step 5b: Add case statement** (in renderContent switch)
```tsx
case '{section-glass}': {
  const backgroundGradient = (component.props?.backgroundGradient as string) || 
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  
  return (
    <>
      <Rect
        width={size.width}
        height={size.height}
        fill={backgroundGradient}
        onClick={handleClick}
        onTap={handleClick}
      />
      <Html
        divProps={{
          style: {
            position: 'absolute',
            top: '0',
            left: '0',
            width: `${size.width}px`,
            height: `${size.height}px`,
            pointerEvents: 'none',
            overflow: 'visible',
            zIndex: component.zIndex ?? 0,
          }
        }}
      >
        <div style={{
          border: isSelected ? '2px solid #3b82f6' : 'none',
          boxSizing: 'border-box',
        }}>
          <{SectionName}GlassPreview component={component} />
        </div>
      </Html>
    </>
  )
}
```

**Key points**:
- Extract background gradient for the Rect fill
- Set proper dimensions on Html wrapper
- Apply selection border
- Render preview inside relative div

---

## Common Patterns by Section Type

### Hero Sections
```
Glass Effect + Full Height Background
├─ Heading (large)
├─ Subheading (medium)
├─ CTA Button (glass styled)
└─ Optional: Background image with overlay
```

### Product Sections
```
Glass Effect + Card Grid
├─ Title
├─ Product Cards (glass styled)
├─ Pricing visible
└─ Add to cart buttons
```

### CTA Sections
```
Glass Effect + Centered Content
├─ Heading
├─ Description
├─ Primary CTA button
└─ Optional: Secondary button
```

### Footer Sections
```
Glass Effect + Dark Background
├─ Company info
├─ Links columns
├─ Social icons
└─ Copyright
```

---

## Testing Checklist

For each new variant:

- [ ] Preview renders in BrandStudio canvas
- [ ] All props appear in right panel
- [ ] Glass effect controls update preview in real-time
- [ ] Default gradient displays correctly
- [ ] Mobile responsive works
- [ ] Storefront component renders
- [ ] Props pass through correctly
- [ ] Glass effect visible at different blur values
- [ ] Border customization works
- [ ] Gradient toggle switches background correctly
- [ ] Text color applies to all text elements
- [ ] No console errors

---

## Performance Tips

1. **Glass Blur**: Keep default at 10-12px for performance
2. **RGBA Colors**: Use alpha < 0.15 for better visibility
3. **Gradient**: Use 2-3 color stops max
4. **No Animations**: Glass effect alone is CPU-friendly
5. **Mobile**: Consider reducing blur on mobile devices

---

## Naming Conventions

```
Component Type:     {section-name} (lowercase with hyphens)
Preview Component:  {SectionName}GlassPreview (PascalCase)
Storefront Component: {SectionName}Glass (PascalCase)
Library ID:         {section-glass} (lowercase with hyphens)
Props Type:         {SectionName}GlassProps (PascalCase)
Function:           function {SectionName}Glass(...) (PascalCase)
```

---

## Common Issues & Solutions

**Glass effect not visible?**
- Check `glassBackground` opacity (should be > 0.08)
- Verify backdrop filter supported (most modern browsers)
- Ensure z-index layering is correct

**Props not updating?**
- Check field key matches component prop
- Verify section name matches type condition
- Ensure value extraction handles both object and string formats

**Preview looks different than storefront?**
- Check className differences (Tailwind vs inline)
- Verify size calculations match
- Ensure mobile breakpoints consistent

**Performance issues?**
- Reduce blur value (max 15px recommended)
- Limit gradient color stops
- Check for unnecessary re-renders
- Profile with browser DevTools
