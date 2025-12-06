# Phase 3 Preparation Guide - Next Components to Refactor

**Status:** Ready to Start Phase 3  
**Estimated Duration:** 2-3 weeks  
**Priority:** ProductGridPreview → Form Previews → Additional Variants

---

## 📋 Phase 3 Overview

Phase 3 focuses on:
1. Refactoring ProductGridPreview (already enhanced for real products)
2. Refactoring all 4 form previews
3. Creating additional variants for completed components
4. Documentation and final testing

---

## 🎯 Task 1: ProductGridPreview Refactoring

**Current Status:** Enhanced with real product fetching, ready for refactoring  
**Estimated Time:** 4-5 hours  
**Impact:** High - Used in all product-focused storefronts

### Current Implementation
```tsx
// Location: SectionPreviews/ProductGridPreview.tsx
// Current: 253 lines
// Uses: MOCK_PRODUCTS constant, apiClient for fetching
// Strengths: Real product data, fallback to mock products
// Weaknesses: Inline card styles, no variant support, large file
```

### Refactoring Approach

**Step 1: Extract Card Component**
```tsx
// Create: SectionPreviews/shared/components/ProductCard.tsx
interface ProductCardProps {
  product: Product
  variant?: 'default' | 'compact' | 'featured'
  onHover?: (hovered: boolean) => void
}
```

**Step 2: Create Variants Config**
```tsx
const PRODUCT_GRID_VARIANTS = {
  default: { columns: 3, cardSize: 'md', ... },
  carousel: { columns: 1, animation: 'slide', ... },
  featured: { columns: 2, spotlight: true, ... },
  compact: { columns: 4, cardSize: 'sm', ... }
}
```

**Step 3: Refactor Main Component**
```tsx
// Replace inline styles with shared components
// Use PreviewCard for each product
// Leverage PREVIEW_COLORS, PREVIEW_SPACING
// Move styles to variant config
// Expected result: ~150 lines (41% reduction)
```

### Variants to Implement
1. **default** - 3-column grid, standard cards
2. **carousel** - Single column, slide animation
3. **featured** - Spotlight on featured product
4. **compact** - 4-column grid for density

### Code Pattern to Follow
```tsx
import { PreviewContainer, PreviewCard, PREVIEW_COLORS, PREVIEW_SPACING } from './shared'

type ProductGridVariant = 'default' | 'carousel' | 'featured' | 'compact'

interface GridVariantConfig {
  columns: number
  cardSize: 'sm' | 'md' | 'lg'
  animationStyle: 'fade' | 'slide' | 'scale'
}

const PRODUCT_GRID_VARIANTS: Record<ProductGridVariant, GridVariantConfig> = {
  // Define variants...
}

export function ProductGridPreview({ component }: Props) {
  const variant = props.variant || 'default'
  const config = PRODUCT_GRID_VARIANTS[variant]
  
  // Use PreviewContainer + PreviewCard
  // Implement variant logic
}
```

### Key Integration Points
- Already uses `MOCK_PRODUCTS` constant ✅
- Already fetches from correct API endpoint ✅
- Already has subdomain detection via postMessage ✅
- Can reuse ProductCard as isolated component
- All dependencies already imported

### Templates to Update
```typescript
// Add to sectionTemplates.ts
{
  id: 'product-grid-default',
  name: 'Product Grid',
  category: 'content',
  description: 'Standard 3-column product grid with real products',
  props: { variant: 'default', columns: 3, showPrice: true }
},
{
  id: 'product-grid-carousel',
  name: 'Product Carousel',
  category: 'content',
  description: 'Single column scrolling carousel',
  props: { variant: 'carousel', columns: 1, showPrice: true }
},
// ... etc
```

---

## 🎯 Task 2: Form Previews Refactoring

**Current Status:** Need to identify and refactor 4 form components  
**Estimated Time:** 6-8 hours total (1.5-2 hours per form)  
**Impact:** Medium - Used in checkout and lead generation flows

### Forms to Refactor
1. **SignUpFormPreview** - Registration/account creation
2. **LoginFormPreview** - User login form  
3. **CheckoutFormPreview** - Purchase checkout form
4. **ContactFormPreview** - Contact/inquiry form

### Refactoring Strategy

**Step 1: Create Shared Form Components**
```tsx
// Create: SectionPreviews/shared/components/FormField.tsx
interface FormFieldProps {
  label: string
  type: 'text' | 'email' | 'password' | 'textarea'
  variant?: 'default' | 'filled' | 'outlined'
  required?: boolean
}

// Create: SectionPreviews/shared/components/FormButton.tsx
// Alias to PreviewButton with form-specific styling
```

**Step 2: Extract Common Form Patterns**
```tsx
// FormField components
// Button group patterns
// Form layout helpers (vertical, horizontal, grid)
// Validation feedback patterns
```

