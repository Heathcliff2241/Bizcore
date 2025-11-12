# 🍎 BrandStudio - Apple-Graded eCommerce Builder Phases

## Overview

A premium eCommerce site builder designed with Apple's philosophy: elegant simplicity, powerful capabilities, seamless integration, and pixel-perfect UX. Tenants create fully customizable storefronts that are published to their subdomain and saved in the database for instant hydration.

---

## 📊 Current State Analysis

### Existing Stack

- **Frontend**: React 18 + TypeScript (Vite SPA)
- **Animation**: Framer Motion
- **Styling**: Tailwind CSS
- **Drag & Drop**: react-rnd (basic positioning)
- **Canvas**: None (needs Konva integration)
- **State Management**: React Context (needs replacement)
- **Text Editing**: None (needs Draft.js or Slate)
- **Forms**: None (needs refinement)
- **Backend**: Next.js 15 + Prisma ORM + PostgreSQL
- **Auth**: NextAuth.js with multi-tenant support

### Existing Structures

- ✅ Multi-tenant database schema with Tenant, Product, Category, Customer, Order models
- ✅ Page & PageRevision models for content storage
- ✅ Tenant subdomain routing (`/dashboard/[subdomain]`)
- ✅ API endpoints for products, orders, settings
- ⚠️ BrandStudio component tree needs architectural overhaul
- ⚠️ No ecommerce-specific page builder components
- ⚠️ No state persistence layer

---

## 🎯 Phase Breakdown

### **PHASE 1: Foundation & Architecture (Weeks 1-2)**

#### 1.1 Enhanced Prisma Schema

Add new models for storing storefront designs and page layouts:

```prisma
model PageDesign {
  id                Int       @id @default(autoincrement())
  tenantId          Int
  tenant            Tenant    @relation(fields: [tenantId], references: [id])
  slug              String
  title             String
  description       String?
  content           Json      // Serialized page layout
  publishedContent  Json?     // Currently published version
  template          String    // "homepage", "product", "category", "collection"
  isPublished       Boolean   @default(false)
  isDraft           Boolean   @default(true)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @default(now())
  publishedAt       DateTime?
  revisions         PageRevision[]
  seoSettings       SeoSettings?

  @@unique([tenantId, slug])
  @@index([tenantId])
  @@index([isPublished])
  @@map("page_designs")
}

model PageRevision {
  id                Int       @id @default(autoincrement())
  pageDesignId      Int
  pageDesign        PageDesign @relation(fields: [pageDesignId], references: [id])
  content           Json
  revisionNumber    Int
  changeDescription String?
  createdAt         DateTime  @default(now())
  createdBy         Int?
  user              User?     @relation(fields: [createdBy], references: [id])

  @@index([pageDesignId])
  @@map("page_revisions")
}

model SeoSettings {
  id                Int       @id @default(autoincrement())
  pageDesignId      Int       @unique
  pageDesign        PageDesign @relation(fields: [pageDesignId], references: [id])
  metaTitle         String
  metaDescription   String
  metaKeywords      String?
  ogImage           String?
  twitterCard       String?
  canonicalUrl      String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @default(now())

  @@map("seo_settings")
}

model PageComponent {
  id                Int       @id @default(autoincrement())
  pageDesignId      Int
  pageDesign        PageDesign @relation(fields: [pageDesignId], references: [id])
  componentType     String    // "hero", "product-grid", "cta", "testimonials", etc.
  props             Json      // Component-specific properties
  position          Int       // Z-order
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @default(now())

  @@index([pageDesignId])
  @@map("page_components")
}

model StorefrontSettings {
  id                Int       @id @default(autoincrement())
  tenantId          Int       @unique
  tenant            Tenant    @relation(fields: [tenantId], references: [id])
  colorScheme       Json      // Primary, secondary, accent colors
  typography        Json      // Font families, sizes
  brandAssets       Json      // Logo, favicon, banner URLs
  seoDefaults       Json      // Default meta tags
  socialLinks       Json      // Social media URLs
  paymentMethods    Json      // Stripe, PayPal configs
  shippingSettings  Json      // Zones, rates
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @default(now())

  @@index([tenantId])
  @@map("storefront_settings")
}
```

