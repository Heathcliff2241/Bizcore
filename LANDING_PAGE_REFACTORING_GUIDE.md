# BizCore Landing Page Refactoring Guide

## Overview
Update landing page pricing section from old 3-tier model (₱2,999 / ₱7,999 / Custom) to new customer-focused 3-tier model: **Free Trial (14 days) | Standard Monthly (₱1,999) | Standard Yearly (₱19,999 with savings emphasis)**.

---

## Section-by-Section Refactoring Plan

### ✅ Section 1: Hero Section (Lines ~140-195)
**Status**: Keep mostly, enhance CTA
- ✅ Keep current animation and design
- 🔄 **Update hero CTA text**: 
  - From: "Try it free for 14 days"
  - To: "Try 14 days free (no credit card)"
- 🔄 **Add badge near pricing**: "Starting at ₱1,999/month"
- Keep alt CTA "See how it works" button

---

### ✅ Section 2: Features Showcase (Lines ~197-330)
**Status**: No changes needed
- ✅ Keep 4 core offerings (Online Ordering, POS, Inventory, Storefront)
- ✅ Keep feature details expansion mechanic
- ✅ Keep animations and styling

---

### ✅ Section 3: How It Works (Lines ~332-430)
**Status**: No changes needed
- ✅ Keep 4-step onboarding guide
- ✅ Keep demo stats box
- ✅ Keep dark theme styling

---

### ✅ Section 4: Why People Switch (Lines ~432-470)
**Status**: No changes needed
- ✅ Keep 6 benefits cards with scroll animations
- ✅ Keep parallax effects

---

### ✅ Section 5: CTA Section (Lines ~472-515)
**Status**: Minor enhancement
- 🔄 **Emphasis adjustment**: Make "14 days free" more prominent
- 🔄 **Update benefits grid**: Ensure "14 days free" is listed first
- 🔄 **Keep styling**: Dark gradient background works well

---

### 🔴 Section 6: PRICING SECTION (Lines ~517-600) - MAJOR REFACTOR
**Current problematic pricing:**
```tsx
{[
  {
    name: "Getting Started",
    price: "₱2,999",
    description: "Great for solo owners",
    features: ["Online ordering", "Simple POS", "Inventory basics", "1 staff account", "Email help"]
  },
  {
    name: "Growing",
    price: "₱7,999",
    description: "For growing businesses",
    features: ["Everything in starter", "Better POS features", "Your own store design", "5 staff accounts", "Priority support"],
    highlighted: true
  },
  {
    name: "Teams & Locations",
    price: "Custom",
    description: "Multiple stores or teams",
    features: ["Everything in growing", "Multiple locations", "Custom everything", "Unlimited staff", "Direct support"]
  }
]}
```

**Replace with:**

```tsx
{[
  {
    id: 'trial',
    name: "Free Trial",
    price: "₱0",
    billingCycle: "14 days",
    description: "Full Access for 14 Days",
    tagline: "No credit card required",
    features: [
      "All features included",
      "No credit card needed",
      "Full POS system",
      "Online ordering",
      "Inventory management",
      "Store builder"
    ],
    cta: "Try for free",
    ctaHref: "/auth/signup",
    highlighted: false,
    badge: null,
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: 'monthly',
    name: "Standard Monthly",
    price: "₱1,999",
    billingCycle: "month",
    description: "Perfect for getting started",
    tagline: "Flexible, cancel anytime",
    features: [
      "Full POS system",
      "Online ordering",
      "Inventory management",
      "Store builder",
      "Email support",
      "Cancel anytime"
    ],
    cta: "Subscribe monthly",
    ctaHref: "/auth/signup?plan=monthly",
    highlighted: false,
    badge: "FLEXIBLE",
    color: "from-indigo-500 to-blue-600"
  },
  {
    id: 'yearly',
    name: "Standard Yearly",
    price: "₱19,999",
    billingCycle: "year",
    monthlyBreakdown: 1666,
    savings: 3989,
    description: "Save ₱3,989 (2 months free!)",
    tagline: "Lock in price for 12 months",
    features: [
      "Everything in monthly",
      "₱1,666/month (billed yearly)",
      "Lock in price 12 months",
      "Priority updates",
      "Priority stability",
      "VIP support"
    ],
    cta: "Save now, subscribe yearly",
    ctaHref: "/auth/signup?plan=yearly",
    highlighted: true,
    badge: "BEST VALUE ⭐",
    color: "from-emerald-500 to-teal-600",
    savingsBadge: {
      text: "Save ₱3,989",
      subtext: "Get 2 months free!"
    }
  }
]}
```

