# Section Preview Components - Developer Guide

**Quick Reference for Using Shared Components**

---

## 📦 Import Statement
```tsx
import {
  PreviewContainer,
  PreviewHeading,
  PreviewButton,
  PreviewCard,
  PREVIEW_COLORS,
  PREVIEW_SPACING,
  PREVIEW_TYPOGRAPHY,
  PREVIEW_SHADOWS,
  PREVIEW_ANIMATIONS,
  ANIMATION_PRESETS,
  lightenColor,
  darkenColor,
  createGradient,
  // ... other utilities
} from '../shared'
```

---

## 🧩 Component API Reference

### PreviewContainer
Flexible wrapper component for section layout

**Props:**
```tsx
interface PreviewContainerProps {
  children: React.ReactNode
  width?: number | string              // Default: '100%'
  height?: number | string              // Default: '100%'
  padding?: 'xs'|'sm'|'md'|'lg'|'xl'|'2xl'|'3xl'|'4xl' | string
  backgroundColor?: string
  backgroundImage?: string
  backgroundPosition?: string           // Default: 'center'
  backgroundSize?: string               // Default: 'cover'
  backgroundRepeat?: string             // Default: 'no-repeat'
  overlay?: { color: string; opacity: number }
  flex?: boolean                        // Default: false
  flexDirection?: 'row' | 'column'      // Default: 'column'
  justifyContent?: CSSProperty
  alignItems?: CSSProperty
  gap?: 'xs'|'sm'|'md'|'lg'|'xl'|'2xl'|'3xl'|'4xl' | string
  borderRadius?: string
  border?: string
  pointerEvents?: 'none' | 'auto'       // Default: 'none'
  overflow?: CSSProperty                // Default: 'hidden'
  position?: CSSProperty
  zIndex?: number
  style?: CSSProperties
}
```

**Example:**
```tsx
<PreviewContainer
  width={1440}
  height={600}
  backgroundColor="#f9fafb"
  flex
  justifyContent="center"
  alignItems="center"
  padding="xl"
  gap="lg"
>
  {/* content */}
</PreviewContainer>
```

---

### PreviewHeading
Consistent heading typography

**Props:**
```tsx
interface PreviewHeadingProps {
  level?: 'h1' | 'h2' | 'h3' | 'h4'    // Default: 'h2'
  children: React.ReactNode
  color?: string                       // Default: PREVIEW_COLORS.text.primary
  fontSize?: number | string
  fontWeight?: number | string
  lineHeight?: number | string
  textAlign?: 'left' | 'center' | 'right' // Default: 'left'
  margin?: string
  marginBottom?: string                // Default: '16px'
  style?: CSSProperties
}
```

**Example:**
```tsx
<PreviewHeading
  level="h1"
  color="#ffffff"
  fontSize={48}
  textAlign="center"
  marginBottom="24px"
>
  Welcome to Our Store
</PreviewHeading>
```

---

### PreviewButton
Interactive button with variants

**Props:**
```tsx
interface PreviewButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'danger'
  size?: 'sm' | 'md' | 'lg'            // Default: 'md'
  disabled?: boolean                   // Default: false
  fullWidth?: boolean                  // Default: false
  borderRadius?: string
  onClick?: () => void
  style?: CSSProperties
}
```

**Example:**
```tsx
<PreviewButton variant="primary" size="lg" fullWidth>
  Get Started
</PreviewButton>
```

**Size Specs:**
- `sm`: 6px 12px padding, 12px font
- `md`: 10px 20px padding, 14px font
- `lg`: 14px 28px padding, 16px font

---

### PreviewCard
Reusable card component

**Props:**
```tsx
interface PreviewCardProps {
  children: React.ReactNode
  variant?: 'elevated' | 'outlined' | 'ghost' // Default: 'elevated'
  padding?: 'xs'|'sm'|'md'|'lg'|'xl'|'2xl'|'3xl'|'4xl' | string
  interactive?: boolean                // Default: true
  hoverEffect?: boolean                // Default: true
  style?: CSSProperties
}
```