#### 1.2 Dependencies to Install

**BrandStudio Vite Project** (`brandstudio-vite/package.json`):

```json
{
  "dependencies": {
    "zustand": "^4.5.0",
    "konva": "^9.2.0",
    "react-konva": "^18.2.10",
    "fabric": "^5.3.0",
    "draft-js": "^0.11.7",
    "draftjs-to-html": "^0.9.1",
    "html-to-draftjs": "^1.0.0",
    "@draftjs-plugins/editor": "^4.1.3",
    "@draftjs-plugins/image": "^4.1.2",
    "uuid": "^9.0.0",
    "lodash-es": "^4.17.21",
    "immer": "^10.0.0",
    "react-beautiful-dnd": "^13.1.1",
    "react-color": "^2.19.3",
    "react-icons": "^5.5.0",
    "react-hot-toast": "^2.4.1",
    "axios": "^1.6.0",
    "pinia": "^2.1.6",
    "qs": "^6.11.0"
  },
  "devDependencies": {
    "@types/draft-js": "^0.11.17",
    "@types/fabric": "^5.3.0",
    "@types/react-beautiful-dnd": "^13.1.5"
  }
}
```

**Next.js Main Project** (add to existing):

```bash
npm install @tailwindcss/forms @tailwindcss/typography class-variance-authority clsx tailwind-merge
```

#### 1.3 Project Structure

```plaintext
brandstudio-vite/src/
├── store/
│   ├── useDesignStore.ts         # Zustand for design state
│   ├── usePageStore.ts           # Page management
│   ├── useHistoryStore.ts        # Undo/redo
│   └── useUIStore.ts             # UI state (panels, tools)
├── hooks/
│   ├── useCanvas.ts              # Konva canvas management
│   ├── useTextEditor.ts          # Draft.js integration
│   ├── useComponentLibrary.ts    # Reusable components
│   └── useAutoSave.ts            # Auto-save to database
├── components/
│   ├── Editor/
│   │   ├── Canvas.tsx            # Konva + Fabric.js layer
│   │   ├── Toolbar.tsx           # Top toolbar
│   │   ├── LeftPanel.tsx         # Layers panel
│   │   └── RightPanel.tsx        # Properties panel
│   ├── ComponentPalette/
│   │   ├── HeroSection.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── Testimonials.tsx
│   │   ├── CTA.tsx
│   │   ├── Newsletter.tsx
│   │   ├── Footer.tsx
│   │   └── ...more
│   ├── TextEditor/
│   │   ├── RichTextEditor.tsx   # Draft.js editor
│   │   └── TextFormatting.tsx
│   ├── ColorPicker/
│   │   └── AdvancedColorPicker.tsx
│   └── Settings/
│       ├── BrandSettings.tsx
│       ├── SeoSettings.tsx
│       └── PaymentSettings.tsx
├── services/
│   ├── api.ts                    # API client
│   ├── pageService.ts            # Page operations
│   ├── designService.ts          # Design persistence
│   └── publishService.ts         # Publish to tenant
├── types/
│   ├── page.ts
│   ├── component.ts
│   ├── design.ts
│   └── storefront.ts
└── utils/
    ├── serialization.ts          # Convert Konva to JSON
    ├── validators.ts
    ├── constants.ts
    └── colors.ts
```

---

### **PHASE 2: Core Editor with Konva + Fabric.js (Weeks 3-4)**

#### 2.1 Dual Canvas System

**Konva Canvas** (structural layout):

- Grid-based positioning
- Guides and snapping
- Multi-select support
- Rotation/scaling

**Fabric.js Integration** (advanced graphics within components):

- Precise drawing
- Path editing
- Grouping objects
- Advanced transformations

