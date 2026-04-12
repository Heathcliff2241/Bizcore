# Component Flow: Editor → Storefront

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BRANDSTUDIO VITE EDITOR                          │
│                     (brandstudio-vite/ workspace)                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────┐
         │  1. USER DRAGS COMPONENT FROM PALETTE            │
         │     Source: componentLibrary.ts                  │
         │     107+ component templates available           │
         └──────────────────────────────────────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────┐
         │  2. COMPONENT ADDED TO CANVAS                    │
         │     Canvas.tsx (Konva Stage)                     │
         │     └─ Flattens hierarchy                        │
         │     └─ Sorts by zIndex                           │
         └──────────────────────────────────────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────┐
         │  3. COMPONENT RENDERED IN EDITOR                 │
         │     CanvasComponent.tsx                          │
         │     ├─ Konva primitives (Rect, Text, Line)      │
         │     └─ HTML overlay for complex sections:        │
         │        ├─ HeaderGlassPreview                     │
         │        ├─ HeroGlassPreview                       │
         │        ├─ ProductGridPreview                     │
         │        └─ ... 30+ preview components             │
         └──────────────────────────────────────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────┐
         │  4. AUTO-SAVE (every 3 seconds)                  │
         │     useAutoSave.ts hook                          │
         │     └─ PUT /api/pages/[id]                       │
         │        └─ Saves to content field (draft)         │
         └──────────────────────────────────────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────┐
         │  5. USER CLICKS "PUBLISH"                        │
         │     Toolbar.tsx → handlePublish()                │
         │     └─ POST /api/pages/[id]/publish              │
         └──────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           MAIN APP (BizCore)                             │
│                      (c:\laragon\www\bizcore-v2\)                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────┐
         │  6. PUBLISH API ENDPOINT                         │
         │     app/api/pages/[id]/publish/route.ts          │
         │     ├─ Copy content → publishedContent           │
         │     ├─ Set isPublished = true                    │
         │     ├─ Set publishedAt = now()                   │
         │     └─ Call revalidatePath()                     │
         └──────────────────────────────────────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────┐
         │  7. ISR REVALIDATION                             │
         │     Next.js revalidatePath()                     │
         │     └─ Invalidates cached page at:               │
         │        /storefront/[subdomain]/[slug]            │
         └──────────────────────────────────────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────┐
         │  8. CUSTOMER VISITS STOREFRONT                   │
         │     app/storefront/[subdomain]/[slug]/page.tsx   │
         │     └─ Fetch published page from DB              │
         └──────────────────────────────────────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────┐
         │  9. PAGE RENDERED                                │
         │     PageRenderer.tsx                             │
         │     └─ Loop through components:                  │
         │        components.map(component => {             │
         │          const Component = componentMap[type]    │
         │          return <Component {...props} />         │
         │        })                                        │
         └──────────────────────────────────────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────┐
         │  10. STOREFRONT COMPONENTS RENDER                │
         │      components/storefront/                      │
         │      ├─ HeaderGlass.tsx                          │
         │      ├─ HeroGlass.tsx                            │
         │      ├─ ProductGrid.tsx                          │
         │      ├─ FooterGlass.tsx                          │
         │      └─ ... 38+ implementations                  │
         └──────────────────────────────────────────────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │   LIVE STOREFRONT     │
                        │   Fully Rendered      │
                        └───────────────────────┘
```

---

## Component Mapping Flow

```
EDITOR PREVIEW                    STOREFRONT PRODUCTION
(brandstudio-vite)               (main app)
─────────────────────            ─────────────────────────

componentMap                     componentMap
├─ 'header-glass'                ├─ 'header-glass'
│  └─ HeaderGlass (preview)      │  └─ HeaderGlass (full impl)
├─ 'hero-glass'                  ├─ 'hero-glass'
│  └─ HeroGlass (preview)        │  └─ HeroGlass (full impl)
├─ 'product-grid'                ├─ 'product-grid'
│  └─ FeatureGlass (placeholder) │  └─ ProductGrid (full impl)
└─ ... 107 types                 └─ ... 131 types
```

---

## Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   EDITOR     │────▶│   DATABASE   │────▶│  STOREFRONT  │
│   (Draft)    │     │   (Prisma)   │     │   (Live)     │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                     │
       │                    │                     │
       ▼                    ▼                     ▼
  components[]        PageDesign              components[]
  (changing)          ├─ content             (frozen)
  ↓ auto-save         │  └─ Draft version
  every 3s            └─ publishedContent
                         └─ Live version
```

---

## Component State Lifecycle

```
1. CREATED
   ↓
   User drags from palette
   Component { type, props, position, size, zIndex }
   
2. EDITING
   ↓
   User modifies in editor
   Props updated in real-time
   Preview renders via CanvasComponent
   
3. SAVED (Draft)
   ↓
   Auto-saved to DB (content field)
   isDraft = true
   
4. PUBLISHED
   ↓
   content → publishedContent (snapshot)
   isPublished = true
   publishedAt = timestamp
   
5. LIVE
   ↓
   Rendered on storefront
   Uses publishedContent (never changes unless republished)
   Cached via ISR (1 hour or on-demand revalidation)
```

---

## Component Lookup Process

