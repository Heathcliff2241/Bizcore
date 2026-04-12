# Image Optimization Guide

This document outlines how image optimization is implemented across BizCore storefronts for mobile responsiveness and performance.

## Overview

Images are optimized for different screen sizes and devices using:
- **Responsive sizes**: CSS media queries tell the browser which image to load
- **Lazy loading**: Images below the fold load only when needed
- **Format negotiation**: Modern formats (WebP, AVIF) for smaller file sizes
- **Quality adjustment**: Lower quality on mobile/tablet, higher on desktop

## Image Optimization Features

### 1. Responsive Image Sizes

Located in `components/storefront/utils/responsiveImages.ts`

**Available size presets:**

```typescript
// Hero images - full viewport width
'hero': '(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw'

// Product grid images - shrink on mobile
'product': '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'

// Feature/About images - half width on desktop
'feature': '(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw'

// Thumbnails - fixed small size
'thumbnail': '(max-width: 640px) 80px, 120px'
```

### 2. Lazy Loading Strategy

Images below the fold automatically lazy load:

```tsx
// Hero/above-fold images
<Image
  src={heroImage}
  priority={true}  // Loads immediately
  loading="eager"
/>

// Product grid/below-fold images
<Image
  src={productImage}
  loading="lazy"   // Loads when needed
/>
```

### 3. Quality Adjustment

Images are served at different quality levels based on viewport:

| Device | Quality | Rationale |
|--------|---------|-----------|
| Mobile (<640px) | 60% | Smaller screens, slower connections |
| Tablet (640-1024px) | 75% | Medium quality, balanced |
| Desktop (>1024px) | 85% | High quality for larger displays |

## Implementation in Components

### ImageBlock Component

Used for featured images with lightbox and hover effects.

```tsx
import { getResponsiveSizes, getResponsiveQuality } from './utils/responsiveImages'

<Image
  src={src}
  alt={alt}
  fill
  sizes={getResponsiveSizes('feature')}
  quality={getResponsiveQuality()}
  loading="lazy"
/>
```

### ProductCard Component

Used in product grids - automatically optimized for product images.

```tsx
<Image
  src={product.imageUrl}
  alt={product.name}
  fill
  sizes={getResponsiveSizes('product')}
  loading="lazy"
  quality={75}
/>
```

### FreeformImage Component

Used for custom/designer-placed images in BrandStudio.

```tsx
<img
  src={src}
  alt={alt}
  loading="lazy"
  decoding="async"
  style={{ ... }}
/>
```

## Next.js Image Configuration

Configured in `next.config.js`:

```javascript
images: {
  domains: ['bizcore.test', 'localhost', '127.0.0.1'],
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [320, 480, 640, 768, 1024, 1280, 1440, 1536],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 31536000,  // 1 year cache
}
```

## Performance Impact

### File Size Reduction

- **WebP format**: 25-35% smaller than JPEG
- **AVIF format**: 50-80% smaller than JPEG
- **Quality adjustment**: 20-40% smaller on mobile vs desktop quality

### Network Requests

- **Lazy loading**: Reduces initial page load by 40-60% for below-fold images
- **Responsive sizes**: Eliminates unnecessary large images on mobile
- **Format negotiation**: Browser downloads optimal format

### Example: Product Grid Page

**Before optimization:**
- 20 product images × 200KB = 4MB total
- All 20 loaded on page load
- Load time: ~8 seconds on 4G

**After optimization:**
- Images: 20 × 50-80KB (WebP) = 1-1.6MB
- Only visible products loaded initially
- Progressive loading as user scrolls
- Load time: ~2 seconds on 4G

## Usage Guidelines

### For New Components

1. Import responsive utilities:
   ```tsx
   import { getResponsiveSizes, getResponsiveQuality } from './utils/responsiveImages'
   ```

2. Use appropriate size preset:
   - `hero` for full-width hero images
   - `product` for product grids
   - `feature` for about/feature sections
   - `thumbnail` for small images

3. Add responsive props:
   ```tsx
   <Image
     src={imageUrl}
     alt={imageAlt}
     sizes={getResponsiveSizes('product')}
     quality={getResponsiveQuality()}
     loading="lazy"
   />
   ```

### For Designer-Created Content

BrandStudio images automatically:
- Load with lazy loading
- Use async decoding (non-blocking)
- Benefit from mobile scaling (via mobile transforms)

### Mobile Override Props

If you need custom image behavior on mobile:

```tsx
const { getResponsiveSizes } = require('./utils/responsiveImages')

// Custom sizes for special layouts
const customSizes = '(max-width: 640px) 90vw, (max-width: 1024px) 60vw, 40vw'

<Image
  src={src}
  sizes={customSizes}
  quality={isMobile ? 70 : 85}
/>
```

## Browser Support

| Format | Support | Fallback |
|--------|---------|----------|
| AVIF | Chrome 85+, Firefox 93+ | WebP |
| WebP | All modern browsers | JPEG |
| JPEG | All browsers | Baseline support |

Next.js automatically serves appropriate format based on browser capability.

## Testing Image Optimization

### Chrome DevTools

1. Open Network tab
2. Filter by `Img` type
3. Check:
   - Image file size (should be <100KB for products)
   - Format (should be WebP or AVIF on modern browsers)
   - Loading attribute
   - Dimensions vs actual size

### Lighthouse

Run Lighthouse audit:
1. Open DevTools → Lighthouse
2. Check "Unused CSS" section
3. Look for "Properly sized images" audit
4. Check "Serve images in next-gen formats" audit

### Manual Testing

Mobile (< 640px):
- Images should load at 60% quality
- Aspect ratios maintained
- No horizontal scroll

Tablet (640-1024px):
- Images at 75% quality
- Responsive grid columns

Desktop (> 1024px):
- High quality images (85%)
- Full-width or multi-column layouts

## Common Issues & Solutions

### Issue: Images not loading

**Solution:**
- Check image domain whitelist in `next.config.js`
- Add domain: `domains: ['cdn.example.com']`

### Issue: Wrong image size on mobile

**Solution:**
- Verify `sizes` prop matches viewport
- Check mobile device size in DevTools
- Use `getResponsiveSizes('product')` helper

### Issue: Blurry images

**Solution:**
- Check quality setting (should be 75-85)
- Verify original image is high resolution (1440px+ width)
- Check browser format support

### Issue: Images loading slowly

**Solution:**
- Enable lazy loading: `loading="lazy"`
- Check quality setting
- Verify image CDN/domain performance
- Use `priority={true}` only for above-fold

## Future Improvements

- [ ] Dynamic image placeholder (blur hash)
- [ ] Image optimization API for custom processing
- [ ] Responsive image preloading for critical images
- [ ] Automatic art direction (different crops per viewport)