#### 2.2 Canvas Architecture

```typescript
// store/useDesignStore.ts
import create from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface Component {
  id: string
  type: string
  props: Record<string, any>
  position: { x: number; y: number }
  size: { width: number; height: number }
  rotation: number
  zIndex: number
  locked: boolean
  hidden: boolean
}

interface DesignState {
  components: Component[]
  selectedIds: string[]
  clipboard: Component[]
  history: Component[][]
  historyIndex: number
  
  // Actions
  addComponent: (component: Component) => void
  updateComponent: (id: string, updates: Partial<Component>) => void
  deleteComponent: (id: string) => void
  selectComponent: (id: string, multi?: boolean) => void
  copyComponent: (id: string) => void
  pasteComponent: () => void
  undo: () => void
  redo: () => void
  clear: () => void
}

export const useDesignStore = create<DesignState>()(
  immer((set, get) => ({
    components: [],
    selectedIds: [],
    clipboard: [],
    history: [[]],
    historyIndex: 0,

    addComponent: (component) => set((state) => {
      state.components.push(component)
      state.history = state.history.slice(0, state.historyIndex + 1)
      state.history.push([...state.components])
      state.historyIndex++
    }),

    updateComponent: (id, updates) => set((state) => {
      const component = state.components.find(c => c.id === id)
      if (component) {
        Object.assign(component, updates)
        state.history = state.history.slice(0, state.historyIndex + 1)
        state.history.push([...state.components])
        state.historyIndex++
      }
    }),

    deleteComponent: (id) => set((state) => {
      state.components = state.components.filter(c => c.id !== id)
      state.selectedIds = state.selectedIds.filter(sid => sid !== id)
      state.history = state.history.slice(0, state.historyIndex + 1)
      state.history.push([...state.components])
      state.historyIndex++
    }),

    selectComponent: (id, multi = false) => set((state) => {
      if (multi) {
        if (state.selectedIds.includes(id)) {
          state.selectedIds = state.selectedIds.filter(sid => sid !== id)
        } else {
          state.selectedIds.push(id)
        }
      } else {
        state.selectedIds = [id]
      }
    }),

    copyComponent: (id) => set((state) => {
      const component = state.components.find(c => c.id === id)
      if (component) {
        state.clipboard = [component]
      }
    }),

    pasteComponent: () => set((state) => {
      state.clipboard.forEach(original => {
        const newComponent = {
          ...original,
          id: `${original.id}-${Date.now()}`,
          position: { x: original.position.x + 20, y: original.position.y + 20 }
        }
        state.components.push(newComponent)
      })
    }),

    undo: () => set((state) => {
      if (state.historyIndex > 0) {
        state.historyIndex--
        state.components = [...state.history[state.historyIndex]]
        state.selectedIds = []
      }
    }),

    redo: () => set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++
        state.components = [...state.history[state.historyIndex]]
        state.selectedIds = []
      }
    }),

    clear: () => set(() => ({
      components: [],
      selectedIds: [],
      history: [[]],
      historyIndex: 0
    }))
  }))
)
```

#### 2.3 Konva Canvas Component

