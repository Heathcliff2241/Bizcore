# Quick Start: Using the Storefront System

## For Users (Creating & Publishing Pages)

### 1. Design Your Page

1. Navigate to BrandStudio editor:

   ```text
   http://localhost:3000/dashboard/{your-tenant}/brandstudio?pageId={id}
   ```

2. Drag components from the left panel onto the canvas:
   - **Hero Section** - Banner at top of page
   - **Product Grid** - Display products
   - **Text Block** - Add rich text content
   - **CTA Section** - Call-to-action buttons
   - **Newsletter** - Email signup
   - **Testimonials** - Customer reviews
   - **Footer** - Site footer

3. Configure each component in the right panel:
   - Colors, text, images
   - Layout options
   - Spacing and sizing

4. Auto-save happens every 3 seconds
   - Or press Ctrl+S (Cmd+S on Mac) to save manually

### 2. Publish Your Page

1. Click the **Publish** button in the toolbar (top center)
2. Confirm in the dialog
3. Wait for "Published successfully! 🚀" message

### 3. View Your Live Page

Your page is now live at:

```
http://localhost:3000/storefront/{your-tenant}/{page-slug}
```

Example:

```
http://localhost:3000/storefront/nuvem/home
http://localhost:3000/storefront/nuvem/about
```

### 4. Make Updates

1. Return to the editor
2. Make your changes
3. Click **Publish** again
4. Changes appear on the storefront immediately (thanks to ISR revalidation)

---

## For Developers (Technical Reference)

### Component Types Available

All 29 component types that can be used:

**Hero Variants:**

- `hero-default` - Full-width hero with centered content
- `hero-split` - Hero with image on one side
- `hero-minimal` - Simple hero with minimal styling
- `hero-video` - Hero with video background (uses HeroSection)

**Product Displays:**

- `product-grid` - Grid layout for products
- `product-carousel` - Carousel/slider (uses ProductGrid)
- `product-featured` - Featured products (uses ProductGrid)
- `product-categories` - Category grid (uses ProductGrid)

**Content Blocks:**

- `text-block` - Rich text from Draft.js
- `image-block` - Responsive images
- `button-block` - Standalone buttons
- `spacer-block` - Vertical spacing
- `divider-block` - Horizontal dividers

**Sections:**

- `cta-default` - Call-to-action section
- `cta-split` - Split CTA (uses CTASection)
- `newsletter-default` - Newsletter signup
- `testimonials-carousel` - Testimonial carousel
- `testimonials-grid` - Testimonial grid

**Layout:**

- `footer-default` - Full footer
- `footer-minimal` - Minimal footer (uses FooterSection)

**Placeholders (to be implemented):**

- `cart-summary`
- `checkout-form`
- `contact-form`
- `faq-accordion`
- `pricing-table`
- `team-grid`
- `logo-cloud`

### Adding a New Component

1. **Create Component File:**

   ```typescript
   // components/storefront/MyNewComponent.tsx
   interface MyNewComponentProps {
     title?: string
     description?: string
   }

   export function MyNewComponent({ 
     title = 'Default Title',
     description 
   }: MyNewComponentProps) {
     return (
       <section className="py-16 px-4">
         <div className="container mx-auto">
           <h2>{title}</h2>
           {description && <p>{description}</p>}
         </div>
       </section>
     )
   }
   ```

2. **Add to Component Map:**

   ```typescript
   // components/storefront/index.ts
   import { MyNewComponent } from './MyNewComponent'

   export const componentMap = {
     // ... existing mappings
     'my-new-component': MyNewComponent
   }

   export { MyNewComponent }
   ```

3. **Add to BrandStudio Library:**

   ```typescript
   // brandstudio-vite/src/lib/componentLibrary.ts
   {
     id: 'my-new-component-1',
     type: 'my-new-component',
     name: 'My New Component',
     category: 'Content',
     thumbnail: '/thumbnails/my-new-component.png',
     props: {
       title: 'My New Component',
       description: 'This is a description'
     },
     // ... standard component fields
   }
   ```

4. **Test:**
   - Drag from palette in editor
   - Configure properties
   - Save and publish
   - View on storefront

### API Endpoints

#### Get Page

```typescript
GET /api/pages/:id
```

Returns page with content, seoSettings, and revisions.

#### Save Page

```typescript
PUT /api/pages/:id
Body: {
  content: ComponentData[],
  isDraft: boolean
}
```

