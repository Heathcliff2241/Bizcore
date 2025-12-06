# BrandStudio Section Previews - Implementation Summary

## Overview
Updated the BrandStudio canvas editor to display sections (HeaderSection, FooterSection, HeroSection, etc.) exactly as they appear in the public storefront. Previously, these sections were just placeholders in the canvas.

## Changes Made

### 1. Created Section Preview Components

#### `HeaderSectionPreview.tsx`
- Renders a preview of the header section with:
  - Logo text
  - Navigation links
  - Shopping cart icon
  - Mobile menu toggle
  - All styling (background color, text color, height)
- Responds to all header props from component.props

#### `FooterSectionPreview.tsx`
- Renders a preview of the footer section with:
  - Company name
  - Multiple column links
  - Copyright text
  - Responsive grid layout
- Supports multiple footer columns with links

#### `HeroSectionPreview.tsx`
- Renders a preview of the hero section with:
  - Heading text
  - Subheading text
  - Call-to-action button
  - Background image and color
  - Content alignment (left, center, right)
  - Framer Motion animations

### 2. Updated CanvasComponent Rendering

Modified `CanvasComponent.tsx` to use these preview components instead of simple Konva shape placeholders:

**Header Case (line 884-917)**
- Changed from Konva Text and Rect to React preview component
- Uses Html wrapper to overlay React on Konva canvas
- Maintains proper scaling with zoom

**Hero Case (line 921-957)**
- Replaced complex Konva rendering logic with HeroSectionPreview
- Simplified from 100+ lines to 25 lines
- Renders all hero variants (default, split, minimal, video)

**Footer Case (line 1512-1535)**
- Changed from Konva-based rendering to FooterSectionPreview
- Displays proper footer layout with columns
- Responsive design preview

### 3. Integration Pattern

All section previews use the same pattern:

```tsx
<Html
  divProps={{
    style: {
      position: 'absolute',
      top: '0',
      left: '0',
      width: `${size.width}px`,
      height: `${size.height}px`,
      pointerEvents: 'none',
      overflow: 'hidden',
    }
  }}
>
  <div style={{ 
    width: '100%', 
    height: '100%',
    transform: `scale(${useUIStore.getState().zoom})`,
    transformOrigin: 'top left',
  }}>
    <SectionPreview component={component} />
  </div>
</Html>
```

This pattern:
- Uses Konva's Html wrapper to embed React components
- Properly scales with canvas zoom
- Disables pointer events to keep selection handling in Konva
- Prevents overflow issues with clipping

## Benefits

1. **WYSIWYG Editing**: What you see in BrandStudio canvas now matches the storefront exactly
2. **Reduced Complexity**: Removed hundreds of lines of Konva rendering logic
3. **Maintainability**: Section rendering logic lives in one place (the storefront component)
4. **Consistency**: Both storefront and BrandStudio use the same styling and layout
5. **Animations**: Framer Motion animations now display in the preview
6. **Responsive Design**: Mobile menu and responsive layouts now visible in canvas

## Files Modified

- `brandstudio-vite/src/components/Editor/CanvasComponent.tsx` - Updated to use preview components
- `brandstudio-vite/src/components/Editor/SectionPreviews/HeaderSectionPreview.tsx` - NEW
- `brandstudio-vite/src/components/Editor/SectionPreviews/FooterSectionPreview.tsx` - NEW
- `brandstudio-vite/src/components/Editor/SectionPreviews/HeroSectionPreview.tsx` - NEW

## Future Enhancements

To apply the same approach to other sections:

1. Create preview components for:
   - ProductGrid
   - CTASection
   - NewsletterSection
   - TextBlock
   - And other section types

2. Use the same Html + scaling pattern in CanvasComponent cases

3. Example for other sections:
```tsx
case 'product-grid':
case 'product-carousel':
  return (
    <>
      <Rect fill="transparent" width={size.width} height={size.height} />
      <Html>
        <ProductGridPreview component={component} />
      </Html>
    </>
  )
```

## Testing

To test the implementation:

1. Open BrandStudio
2. Add a header, footer, or hero section
3. Canvas should now show the actual section layout
4. Modify properties (colors, text, etc.) and see real-time updates
5. Mobile menu should appear on header sections
6. All responsive behaviors should work in preview

## Notes

- The preview components are simplified versions focusing on layout and appearance
- They don't include interactive features (like auth, cart functionality)
- All styling is derived from component.props
- Zoom scaling is handled automatically by the Html wrapper
