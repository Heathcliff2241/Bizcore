# Storefront Component Test Checklist

**Date:** December 8, 2025  
**Purpose:** Verify end-to-end flow from editor to storefront  
**Status:** 🔄 READY TO TEST

## Test Overview

This checklist ensures that components created in the BrandStudio editor render correctly on the live storefront.

## Pre-Test Setup

### 1. Start Development Server
```bash
cd C:\laragon\www\bizcore-v2
npm run dev
```

### 2. Access BrandStudio
```
http://localhost:3000/dashboard/{your-tenant}/brandstudio?pageId={id}
```

### 3. Create Test Page
- Create a new page called "component-test"
- Slug: `component-test`
- Purpose: Test all component types

---

## Component Test Matrix

### ✅ Critical Components (Must Test Before Deployment)

#### 1. Header Components
- [ ] **header-glass**
  - Drag onto canvas
  - Set background color
  - Set logo text
  - Add navigation links
  - **Expected:** Glass header with blur effect
  - **Storefront URL:** `/storefront/{subdomain}/component-test`

- [ ] **header-default**
  - Drag onto canvas
  - Configure colors
  - **Expected:** Standard header section

#### 2. Hero Components
- [ ] **hero-glass**
  - Drag onto canvas
  - Set heading: "Welcome to Our Store"
  - Set subheading: "Quality products for everyone"
  - Set CTA button text: "Shop Now"
  - Set background gradient
  - **Expected:** Glass hero with centered content

- [ ] **hero-default**
  - Add image background
  - Configure text alignment
  - **Expected:** Standard hero banner

#### 3. Product Components
- [ ] **product-grid**
  - Drag onto canvas
  - Set columns: 3
  - **Expected:** Grid showing products (or mock products)
  
- [ ] **product-carousel**
  - Drag onto canvas
  - Set items to show: 4
  - **Expected:** Carousel with navigation

#### 4. CTA Components
- [ ] **cta-glass**
  - Set heading: "Ready to get started?"
  - Set button text: "Sign Up Now"
  - Set background color
  - **Expected:** Call-to-action section with glass effect

- [ ] **cta-banner**
  - Configure colors
  - **Expected:** Full-width CTA banner

#### 5. Footer Components
- [ ] **footer-glass**
  - Set copyright text
  - Add social links
  - **Expected:** Glass footer at bottom

- [ ] **footer-default**
  - Configure columns
  - **Expected:** Standard footer section

#### 6. Freeform Components
- [ ] **text (FreeformText)**
  - Drag onto canvas
  - Type: "This is test text"
  - Change font size: 24px
  - Change color: #000000
  - **Expected:** Text at exact position

- [ ] **image (FreeformImage)**
  - Drag onto canvas
  - Upload/set image URL
  - Resize
  - **Expected:** Image at exact position with correct size

- [ ] **button (FreeformButton)**
  - Drag onto canvas
  - Set text: "Click Me"
  - Set background color: #3b82f6
  - **Expected:** Button at exact position

- [ ] **rectangle (RectangleShape)**
  - Drag onto canvas
  - Set fill color
  - Set corner radius
  - **Expected:** Rectangle shape

- [ ] **circle (CircleShape)**
  - Drag onto canvas
  - Set fill color
  - **Expected:** Perfect circle

- [ ] **line (LineShape)**
  - Drag onto canvas
  - Set stroke color
  - Set width
  - **Expected:** Horizontal line

#### 7. shadcn/ui Components
- [ ] **shadcn-button**
  - Drag onto canvas
  - Configure variant
  - **Expected:** Styled button

- [ ] **shadcn-card**
  - Drag onto canvas
  - Set title and content
  - **Expected:** Card component

- [ ] **shadcn-input**
  - Drag onto canvas
  - Set placeholder
  - **Expected:** Input field

---

## Testing Workflow

### For Each Component:

#### Step 1: Editor Test
1. Open component palette (left panel)
2. Find component in category
3. Drag onto canvas
4. **Verify:** Component appears as expected (not gray box)
5. Click component to select
6. **Verify:** Properties panel shows on right
7. Modify 2-3 properties
8. **Verify:** Changes reflect in preview

#### Step 2: Save Test
1. Wait 3 seconds (auto-save)
2. **Verify:** "Saved" indicator appears in toolbar
3. Or click "Save" button manually
4. **Verify:** No error toast

#### Step 3: Publish Test
1. Click "Publish" button in toolbar
2. Confirm dialog
3. **Verify:** "Published successfully! 🚀" toast
4. **Verify:** No console errors

#### Step 4: Storefront Test
1. Open new tab
2. Navigate to: `http://localhost:3000/storefront/{subdomain}/component-test`
3. **Verify:** Page loads without errors
4. **Verify:** Component renders correctly
5. **Verify:** Properties match what was set in editor
6. **Verify:** No layout issues (overlapping, wrong position)

---

## Critical Scenarios