```typescript
// components/Editor/Canvas.tsx
import { useState, useRef, useEffect } from 'react'
import { Stage, Layer, Group, Rect, Image as KonvaImage } from 'react-konva'
import { useDesignStore } from '@/store/useDesignStore'
import CanvasComponent from './CanvasComponent'

export function Canvas() {
  const { components, selectComponent, updateComponent } = useDesignStore()
  const stageRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  // Grid background
  const renderGrid = () => {
    const gridSize = 20
    const lines = []
    
    for (let i = 0; i < 100; i++) {
      for (let j = 0; j < 100; j++) {
        lines.push(
          <Rect
            key={`grid-${i}-${j}`}
            x={i * gridSize}
            y={j * gridSize}
            width={gridSize}
            height={gridSize}
            stroke="#e5e7eb"
            strokeWidth={0.5}
          />
        )
      }
    }
    return lines
  }

  const handleWheel = (e: any) => {
    e.evt.preventDefault()
    const scaleBy = 1.1
    const stage = stageRef.current
    if (!stage) return

    const oldScale = scale
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
    
    setScale(Math.max(0.1, Math.min(newScale, 5)))
  }

  return (
    <div className="w-full h-full bg-white overflow-hidden">
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onWheel={handleWheel}
        draggable
        onDragEnd={(e) => setPosition({ x: e.target.x(), y: e.target.y() })}
      >
        <Layer>
          {/* Grid background */}
          <Group>{renderGrid()}</Group>
          
          {/* Components */}
          {components.map((component) => (
            <CanvasComponent
              key={component.id}
              component={component}
              onSelect={() => selectComponent(component.id)}
              onUpdate={(updates) => updateComponent(component.id, updates)}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  )
}
```

---

### **PHASE 3: Rich Text Editor Integration (Week 5)**

#### 3.1 Draft.js Integration

```typescript
// components/TextEditor/RichTextEditor.tsx
import { useState } from 'react'
import { Editor, EditorState, RichUtils, getDefaultKeyBinding, KeyBindingUtil } from 'draft-js'
import { stateToHTML } from 'draftjs-to-html'
import { htmlToDraft } from 'html-to-draftjs'
import 'draft-js/lib/Draft.css'

const { hasCommandModifier } = KeyBindingUtil

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [editorState, setEditorState] = useState(() => {
    const contentBlock = htmlToDraft(value || '')
    const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks)
    return EditorState.createWithContent(contentState)
  })

  const handleChange = (state: EditorState) => {
    setEditorState(state)
    const html = stateToHTML(state.getCurrentContent())
    onChange(html)
  }

  const handleKeyCommand = (command: string, state: EditorState) => {
    const newState = RichUtils.handleKeyCommand(state, command)
    if (newState) {
      handleChange(newState)
      return 'handled'
    }
    return 'not-handled'
  }

  const handleBeforeInput = (chars: string, state: EditorState) => {
    const newState = RichUtils.handleBeforeInput(chars, state)
    if (newState) {
      handleChange(newState)
      return 'handled'
    }
    return 'not-handled'
  }

  const toggleBlockType = (blockType: string) => {
    handleChange(RichUtils.toggleBlockType(editorState, blockType))
  }

  const toggleInlineStyle = (inlineStyle: string) => {
    handleChange(RichUtils.toggleInlineStyle(editorState, inlineStyle))
  }

  return (
    <div className="border rounded-lg bg-white">
      <div className="flex gap-1 p-2 border-b bg-gray-50">
        {/* Block type buttons */}
        {['H1', 'H2', 'H3', 'BLOCKQUOTE'].map((type) => (
          <button
            key={type}
            onClick={() => toggleBlockType(type)}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-200"
          >
            {type}
          </button>
        ))}
        
        {/* Inline style buttons */}
        {['BOLD', 'ITALIC', 'UNDERLINE'].map((style) => (
          <button
            key={style}
            onClick={() => toggleInlineStyle(style)}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-200"
          >
            {style}
          </button>
        ))}
      </div>

      <div className="p-4 min-h-[300px]">
        <Editor
          editorState={editorState}
          onChange={handleChange}
          onTab={(e) => {
            const newState = RichUtils.onTab(e, editorState, 4)
            if (newState) handleChange(newState)
          }}
          handleKeyCommand={handleKeyCommand}
          handleBeforeInput={handleBeforeInput}
          placeholder={placeholder || 'Write your content...'}
          spellCheck
        />
      </div>
    </div>
  )
}
```

---

### **PHASE 4: Component Library & Presets (Weeks 6-7)**

#### 4.1 Pre-built eCommerce Components