**Example:**
```tsx
<PreviewCard variant="elevated" interactive padding="xl">
  <PreviewHeading level="h3">Card Title</PreviewHeading>
  <p>Card content goes here</p>
</PreviewCard>
```

**Variants:**
- `elevated`: White bg with shadow
- `outlined`: White bg with border
- `ghost`: Transparent with no border

---

## 🎨 Design Tokens

### Colors
```tsx
PREVIEW_COLORS.text.primary      // '#1f2937'
PREVIEW_COLORS.text.secondary    // '#6b7280'
PREVIEW_COLORS.text.tertiary     // '#9ca3af'
PREVIEW_COLORS.text.light        // '#d1d5db'
PREVIEW_COLORS.text.white        // '#ffffff'

PREVIEW_COLORS.background.light  // '#f9fafb'
PREVIEW_COLORS.background.white  // '#ffffff'
PREVIEW_COLORS.background.dark   // '#111827'

PREVIEW_COLORS.border.light      // '#e5e7eb'
PREVIEW_COLORS.border.medium     // '#d1d5db'

PREVIEW_COLORS.accent.blue       // '#3b82f6'
PREVIEW_COLORS.accent.green      // '#10b981'
PREVIEW_COLORS.accent.purple     // '#8b5cf6'
```

### Spacing Scale
```tsx
PREVIEW_SPACING.xs    // '4px'
PREVIEW_SPACING.sm    // '8px'
PREVIEW_SPACING.md    // '12px'
PREVIEW_SPACING.lg    // '16px'
PREVIEW_SPACING.xl    // '24px'
PREVIEW_SPACING['2xl'] // '32px'
PREVIEW_SPACING['3xl'] // '48px'
PREVIEW_SPACING['4xl'] // '64px'
```

### Typography
```tsx
PREVIEW_TYPOGRAPHY.h1    // { fontSize: '48px', fontWeight: 700, ... }
PREVIEW_TYPOGRAPHY.h2    // { fontSize: '36px', fontWeight: 700, ... }
PREVIEW_TYPOGRAPHY.h3    // { fontSize: '24px', fontWeight: 600, ... }
PREVIEW_TYPOGRAPHY.body  // { fontSize: '16px', fontWeight: 400, ... }
```

### Shadows
```tsx
PREVIEW_SHADOWS.sm   // '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
PREVIEW_SHADOWS.md   // '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
PREVIEW_SHADOWS.lg   // '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
PREVIEW_SHADOWS.xl   // '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
```

### Border Radius
```tsx
PREVIEW_BORDER_RADIUS.sm     // '4px'
PREVIEW_BORDER_RADIUS.md     // '8px'
PREVIEW_BORDER_RADIUS.lg     // '12px'
PREVIEW_BORDER_RADIUS.xl     // '16px'
PREVIEW_BORDER_RADIUS['2xl'] // '24px'
PREVIEW_BORDER_RADIUS.full   // '9999px'
```

---

## 🎬 Animations

### Animation Presets

**Fade animations:**
```tsx
PREVIEW_ANIMATIONS.fadeIn       // Fade in from 0 to 1
PREVIEW_ANIMATIONS.slideUp      // Slide up with fade
PREVIEW_ANIMATIONS.slideDown    // Slide down with fade
PREVIEW_ANIMATIONS.slideLeft    // Slide left with fade
PREVIEW_ANIMATIONS.slideRight   // Slide right with fade
```

**Advanced animations:**
```tsx
PREVIEW_ANIMATIONS.scaleIn      // Scale from 0.95 to 1
PREVIEW_ANIMATIONS.expandHeight // Height expansion
PREVIEW_ANIMATIONS.staggerContainer // Stagger children
PREVIEW_ANIMATIONS.listItem     // List item animation
```

**Interaction presets:**
```tsx
ANIMATION_PRESETS.cardHover     // Card hover effect
ANIMATION_PRESETS.buttonHover   // Button scale on hover
ANIMATION_PRESETS.imageZoom     // Image zoom on hover
```