### Scenario 1: Full-Page Layout
**Components to use:**
1. header-glass (at top)
2. hero-glass (below header)
3. product-grid (3 columns)
4. cta-glass
5. footer-glass (at bottom)

**Expected Result:**
- All sections stack vertically
- No gaps or overlaps
- Full-width sections span entire page
- Footer at bottom

### Scenario 2: Freeform Positioning
**Components to use:**
1. blank section (as background)
2. FreeformText (position: 100, 100)
3. FreeformImage (position: 400, 100)
4. FreeformButton (position: 100, 300)

**Expected Result:**
- All components appear at exact pixel positions
- No automatic stacking
- Components can overlap if positioned that way

### Scenario 3: Mixed Layout
**Components to use:**
1. header-glass (section)
2. FreeformText inside blank section
3. product-grid (section)
4. footer-glass (section)

**Expected Result:**
- Sections are full-width and stack
- Freeform text appears within blank section at set position

---

## Property Mapping Test

### Test that props transfer correctly from editor to storefront:

#### Text Properties
- [ ] Font family changes
- [ ] Font size changes
- [ ] Color changes
- [ ] Text alignment changes

#### Size Properties
- [ ] Width changes
- [ ] Height changes (for sections)
- [ ] Maintains aspect ratio (for images)

#### Color Properties
- [ ] Background color changes
- [ ] Text color changes
- [ ] Border color changes

#### Layout Properties
- [ ] Position (x, y) for freeform
- [ ] zIndex (stacking order)
- [ ] Rotation (if applicable)

---

## Known Issues to Document

### If you encounter issues, document here:

| Component | Issue | Editor Behavior | Storefront Behavior | Severity |
|-----------|-------|-----------------|---------------------|----------|
| _Example: hero-glass_ | _Background not showing_ | _Shows gradient_ | _Shows white_ | _High_ |
|  |  |  |  |  |
|  |  |  |  |  |

---

## Performance Test

### Page Load
- [ ] Page loads in < 3 seconds
- [ ] No console errors
- [ ] No 404s for assets
- [ ] Images load correctly

### Interactivity
- [ ] Buttons are clickable (if functional)
- [ ] Links work (if set)
- [ ] Forms show correctly (even if non-functional)

---

## Browser Compatibility

Test on multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

---

## Mobile Responsiveness

### Desktop (1920x1080)
- [ ] All components visible
- [ ] No horizontal scroll
- [ ] Proper spacing

### Tablet (768px)
- [ ] Sections resize appropriately
- [ ] Text remains readable
- [ ] No layout breaks

### Mobile (375px)
- [ ] Sections stack correctly
- [ ] Text size appropriate
- [ ] Touch targets large enough

---

## Data Persistence Test

### Scenario: Edit Published Page
1. Create page with 5 components
2. Publish
3. Verify on storefront
4. Go back to editor
5. Modify 2 components
6. Publish again
7. **Verify:** Storefront updates with changes
8. **Verify:** ISR revalidation works (may take up to 1 hour or immediate with on-demand revalidation)

---

## Error Handling Test

### Scenario: Missing Component Type
1. In browser console, check for: `Unknown component: {type}`
2. **Expected:** Gracefully shows fallback or skips

### Scenario: Invalid Props
1. Set invalid color (e.g., "not-a-color")
2. **Expected:** Uses default color, no crash

### Scenario: Missing Image
1. Set image URL to broken link
2. **Expected:** Shows placeholder, no error

---

## Deployment Readiness Checklist

### Before deploying to production:

- [ ] All critical components tested ✅
- [ ] No console errors in editor
- [ ] No console errors on storefront
- [ ] At least 3 different page layouts created and published
- [ ] Props map correctly for all tested components
- [ ] Performance acceptable (< 3s page load)
- [ ] Known issues documented (if any)
- [ ] Rollback plan in place

---

## Test Results Summary

**Date Tested:** ________________  
**Tester:** ________________  
**Total Components Tested:** _____ / 107  
**Critical Components Passed:** _____ / 16  
**Issues Found:** _____  
**Severity:**
- High: _____
- Medium: _____
- Low: _____

**Overall Status:** 
- [ ] ✅ READY FOR DEPLOYMENT
- [ ] ⚠️ DEPLOY WITH CAUTION (document issues)
- [ ] ❌ NOT READY (critical issues found)

---

## Quick Test Commands

### Create test page via API
```bash
curl -X POST http://localhost:3000/api/pages \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "1",
    "slug": "component-test",
    "title": "Component Test Page",
    "content": [],
    "template": "blank",
    "isDraft": true
  }'
```

### Publish page via API
```bash
curl -X POST http://localhost:3000/api/pages/{pageId}/publish \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": 1
  }'
```

### Check published page
```bash
curl http://localhost:3000/storefront/{subdomain}/component-test
```

---

## Notes

- Test incrementally - don't try all 107 components at once
- Focus on critical components first (headers, heroes, products, CTA, footer)
- Document any unexpected behavior
- Take screenshots of issues for debugging
- Check browser console for errors after each test

---

**Good luck testing! 🚀**