Creates a revision and updates the page.

#### Publish Page

```typescript
POST /api/pages/:id/publish
Body: {
  tenantId: number
}
```

- Copies `content` to `publishedContent`
- Sets `isPublished = true`, `isDraft = false`
- Records `publishedAt` timestamp
- Triggers ISR revalidation

### ISR Configuration

Pages revalidate in two ways:

1. **Time-based (automatic):**

   ```typescript
   export const revalidate = 3600 // 1 hour
   ```

2. **On-demand (when publishing):**

   ```typescript
   revalidatePath(`/storefront/${subdomain}/${slug}`)
   ```

To adjust revalidation time, edit `page.tsx`:

```typescript
export const revalidate = 300 // 5 minutes
```

### SEO Customization

SEO is managed in the `SeoSettings` model. To customize:

1. Create/update seoSettings for a page
2. Fields used:
   - `metaTitle` - Page title
   - `metaDescription` - Description
   - `metaKeywords` - Keywords (optional)
   - `ogImage` - Social media preview image
   - `twitterCard` - Twitter card type
   - `canonicalUrl` - Canonical URL (optional)

3. Metadata is automatically generated in `generateMetadata()`

### Performance Tips

1. **Use Server Components** (default)
   - No JavaScript sent to client
   - Faster initial load

2. **Client Components only when needed:**

   ```typescript
   'use client'  // Only add for interactive components
   ```

3. **Optimize images:**

   ```typescript
   import Image from 'next/image'
   
   <Image
     src="/path/to/image.jpg"
     alt="Description"
     width={800}
     height={600}
     priority  // For above-the-fold images
   />
   ```

4. **Cache database queries:**

   ```typescript
   import { unstable_cache } from 'next/cache'
   
   const getCachedPage = unstable_cache(
     async (slug: string) => {
       return prisma.pageDesign.findFirst({ where: { slug } })
     },
     ['page-by-slug'],
     { revalidate: 3600 }
   )
   ```

### Troubleshooting

#### Components not rendering?

1. Check browser console for errors
2. Verify component type exists in `componentMap`
3. Check if component is marked as `hidden: true`
4. Ensure page is published (`isPublished: true`)

#### Changes not appearing after publish?

1. Check server logs for revalidation errors
2. Hard refresh browser (Ctrl+Shift+R)
3. Verify correct subdomain and slug in URL
4. Check if page has `publishedContent` (not just `content`)

#### SEO tags missing?

1. View page source (not browser inspector)
2. Ensure `generateMetadata()` is being called
3. Check if `seoSettings` record exists
4. Verify using Server Components (not Client Components)

#### 404 errors?

1. Verify page exists in database
2. Check `isPublished = true`
3. Confirm subdomain matches tenant
4. Verify slug is correct (case-sensitive)

---

## Environment Setup

### Required Environment Variables

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### Development Commands

```bash
# Start Next.js dev server
npm run dev

# Start Vite dev server (for BrandStudio)
cd brandstudio-vite
npm run dev

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database
npx prisma db seed
```

### Production Deployment

1. Build both applications:

   ```bash
   npm run build
   cd brandstudio-vite && npm run build
   ```

2. Configure ISR in your hosting platform
3. Set up CDN for static assets
4. Configure custom domains (optional)

---

## URL Patterns

### Editor URLs (Authenticated)

```
/dashboard/{subdomain}/brandstudio?pageId={id}
```

### Storefront URLs (Public)

```
/storefront/{subdomain}              # Home page
/storefront/{subdomain}/{slug}       # Specific page
```

### Future: Custom Domains

With Next.js middleware:

```
https://{tenant-domain}.com          # Home page
https://{tenant-domain}.com/{slug}   # Specific page
```

---

## What's Next?

Phase 6 is complete! Consider:

1. **Test the full workflow** - Design → Publish → View
2. **Add more components** - Build custom sections
3. **Customize styling** - Adjust colors, fonts, layouts
4. **Implement Phase 7** - Advanced features (responsive, A/B testing, analytics)
5. **Add custom domains** - Let tenants use their own domains
6. **Build preview mode** - View drafts without publishing

---

## Need Help?

- Check `PHASE_6_COMPLETE.md` for detailed documentation
- Review component source code in `components/storefront/`
- Inspect `PageRenderer.tsx` to understand rendering logic
- Examine API routes in `app/api/pages/`

Happy building! 🚀