**Design Changes Required:**

1. **Trial Card** (Light blue - distinct):
   - Background: `bg-gradient-to-br from-blue-50 to-cyan-50`
   - Text: `text-slate-900` (dark for light background)
   - Price emphasized: Large ₱0
   - CTA Button: `bg-blue-600 text-white`
   - Show "No credit card required" as trust indicator

2. **Monthly Card** (Standard):
   - Background: `bg-gradient-to-br from-slate-800 to-slate-900` (keep dark)
   - Text: `text-white`
   - Price: `₱1,999 / month`
   - Badge: Subtle "FLEXIBLE" tag
   - CTA Button: `bg-gradient-to-r from-blue-600 to-indigo-600`

3. **Yearly Card** (Highlighted - bright):
   - Background: `bg-gradient-to-br from-emerald-600 to-teal-700` (GREEN - stands out!)
   - Text: `text-white`
   - **Dual pricing display**:
     ```
     ₱19,999
     per year
     ───────────────────
     ₱1,666/month (billed yearly)
     ```
   - **Savings callout** (bold red/orange):
     ```
     Save ₱3,989 per year!
     Get 2 months free
     ```
   - Badge: Prominent "⭐ BEST VALUE" (gold/yellow)
   - Price Lock feature: "Lock in price for 12 months"
   - CTA Button: `bg-white text-teal-700 font-bold` (contrast!)
   - Scale up on hover: `whileHover={{ scale: 1.05 }}`

4. **General Card Changes**:
   - Remove 3-column grid, make them responsive but give yearly more prominence
   - Option A: Stack on mobile, 3 cols on desktop
   - Option B: 2-col (monthly + yearly) on desktop, full-width trial above
   - Add visible divider/spacing between trial and paid plans
   - Ensure yearly card is slightly taller to accommodate extra info

---

### ✅ Section 7: Contact Section (Lines ~602-680)
**Status**: No changes needed
- ✅ Keep contact form styling
- ✅ Keep contact info (Email, Phone, Address)

---

### ✅ Section 8: Footer (Lines ~682-720)
**Status**: No changes needed
- ✅ Keep footer links and layout

---

## Implementation Checklist

### Phase 1: Update Pricing Data
- [ ] Replace DEFAULT_PLANS with new 3-tier structure
- [ ] Add pricing calculations (e.g., monthly breakdown, savings)
- [ ] Update feature descriptions

### Phase 2: Update Pricing Card UI
- [ ] Update card background colors (light blue for trial, green for yearly)
- [ ] Add dual pricing display for yearly (₱19,999 + ₱1,666/mo)
- [ ] Add savings callout with bold styling for yearly
- [ ] Add badge styling (FLEXIBLE, BEST VALUE ⭐)
- [ ] Update CTA button text and colors
- [ ] Adjust grid layout for better visual hierarchy

### Phase 3: Update Hero Section
- [ ] Enhance CTA text to "Try 14 days free (no credit card)"
- [ ] Add pricing badge "Starting at ₱1,999/month"

### Phase 4: Polish & Animation
- [ ] Add hover scale effect to yearly card (stands out more)
- [ ] Add subtle glow effect to yearly card
- [ ] Ensure all CTAs link to correct signup URLs with plan params
- [ ] Test responsive layout (mobile, tablet, desktop)

### Phase 5: Testing
- [ ] Visual test on different screen sizes
- [ ] Verify all CTA links work correctly
- [ ] Check animation performance
- [ ] Verify pricing calculations display correctly

---

## Key Messaging Updates

### Old Messaging
- "Getting Started", "Growing", "Teams & Locations"
- Pricing focused on features/team size
- No emphasis on trial

### New Messaging
- "Free Trial", "Standard Monthly", "Standard Yearly"
- Pricing focused on value & ease
- Trial prominently featured
- Annual savings emphasized ("Save ₱3,989", "2 months free")
- Price lock emphasized ("Lock in price for 12 months")

---

## Color Palette for New Pricing

| Plan | Primary Color | Accent | CTA Button |
|------|---------------|--------|-----------|
| Trial | Blue (50-600) | Light cyan | Blue-600 |
| Monthly | Slate (800-900) | Indigo | Blue-600 to Indigo-600 |
| Yearly | Emerald (600-700) | Gold/Yellow | White on Teal-700 |

---

## Notes

- Trial card should NOT appear as "cheaper" or "limited" - it's the same full product
- Yearly card should be the visual winner (green, larger, highlighted)
- All messaging should emphasize simplicity and no-risk (free trial, cancel anytime)
- Ensure CTAs go to correct signup URLs with plan pre-selected if possible