```typescript
// components/ComponentPalette/index.ts
export const COMPONENT_LIBRARY = {
  sections: [
    {
      name: 'Hero',
      components: [
        {
          id: 'hero-default',
          name: 'Hero Default',
          type: 'hero',
          thumbnail: '/templates/hero-1.jpg',
          defaultProps: {
            heading: 'Welcome to Your Store',
            subheading: 'Premium products crafted with care',
            ctaText: 'Shop Now',
            backgroundImage: '/images/hero-bg.jpg',
            height: 600,
            textColor: '#ffffff',
            alignment: 'center'
          }
        },
        {
          id: 'hero-split',
          name: 'Hero Split',
          type: 'hero',
          thumbnail: '/templates/hero-2.jpg',
          defaultProps: {
            heading: 'Our Collection',
            subheading: 'Discover excellence',
            image: '/images/collection.jpg',
            layout: 'split',
            height: 600
          }
        }
      ]
    },
    {
      name: 'Products',
      components: [
        {
          id: 'product-grid',
          name: 'Product Grid',
          type: 'product-grid',
          thumbnail: '/templates/grid-1.jpg',
          defaultProps: {
            columns: 3,
            rows: 2,
            spacing: 24,
            showPrice: true,
            showRating: true,
            hoverEffect: 'lift'
          }
        },
        {
          id: 'product-carousel',
          name: 'Product Carousel',
          type: 'product-carousel',
          thumbnail: '/templates/carousel-1.jpg',
          defaultProps: {
            itemsToShow: 4,
            autoPlay: true,
            interval: 5000
          }
        }
      ]
    },
    {
      name: 'CTA & Conversion',
      components: [
        {
          id: 'newsletter',
          name: 'Newsletter',
          type: 'newsletter',
          thumbnail: '/templates/newsletter-1.jpg',
          defaultProps: {
            heading: 'Join Our Community',
            subheading: 'Get exclusive offers',
            buttonText: 'Subscribe'
          }
        },
        {
          id: 'cta-banner',
          name: 'CTA Banner',
          type: 'cta',
          thumbnail: '/templates/cta-1.jpg'
        }
      ]
    }
  ]
}

// Drag & drop from palette
export function ComponentPalette() {
  const { addComponent } = useDesignStore()

  const handleDragStart = (component: any) => (e: DragEvent) => {
    e.dataTransfer!.effectAllowed = 'copy'
    e.dataTransfer!.setData('component', JSON.stringify(component))
  }

  return (
    <div className="p-4 space-y-6 max-h-screen overflow-y-auto">
      {COMPONENT_LIBRARY.sections.map((section) => (
        <div key={section.name}>
          <h3 className="text-sm font-semibold mb-3">{section.name}</h3>
          <div className="grid grid-cols-2 gap-3">
            {section.components.map((comp) => (
              <div
                key={comp.id}
                draggable
                onDragStart={handleDragStart(comp)}
                className="p-3 border rounded-lg cursor-move hover:shadow-md transition-shadow"
              >
                <img
                  src={comp.thumbnail}
                  alt={comp.name}
                  className="w-full h-24 object-cover rounded mb-2"
                />
                <p className="text-xs font-medium">{comp.name}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

#### 4.2 Component Presets

Create pre-designed sections:

- Hero sections (10+ variations)
- Product grids (5+ layouts)
- Testimonial sections
- Newsletter signups
- Trust badges
- Social proof
- Footers (5+ designs)

---

### **PHASE 5: Auto-Save & Persistence (Week 8)**

#### 5.1 Auto-Save Hook

```typescript
// hooks/useAutoSave.ts
import { useEffect, useRef } from 'react'
import { useDesignStore } from '@/store/useDesignStore'