### In Editor (Preview)
```typescript
// CanvasComponent.tsx (line ~1028+)
switch (component.type) {
  case 'header-glass':
    return <Html><HeaderGlassPreview component={component} /></Html>
  case 'hero-glass':
    return <Html><HeroGlassPreview component={component} /></Html>
  // ... 100+ cases
}
```

### On Storefront (Production)
```typescript
// PageRenderer.tsx (line ~152)
const Component = componentMap[type]
return <Component {...props} storefront={storefront} />

// Where componentMap is:
export const componentMap = {
  'header-glass': HeaderGlass,
  'hero-glass': HeroGlass,
  // ... from components/storefront/index.ts
}
```

---

## Props Mapping Example

```
EDITOR                           STOREFRONT
──────                           ──────────

component = {                    <HeaderGlass
  id: "hdr-1",                     backgroundColor="#667eea"
  type: "header-glass",            logoText="My Store"
  props: {                         links={[...]}
    backgroundColor: "#667eea",    height={80}
    logoText: "My Store",          storefront={{
    links: [...],                    subdomain: "nuvem",
    ...                              primaryColor: "#3b82f6"
  },                               }}
  size: {                        />
    height: 80
  }
}
```

---

## Error Handling Flow

```
┌─────────────────────┐
│ Unknown Component?  │
└─────────────────────┘
          │
          ├─ EDITOR
          │  └─ Show placeholder in CanvasComponent
          │     or use ComponentRenderer fallback
          │
          └─ STOREFRONT
             └─ PageRenderer.tsx checks:
                if (!hasComponent(type)) {
                  if (!isPreview) return null  // Skip
                  return <UnknownComponent />  // Show error in preview
                }
```

---

## Performance Considerations

### Editor
- **Konva Canvas:** GPU-accelerated rendering
- **HTML Overlays:** Only for complex sections
- **Auto-save debounce:** 3 second delay prevents excessive API calls
- **Component memoization:** React.memo on CanvasComponent

### Storefront
- **ISR Caching:** Pages cached for 1 hour
- **On-demand revalidation:** Immediate when published
- **Server Components:** Zero JS for most components
- **Image optimization:** Next.js Image component

---

## Component Type Distribution

```
Total: 107 types mapped in editor

Sections (full-width):    67 types  ████████████████░░░░░  62%
Freeform (positioned):    28 types  ██████░░░░░░░░░░░░░░░  26%
UI Components:            12 types  ███░░░░░░░░░░░░░░░░░░  11%
                                    ─────────────────────
                                           100%
```

---

## Key Differences: Editor vs Storefront

| Aspect              | Editor                    | Storefront               |
|---------------------|---------------------------|--------------------------|
| **Rendering**       | Konva + React             | React Server Components  |
| **Purpose**         | Visual editing            | Production display       |
| **Data Source**     | `content` (draft)         | `publishedContent`       |
| **Interactivity**   | Drag, resize, edit        | View only (functional)   |
| **Components**      | Simplified previews       | Full implementations     |
| **Performance**     | Canvas-based              | HTML-based, ISR cached   |
| **Layout**          | Absolute positioning      | Responsive flow          |

---

## Quick Reference: File Locations

### Editor Files
```
brandstudio-vite/
├─ src/components/
│  ├─ Editor/
│  │  ├─ Canvas.tsx                    [Konva stage setup]
│  │  ├─ CanvasComponent.tsx          [Component rendering]
│  │  ├─ ComponentRenderer.tsx         [NEW: Non-canvas rendering]
│  │  └─ SectionPreviews/
│  │     ├─ HeaderGlassPreview.tsx
│  │     ├─ HeroGlassPreview.tsx
│  │     └─ ... 30+ previews
│  └─ storefront/
│     └─ index.ts                      [NEW: 107 component mappings]
└─ src/services/
   └─ pageService.ts                   [API integration]
```

### Storefront Files
```
c:\laragon\www\bizcore-v2/
├─ app/
│  ├─ api/pages/[id]/publish/route.ts  [Publish endpoint]
│  └─ storefront/[subdomain]/[slug]/
│     └─ page.tsx                       [Dynamic route]
└─ components/storefront/
   ├─ index.ts                          [131 component mappings]
   ├─ PageRenderer.tsx                  [Renderer logic]
   ├─ HeaderGlass.tsx                   [Implementation]
   ├─ HeroGlass.tsx                     [Implementation]
   └─ ... 38+ components
```

---

## Testing Flow

```
1. CREATE TEST PAGE
   └─ In BrandStudio editor

2. ADD COMPONENTS
   └─ Drag 10+ different types

3. VERIFY EDITOR
   └─ Preview looks correct

4. PUBLISH
   └─ Click Publish button

5. VERIFY STOREFRONT
   └─ Visit /storefront/[subdomain]/[slug]

6. CHECK PROPS
   └─ Ensure props match editor

7. TEST RESPONSIVE
   └─ Check mobile/tablet

8. DOCUMENT ISSUES
   └─ Use STOREFRONT_COMPONENT_TEST_CHECKLIST.md
```

---

**For complete details, see:**
- `COMPONENT_SYNC_STATUS.md` - Component mapping reference
- `COMPONENT_SYNC_SUMMARY.md` - High-level summary
- `STOREFRONT_COMPONENT_TEST_CHECKLIST.md` - Testing guide