**Step 3: Define Form Variants**
```tsx
const FORM_VARIANTS = {
  default: { layout: 'vertical', spacing: 'md', ... },
  compact: { layout: 'vertical', spacing: 'sm', ... },
  inline: { layout: 'horizontal', spacing: 'md', ... },
  sideBySize: { layout: 'grid', columns: 2, ... },
  multiStep: { steps: 3, currentStep: 1, ... }
}
```

### Form-Specific Patterns

**SignUpForm Variants:**
```
- default: Email, password, confirm password, submit
- minimal: Just email and password
- extended: With terms acceptance, optional phone field
- social: With OAuth provider buttons
```

**LoginForm Variants:**
```
- default: Email, password, remember me, submit
- minimal: Just email and password
- withRecovery: Add password recovery link
- social: With OAuth options
```

**CheckoutForm Variants:**
```
- default: Address, shipping, payment fields
- compact: Inline fields to save space
- multiStep: Wizard-style with progress indicator
- expressCheckout: Minimal required fields
```

**ContactForm Variants:**
```
- default: Name, email, message, submit
- extended: Add subject, priority, category dropdown
- minimal: Email, message only
- extended: Add file attachment field
```

### Code Pattern
```tsx
import { FormField, FormButton, PREVIEW_COLORS, PREVIEW_SPACING } from './shared'

type SignUpVariant = 'default' | 'minimal' | 'extended' | 'social'

export function SignUpFormPreview({ component }: Props) {
  const variant = props.variant || 'default'
  
  return (
    <PreviewContainer>
      <form>
        {variant !== 'minimal' && <FormField label="Email" type="email" />}
        <FormField label="Password" type="password" />
        {variant === 'extended' && <FormField label="Phone" type="text" />}
        <FormButton>Sign Up</FormButton>
      </form>
    </PreviewContainer>
  )
}
```

### Expected Impact Per Form
- **SignUpForm:** ~120 lines → ~75 lines (38% reduction)
- **LoginForm:** ~100 lines → ~60 lines (40% reduction)
- **CheckoutForm:** ~180 lines → ~110 lines (39% reduction)
- **ContactForm:** ~90 lines → ~55 lines (39% reduction)
- **Total:** ~490 lines → ~300 lines (39% reduction)

---

## 🎯 Task 3: Additional Variants for Completed Components

**Estimated Time:** 2-3 weeks (as time permits)  
**Impact:** High - Increases template library significantly

### HeaderSectionPreview Additional Variants
```
Current: 4 variants (default, sticky, glassMorphism, minimal)
Add:
- transparent: For hero overlay
- fullWidth: Without padding
- megaMenu: Multi-level navigation
- searchable: With integrated search
```

### HeroSectionPreview Additional Variants
```
Current: 4 variants (default, imageOverlay, splitLayout, video)
Add:
- carousel: Multiple hero slides
- scroller: Parallax scrolling effect
- absoluteContent: Content overlaid on corner
- animated: Animated background elements
```

### New Components to Create
1. **CTASectionPreview Variants**
   - default: Simple CTA section
   - withImage: CTA + side image
   - comparison: Feature comparison table
   - countdown: With countdown timer

2. **TestimonialsSectionPreview Variants**
   - grid: 3 or 4 column grid
   - carousel: Rotating testimonials
   - featured: Single featured testimonial
   - wall: Infinite scroll wall

3. **FooterSectionPreview Variants**
   - simple: Logo, links, social
   - multi-column: 3-4 columns with categories
   - newsletter: With email subscription
   - sitemap: Full site navigation footer

4. **PricingTablePreview Variants**
   - simple: 2-3 column pricing
   - comparison: Full feature comparison matrix
   - tiered: Highlighted popular tier
   - toggle: Annual/monthly toggle

### Variant Creation Checklist Template
For each new variant, follow this pattern:

```tsx
// 1. Define variant type
type ComponentVariant = 'variant1' | 'variant2'

// 2. Create config interface
interface VariantConfig {
  layout: string
  colors: ColorScheme
  spacing: SpacingScale
  animationStyle: string
}

// 3. Create variants record
const COMPONENT_VARIANTS: Record<ComponentVariant, VariantConfig> = {
  variant1: { ... },
  variant2: { ... }
}

// 4. Extract variant in component
const variant = props.variant || 'default'
const config = COMPONENT_VARIANTS[variant]

// 5. Use in render
<PreviewContainer {...config.containerProps}>
  {/* variant-specific content */}
</PreviewContainer>

// 6. Add to templates
// Add new template entry to sectionTemplates.ts
```

### Time Estimate Per Variant
- Simple variant (color/spacing changes): 15-20 minutes
- Layout variant (different grid/flex): 25-35 minutes
- Complex variant (new logic/animation): 45-60 minutes

---

## 🛠️ Refactoring Checklist for Each Component

