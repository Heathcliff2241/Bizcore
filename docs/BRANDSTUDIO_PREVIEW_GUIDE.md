# BrandStudio Section Previews - Quick Start Guide

## What Changed?

Previously in BrandStudio, sections like headers and footers were displayed as simple placeholders (rectangles with basic text). Now they display exactly as they appear in the live storefront!

## Quick Demo

### Before
```
[---- Header ----]
  "Your Brand  🛒 Menu"
```

### After
```
┌─────────────────────────────────┐
│ Your Brand    Home Shop About... │
│                          🛒      │
└─────────────────────────────────┘
```

## Sections Updated

✅ **Header** - Now shows logo, navigation links, cart icon, and mobile menu
✅ **Hero** - Now displays heading, subheading, and CTA button with proper styling
✅ **Footer** - Now shows company info, footer columns, and copyright

## How It Works

The implementation uses Konva's `<Html>` component to overlay actual React components on the Konva canvas:

1. Canvas still handles selection, dragging, and resizing
2. React component handles display (styling, layout, animations)
3. Zoom scaling is handled automatically

## Benefits

| Feature | Before | After |
|---------|--------|-------|
| Visual accuracy | ❌ Basic shapes | ✅ Exact replica |
| Mobile menu preview | ❌ Not shown | ✅ Visible and interactive |
| Animations | ❌ None | ✅ Framer Motion works |
| Responsive layout | ❌ Single view | ✅ Full design preview |
| Maintenance | ❌ Duplicate code | ✅ Single source of truth |

## File Structure

```
src/components/Editor/
├── CanvasComponent.tsx (UPDATED)
├── SectionPreviews/
│   ├── HeaderSectionPreview.tsx (NEW)
│   ├── FooterSectionPreview.tsx (NEW)
│   ├── HeroSectionPreview.tsx (NEW)
│   └── TEMPLATE.ts (for future sections)
```

## Extending to Other Sections

To add previews for other sections (ProductGrid, CTA, Newsletter, etc.):

1. Create a new preview component in `SectionPreviews/`:
```tsx
// SectionPreviews/ProductGridPreview.tsx
export function ProductGridPreview({ component }: { component: Component }) {
  const props = component.props || {};
  const size = component.size || { width: 1440, height: 600 };
  
  // Render using React/Tailwind
  return (
    <div style={{ width: size.width, height: size.height }}>
      {/* Your preview markup */}
    </div>
  );
}
```

2. Import in CanvasComponent:
```tsx
import { ProductGridPreview } from './SectionPreviews/ProductGridPreview'
```

3. Add case to switch statement:
```tsx
case 'product-grid':
case 'product-carousel':
case 'product-featured':
  return (
    <>
      <Rect width={size.width} height={size.height} fill="transparent" />
      <Html>
        <div style={{ transform: `scale(${useUIStore.getState().zoom})` }}>
          <ProductGridPreview component={component} />
        </div>
      </Html>
    </>
  )
```

## Testing Your Changes

1. Start the BrandStudio dev server
2. Add a header/hero/footer section to a page
3. Verify it displays with proper styling
4. Test modifying colors and text (should update in real-time)
5. For header: test mobile menu toggle
6. Check zoom in/out works correctly

## Performance Notes

- React components only render when `component` prop changes
- Zoom scaling doesn't trigger re-renders of the preview
- Selection/dragging stays fast because it's handled by Konva
- Large images may need optimization for smooth preview

## Known Limitations

- Preview components don't include interactive features (e.g., cart functionality, form submissions)
- Some complex interactions (auth, API calls) are simplified
- Images in previews are scaled with CSS, not pre-optimized

## Next Steps

Consider creating previews for:
- ProductGrid (shows mock product cards)
- CTASection (call-to-action blocks)
- NewsletterSection (email signup form)
- TestimonialSection (customer testimonials)
- PricingSection (pricing tables)
- FAQSection (accordion)
- ImageGallery (image carousel)

Each follows the same pattern as the header/hero/footer implementations.