**Usage:**
```tsx
import { motion } from 'framer-motion'
import { PREVIEW_ANIMATIONS } from '../shared'

<motion.div {...PREVIEW_ANIMATIONS.slideUp}>
  Content
</motion.div>
```

---

## 🛠️ Utility Functions

### Color Utilities

**Convert colors:**
```tsx
hexToRgb('#3b82f6')           // { r: 59, g: 130, b: 246 }
rgbToHex(59, 130, 246)        // '#3b82f6'
```

**Manipulate colors:**
```tsx
lightenColor('#3b82f6', 20)   // Lighten by 20%
darkenColor('#3b82f6', 20)    // Darken by 20%
addAlpha('#3b82f6', 0.5)      // Add 50% opacity
```

**Accessibility:**
```tsx
getContrastColor('#ffffff')   // Returns '#000000' for dark text
getContrastColor('#1f2937')   // Returns '#ffffff' for light text
```

**Generate:**
```tsx
createGradient(135, '#667eea', '#764ba2')  // Linear gradient
createRadialGradient('#667eea', '#764ba2') // Radial gradient
generatePlaceholder(300, 200, 'Image')     // via.placeholder.com URL
```

**Parse:**
```tsx
parseSize(48)                 // '48px'
parseSize('2rem')             // '2rem'
formatTypography(PREVIEW_TYPOGRAPHY.h1)  // CSS styles object
```

---

## 📋 Common Patterns

### Full-Width Section with Background
```tsx
<PreviewContainer
  width="100%"
  height={600}
  backgroundColor={bgColor}
  backgroundImage={imageUrl}
  overlay={{ color: 'black', opacity: 0.5 }}
  flex
  justifyContent="center"
  alignItems="center"
>
  <div style={{ textAlign: 'center', zIndex: 10 }}>
    {/* Content */}
  </div>
</PreviewContainer>
```

### Grid of Cards
```tsx
<PreviewContainer
  padding="xl"
  flex
  flexDirection="column"
  gap="lg"
>
  <PreviewHeading level="h2">Section Title</PreviewHeading>
  
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: PREVIEW_SPACING.lg }}>
    {items.map(item => (
      <PreviewCard key={item.id}>
        {/* Card content */}
      </PreviewCard>
    ))}
  </div>
</PreviewContainer>
```

### Centered Content
```tsx
<PreviewContainer
  flex
  justifyContent="center"
  alignItems="center"
  padding="xl"
>
  <div style={{ textAlign: 'center', maxWidth: '600px' }}>
    <PreviewHeading level="h1">Title</PreviewHeading>
    <p>Description text</p>
    <PreviewButton variant="primary">CTA</PreviewButton>
  </div>
</PreviewContainer>
```

---

## ⚡ Performance Tips

1. **Use `pointerEvents="none"`** (default) to prevent layout shifts
2. **Memoize large preview components** if they receive heavy prop updates
3. **Use CSS Grid/Flex** instead of JS calculations for layouts
4. **Lazy load images** in product grids with intersection observer
5. **Debounce animations** if previews are inside scrollable containers

---

## 🐛 Debugging

**Check if styles are applied:**
```tsx
<div style={{ ...style, border: '1px solid red' }}>
  {/* Temporarily add border to debug */}
</div>
```

**Verify token values:**
```tsx
console.log(PREVIEW_COLORS.text.primary)  // Should be '#1f2937'
console.log(PREVIEW_SPACING.lg)           // Should be '16px'
```

**Test variants:**
```tsx
// Try different variants
<PreviewButton variant="primary" />
<PreviewButton variant="secondary" />
<PreviewButton variant="outline" />
```

---

## 📚 Further Reading

- `SECTION_PREVIEWS_ENHANCEMENT_PLAN.md` - Strategic vision
- `SECTION_PREVIEWS_FOUNDATION_COMPLETE.md` - Phase 1 completion
- Each section preview component - Example implementations