export function useAutoSave(pageId: string, tenantId: string) {
  const { components } = useDesignStore()
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastSaveRef = useRef<string>('')

  useEffect(() => {
    clearTimeout(timeoutRef.current)

    const currentState = JSON.stringify(components)
    if (currentState === lastSaveRef.current) return

    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/pages/${pageId}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId,
            content: components,
            isDraft: true,
            autosaved: true
          })
        })

        if (response.ok) {
          lastSaveRef.current = currentState
          console.log('Auto-saved')
        }
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, 3000) // Save after 3 seconds of inactivity

    return () => clearTimeout(timeoutRef.current)
  }, [components, pageId, tenantId])
}
```

#### 5.2 API Endpoints

```typescript
// app/api/pages/[id]/save - POST
// Save draft or publish page design
// Save revisions for undo history

// app/api/pages/[id]/publish - POST
// Create PageRevision
// Update publishedContent
// Hydrate tenant storefront

// app/api/pages/[id]/revisions - GET
// Return revision history
```

---

### **PHASE 6: Publishing & Storefront Hydration (Weeks 9-10)**

#### 6.1 Publish System

```typescript
// services/publishService.ts
export async function publishPage(pageId: string, tenantId: string) {
  try {
    // 1. Get published content from PageDesign
    const response = await fetch(`/api/pages/${pageId}/publish`, {
      method: 'POST',
      body: JSON.stringify({ tenantId })
    })

    const { pageData } = await response.json()

    // 2. Hydrate storefront pages
    await hydrateStorefront(tenantId, pageData)

    // 3. Generate sitemap & SEO
    await generateSitemap(tenantId)

    return { success: true }
  } catch (error) {
    console.error('Publish failed:', error)
    throw error
  }
}

async function hydrateStorefront(tenantId: string, pageData: any) {
  // Render React components on tenant subdomain
  // Use Next.js dynamic rendering
  // Cache for performance
  // Update CDN
}
```

#### 6.2 Tenant Storefront Template

```typescript
// app/storefront/[subdomain]/page.tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageRenderer } from '@/components/storefront/PageRenderer'

export async function generateStaticParams() {
  const tenants = await prisma.tenant.findMany({
    select: { subdomain: true }
  })
  return tenants.map(t => ({ subdomain: t.subdomain }))
}

export async function generateMetadata({ params }: { params: { subdomain: string } }) {
  const pageDesign = await prisma.pageDesign.findFirst({
    where: {
      tenant: { subdomain: params.subdomain },
      slug: 'home',
      isPublished: true
    },
    include: { seoSettings: true }
  })

  if (!pageDesign?.seoSettings) return {}

  return {
    title: pageDesign.seoSettings.metaTitle,
    description: pageDesign.seoSettings.metaDescription,
    keywords: pageDesign.seoSettings.metaKeywords
  }
}

export default async function StorefrontPage({
  params
}: {
  params: { subdomain: string }
}) {
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: params.subdomain },
    include: { settings: true }
  })

  if (!tenant) notFound()

  const pageDesign = await prisma.pageDesign.findFirst({
    where: {
      tenantId: tenant.id,
      slug: 'home',
      isPublished: true
    }
  })

  if (!pageDesign?.publishedContent) notFound()

  return (
    <PageRenderer
      components={pageDesign.publishedContent as any}
      storefront={tenant}
    />
  )
}
```

#### 6.3 Component Renderer

```typescript
// components/storefront/PageRenderer.tsx
import { dynamicComponentMap } from './components'

export function PageRenderer({ components, storefront }: any) {
  return (
    <div className="w-full">
      {components.map((component: any) => {
        const Component = dynamicComponentMap[component.type]
        if (!Component) return null

        return (
          <div key={component.id} style={{ zIndex: component.zIndex }}>
            <Component
              props={component.props}
              storefront={storefront}
            />
          </div>
        )
      })}
    </div>
  )
}

