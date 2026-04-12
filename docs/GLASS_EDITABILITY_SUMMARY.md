# Glass Section Editability - Complete Solution

## The Answer: Why HeroSectionPreview is Editable

### Architecture Chain

```
HeroSectionPreview Component
    ↓
RightPanel.tsx detects selection
    ↓
useComponentProps hook queries type
    ↓
getEditablePropsForComponent lookup table
    ↓
Returns array of editable fields
    ↓
RightPanel renders input UI
    ↓
updateComponent() called on change
    ↓
Store updates, preview re-renders
```

### Key Components in the Editability System

**1. RightPanel.tsx (The UI)**
- Renders properties and styles tabs
- Uses `useComponentProps(selectedComponent)` to get editable fields
- Generates input controls (text, color, number, toggle, etc.)
- Calls `handlePropertyChange()` on user input
- Shows real-time updates

**2. useComponentProps.ts (The Hook)**
```typescript
export const useComponentProps = (component: Component | null) => {
  const fields = useMemo(() => {
    if (!component) return []
    return getEditablePropsForComponent(component)  // ← Lookup table
  }, [component])
  
  const groupedFields = useMemo(() => {
    // Groups fields by section for UI organization
    return Array.from(groups.entries())
  }, [fields])

  return { fields, groupedFields }
}
```

**3. getEditablePropsForComponent (The Lookup Table)**
```typescript
export const getEditablePropsForComponent = (component: Component): ComponentPropField[] => {
  const { type, props = {} } = component
  const fields: ComponentPropField[] = []
  
  // For each component type, define what's editable:
  if (type === 'hero' || type === 'hero-default' || ...) {
    addField({ key: 'heading', label: 'Heading', type: 'text', ... })
    addField({ key: 'backgroundColor', label: 'Background Color', type: 'color', ... })
    // etc.
  }
  
  return fields
}
```

---

## Why Glass Sections Weren't Editable (Before)

**Missing lookup entries!**

```typescript
// Before: No glass types in getEditablePropsForComponent
if (type === 'header-glass' || ...) {
  // ❌ MISSING - No fields defined
}
```

When a glass section was selected:
- ❌ `groupedFields` returned empty array
- ❌ RightPanel rendered nothing
- ❌ No properties panel controls available
- ❌ No way to edit without hardcoding

---

## Solution: Added Glass Types to Lookup Table

Added 5 new conditionals to `getEditablePropsForComponent()`:

### 1. header-glass
```typescript
if (type === 'header-glass') {
  addField({ key: 'logoImage', ... })
  addField({ key: 'logoText', ... })
  addField({ key: 'showCart', type: 'toggle', ... })
  addField({ key: 'glassBackground', ... })
  addField({ key: 'textColor', type: 'color', ... })
}
```

### 2. hero-glass
```typescript
if (type === 'hero-glass') {
  addField({ key: 'title', ... })
  addField({ key: 'subtitle', ... })
  addField({ key: 'ctaText', ... })
  addField({ key: 'backgroundImage', ... })
  addField({ key: 'glassBackground', ... })
  addField({ key: 'textColor', type: 'color', ... })
}
```

### 3. cta-glass
```typescript
if (type === 'cta-glass') {
  addField({ key: 'badge', ... })
  addField({ key: 'title', ... })
  addField({ key: 'subtitle', type: 'textarea', ... })
  addField({ key: 'ctaText', ... })
  addField({ key: 'backgroundImage', ... })
  addField({ key: 'glassBackground', ... })
  addField({ key: 'textColor', type: 'color', ... })
  addField({ key: 'badgeColor', ... })
}
```

### 4. footer-glass
```typescript
if (type === 'footer-glass') {
  addField({ key: 'companyName', ... })
  addField({ key: 'copyright', ... })
  addField({ key: 'glassBackground', ... })
  addField({ key: 'textColor', type: 'color', ... })
}
```

### 5. feature-glass
```typescript
if (type === 'feature-glass') {
  addField({ key: 'title', ... })
  addField({ key: 'subtitle', ... })
  addField({ key: 'backgroundImage', ... })
  addField({ key: 'glassBackground', ... })
  addField({ key: 'textColor', type: 'color', ... })
}
```

---

## Complete Editability Flow Now

```
Select glass section on canvas
    ↓
CanvasComponent renders ComponentActionButtons
    ↓
RightPanel queries useComponentProps
    ↓
useComponentProps calls getEditablePropsForComponent('hero-glass')
    ↓
Returns: [
  { key: 'title', label: 'Title', type: 'text', value: '...' },
  { key: 'subtitle', label: 'Subtitle', type: 'text', value: '...' },
  { key: 'ctaText', label: 'CTA Button Text', type: 'text', value: '...' },
  { key: 'backgroundImage', label: 'Background Image', type: 'text', value: '...' },
  { key: 'glassBackground', label: 'Glass Background', type: 'text', value: '...' },
  { key: 'textColor', label: 'Text Color', type: 'color', value: '...' }
]
    ↓
RightPanel renders input fields:
  - Text input for "Title"
  - Text input for "Subtitle"
  - Text input for "CTA Button Text"
  - Text input for "Background Image"
  - Text input for "Glass Background"
  - Color picker for "Text Color"
    ↓
User changes "Title" → handlePropertyChange('title', 'New Title')
    ↓
updateComponent(id, { props: { ...props, title: 'New Title' } })
    ↓
Store updates (Zustand)
    ↓
HeroGlassPreview re-renders with new props
    ↓
Canvas shows updated content in real-time
```

---

## Files Modified

1. **useComponentProps.ts** - Added 5 new type conditionals for glass sections
2. **HeroGlassPreview.tsx** - Refactored to be props-driven (previous session)
3. **HeaderGlassPreview.tsx** - Refactored to be props-driven
4. **CTAGlassPreview.tsx** - Refactored to be props-driven
5. **FooterGlassPreview.tsx** - Refactored to be props-driven
6. **FeatureGlassPreview.tsx** - Refactored to be props-driven
7. **CanvasComponent.tsx** - Added ComponentActionButtons to glass cases

---

## Result

✅ **Glass sections now fully editable**
✅ **Real-time properties panel updates**
✅ **Grouped fields by section (Content, Style, Layout)**
✅ **All glass sections work identically to regular sections**
✅ **Consistent UI experience across BrandStudio**

### What You Can Now Edit

| Section | Editable Properties |
|---------|-------------------|
| **header-glass** | Logo text, logo image, show cart, glass background, text color |
| **hero-glass** | Title, subtitle, button text, background image, glass background, text color |
| **cta-glass** | Badge, title, subtitle, button text, background, glass background, text/badge colors |
| **footer-glass** | Company name, copyright text, glass background, text color |
| **feature-glass** | Title, subtitle, background image, glass background, text color |

---

## Key Insight

**Editability in BrandStudio works through a lookup table system**, not magic:

1. Component type is detected
2. Lookup table queries what properties are editable for that type
3. UI generates controls based on field types
4. Updates flow back through the store
5. Components re-render with new props

**That's why adding glass types to the lookup table instantly makes them editable!**