Use this checklist when refactoring:

```markdown
- [ ] Read component and understand current implementation
- [ ] Identify inline styles and colors
- [ ] Plan variant structure and config
- [ ] Extract all design tokens to PREVIEW_COLORS/SPACING
- [ ] Create variant config record with TypeScript types
- [ ] Replace inline styles with shared component props
- [ ] Add variant selection logic
- [ ] Add animations using PREVIEW_ANIMATIONS
- [ ] Update component props interface
- [ ] Add new templates to sectionTemplates.ts
- [ ] Run TypeScript check - verify no errors
- [ ] Count lines before/after for impact reporting
- [ ] Create PR/commit with changes
- [ ] Test in canvas with each variant
- [ ] Document variant differences in code comments
```

---

## 📊 Refactoring Progress Tracking

| Component | Status | Lines Before | Lines After | Reduction | Variants | Time |
|-----------|--------|---|---|---|---|---|
| HeaderSectionPreview | ✅ Done | 158 | 92 | 42% | 4 | 2h |
| HeroSectionPreview | ✅ Done | 117 | 78 | 33% | 4 | 1.5h |
| ProductGridPreview | 📋 Next | 253 | ~150 | ~41% | 4 | 4-5h |
| SignUpFormPreview | 📋 Queue | ~120 | ~75 | ~38% | 4 | 1.5h |
| LoginFormPreview | 📋 Queue | ~100 | ~60 | ~40% | 4 | 1h |
| CheckoutFormPreview | 📋 Queue | ~180 | ~110 | ~39% | 4 | 2h |
| ContactFormPreview | 📋 Queue | ~90 | ~55 | ~39% | 4 | 1h |
| CTASectionPreview | 📋 Queue | ~80 | ~50 | ~38% | 4 | 1.5h |
| TestimonialsSectionPreview | 📋 Queue | ~140 | ~85 | ~39% | 4 | 2h |
| FooterSectionPreview | 📋 Queue | ~150 | ~95 | ~37% | 4 | 2h |
| **TOTAL** | | **1,368** | **~850** | **~38%** | **40** | **~20h** |

---

## 🚀 Phase 3 Weekly Breakdown

**Week 1:**
- ProductGridPreview refactoring (4-5h)
- Testing and validation (1h)
- Documentation (1h)

**Week 2-3:**
- Form previews refactoring (6-8h)
- CTASectionPreview and TestimonialsSectionPreview (4-5h)
- Additional variants for headers/heroes (3-4h)
- Final testing and documentation (2-3h)

**Remaining:**
- FooterSectionPreview and other components
- Additional templates and variants
- UI polish and performance optimization

---

## 💡 Pro Tips for Phase 3

1. **Start with ProductGridPreview**
   - Already has real data fetching
   - Card extraction is straightforward
   - Will provide momentum for form refactoring

2. **Forms Can Be Templated**
   - Use FormField component 3+ times
   - Reduce duplication significantly
   - Create reusable field configurations

3. **Test Frequently**
   - After each component refactoring, test in canvas
   - Verify variants work and look right
   - Catch issues early before moving to next component

4. **Update Templates Last**
   - Refactor all components first
   - Add all templates in one session
   - Update CanvasComponent case statements together

5. **Document Variant Differences**
   - Add inline comments explaining each variant
   - Link to storefront components for reference
   - Create visual variant comparison docs

---

## 📞 Phase 3 Success Criteria

✅ Phase 3 is complete when:
- [ ] ProductGridPreview fully refactored with 4+ variants
- [ ] All 4 form previews refactored
- [ ] ~30+ templates in sectionTemplates.ts
- [ ] All components have 0 linting errors
- [ ] All variants tested in canvas
- [ ] 38%+ code reduction achieved
- [ ] No hardcoded colors outside PREVIEW_COLORS
- [ ] No hardcoded spacing outside PREVIEW_SPACING
- [ ] 40+ component variants available in system
- [ ] Comprehensive variant documentation created

---

## 🎓 Knowledge Transfer

When handing off Phase 3 to another developer:

1. **Provide These Documents:**
   - SECTION_PREVIEWS_ENHANCEMENT_PLAN.md
   - SECTION_PREVIEWS_FOUNDATION_COMPLETE.md
   - SECTION_PREVIEW_DEVELOPER_GUIDE.md
   - PHASE_2_COMPLETION.md (this document)

2. **Show Examples:**
   - HeaderSectionPreview refactored version
   - HeroSectionPreview with variants
   - ProductGridPreview (reference for pattern)

3. **Explain Key Concepts:**
   - Variant config pattern
   - Design token system
   - Shared component composition
   - Template system integration

4. **Set Clear Expectations:**
   - Each component: 1.5-2.5 hours refactoring
   - Each variant: 15-60 minutes to add
   - Testing: 30 min per component
   - Documentation: 20 min per component