export const dynamicComponentMap = {
  hero: HeroSection,
  'product-grid': ProductGrid,
  newsletter: NewsletterSection,
  testimonials: TestimonialsSection,
  cta: CTASection,
  footer: FooterSection,
  // ... more components
}
```

---

### **PHASE 7: Advanced Features (Weeks 11-12)**

#### 7.1 Responsive Design System

- Mobile/tablet/desktop previews
- Breakpoint management
- Responsive props
- Mobile-first design

#### 7.2 A/B Testing

- Multiple page variants
- Traffic splitting
- Analytics integration
- Conversion tracking

#### 7.3 Advanced Customization

- Custom CSS injection
- JavaScript blocks
- Webhooks
- Custom domains
- SSL certificates

#### 7.4 eCommerce Integrations

- Stripe/PayPal payment processing
- Inventory sync
- Order notifications
- Cart persistence
- Coupon/discount system

#### 7.5 Analytics & Insights

- Page performance metrics
- Visitor tracking
- Conversion funnels
- Heatmaps
- User behavior

---

## 🔌 Dependencies Summary

### BrandStudio Vite (`npm install` in brandstudio-vite/)

```bash
npm install \
  zustand@^4.5.0 \
  konva@^9.2.0 \
  react-konva@^18.2.10 \
  fabric@^5.3.0 \
  draft-js@^0.11.7 \
  draftjs-to-html@^0.9.1 \
  html-to-draftjs@^1.0.0 \
  @draftjs-plugins/editor@^4.1.3 \
  uuid@^9.0.0 \
  lodash-es@^4.17.21 \
  immer@^10.0.0 \
  react-beautiful-dnd@^13.1.1 \
  react-color@^2.19.3 \
  react-hot-toast@^2.4.1 \
  axios@^1.6.0 \
  qs@^6.11.0 \
  lz-string@^1.5.0
```

### Next.js Main Project (`npm install` in root)

```bash
npm install \
  @tailwindcss/forms \
  @tailwindcss/typography \
  class-variance-authority \
  clsx \
  tailwind-merge
```

---

## 📊 Database Schema Summary

| Model | Purpose |
|-------|---------|
| `PageDesign` | Store tenant's page designs |
| `PageRevision` | Version history of pages |
| `PageComponent` | Individual components on pages |
| `SeoSettings` | SEO metadata per page |
| `StorefrontSettings` | Global storefront configuration |

---

## 🚀 Implementation Roadmap

| Week | Phase | Deliverable |
|------|-------|-------------|
| 1-2 | Foundation | Schema, store structure, project setup |
| 3-4 | Canvas | Konva integration, drag-drop, selection |
| 5 | Text | Draft.js, rich text editing |
| 6-7 | Components | 20+ pre-built eCommerce components |
| 8 | Persistence | Auto-save, database integration |
| 9-10 | Publishing | Publish system, storefront hydration |
| 11-12 | Polish | A/B testing, analytics, integrations |

---

## ✨ Apple Design Philosophy Implementation

### Simplicity

- Minimal UI, maximum functionality
- Sensible defaults
- Progressive disclosure

### Responsiveness

- Smooth animations (Framer Motion)
- Instant feedback
- Gesture support

### Visual Hierarchy

- Typography scale (Tailwind)
- Color system
- Spacing rhythm

### Performance

- Lazy loading
- Code splitting
- CDN caching
- ISR (Incremental Static Regeneration)

### Accessibility

- ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast

---

## 📝 Next Steps

1. **Week 1**: Run `npm install` for dependencies, migrate Prisma schema
2. **Week 2**: Set up Zustand stores, project structure
3. **Week 3-4**: Implement Konva canvas, drag-drop system
4. **Week 5**: Integrate Draft.js text editor
5. **Continue phases** as outlined

---

## 🎯 Success Metrics

✅ Load time < 3 seconds  
✅ 60 FPS animations  
✅ No console errors  
✅ Mobile responsive  
✅ Full undo/redo support  
✅ Auto-save every 3 seconds  
✅ Publish to live in < 2 seconds  
✅ SEO-friendly output  
✅ Multi-tenant isolation  
✅ Zero data loss  

---

**Created**: October 30, 2025  
**Status**: Phase 1 Planning Complete  
**Last Updated**: [Date]
