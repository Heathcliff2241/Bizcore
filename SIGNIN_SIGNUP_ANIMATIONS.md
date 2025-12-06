# BizCore Sign In & Sign Up Page Animations

## Overview
This document contains all the animated text sequences and dynamic content used on the Sign In and Sign Up pages.

---

## Main Text Sequence

### Text Elements with Timing and Styling

```javascript
const textSequence = [
  { text: "Welcome to", delay: 0, size: "text-4xl", rotation: 0 },
  { text: "BizCore", delay: 0.8, size: "text-7xl", rotation: -2, special: true },
  { text: "Your all-in-one platform", delay: 2, size: "text-2xl", rotation: 1 },
  { text: "for managing your entire business operations", delay: 3.5, size: "text-xl", rotation: 0 },
  { text: "Online Ordering", delay: 5.5, size: "text-3xl", rotation: 3, color: "text-blue-300" },
  { text: "Smart POS System", delay: 7, size: "text-3xl", rotation: -2, color: "text-cyan-300" },
  { text: "Real-Time Inventory", delay: 8.5, size: "text-3xl", rotation: 2, color: "text-blue-400" },
  { text: "Beautiful Storefront", delay: 10, size: "text-3xl", rotation: -1, color: "text-cyan-400" },
]
```

---

## Statistics Section

### Stats Display with Animations

```javascript
const stats = [
  { value: "5K+", label: "Active Users", delay: 6 },
  { value: "99.9%", label: "Uptime", delay: 7.5 }
]
```

**Animation Properties:**
- Opacity: Fades in from 0 → 1, holds, then fades out to 0
- Scale: Starts at 0.8, scales up to 1, holds, scales back to 0.8
- Position: Y-axis movement of 10px up/down
- Duration: 1 second per animation cycle
- Repeat: Every 12 seconds with loop

---

## Simultaneous Overlay Words

### Positioned Wordplay Elements

```javascript
const simultaneousWords = [
  { text: "Scale", position: "top-20 left-10", delay: 5.5, rotate: 15 },
  { text: "Grow", position: "top-32 right-20", delay: 6.2, rotate: -12 },
  { text: "Automate", position: "bottom-32 left-16", delay: 7, rotate: 18 },
  { text: "Succeed", position: "bottom-20 right-10", delay: 7.8, rotate: -15 },
]
```

**Animation Properties:**
- Initial: Opacity 0, scale 0
- Animate: Opacity [0, 0.7, 0.7, 0], scale [0.8, 1, 1, 0.8]
- Rotation: Slight oscillation (±5°)
- Colors: Blue-400 to cyan-400 gradient
- Duration: 2 seconds
- Repeat: Every 12 seconds

---

## Floating Words - Horizontal

### Words that Float Across Screen

```
"manage", "create", "track", "scale", "grow"
```

**Animation Properties:**
- Direction: Horizontal (left to right)
- X-axis: Moves from -100 to random positive value (0-100)
- Y-axis: Random vertical offset (-25px to +25px)
- Opacity: Fades [0, 0.5, 0.5, 0]
- Rotation: Random -5° to +5°
- Duration: 3 seconds per animation
- Delay: Staggered at 1 second intervals starting at 6s
- Colors: text-slate-500 italic
- Repeat: Every 12 seconds

---

## Floating Words - Vertical

### Words that Fall Vertically

```
"fast", "simple", "powerful"
```

**Animation Properties:**
- Direction: Vertical (top to bottom)
- Initial: Rotated 0°
- Animate: Rotated 90° (vertical orientation)
- Y-axis: Moves from top 0 to +100px
- X-axis: Random horizontal offset (-40px to +40px)
- Opacity: Fades [0, 0.6, 0.6, 0]
- Duration: 3.5 seconds per animation
- Delay: Staggered at 1.2 second intervals starting at 6.5s
- Colors: text-slate-600 italic
- Repeat: Every 12 seconds

---

## Diagonal Text Effect

### "Reliable" - Diagonal/Skewed

**Position:** Bottom-right area (right: -50px, top: 20%)

**Styling:**
- Rotation: 45 degrees
- SkewX: -20 degrees
- Font: text-2xl font-bold italic
- Color: text-slate-600

**Animation Properties:**
- Initial: Opacity 0, rotate 45°
- Animate: Opacity [0, 0.4, 0.4, 0]
- Duration: 2.5 seconds
- Delay: 8 seconds
- Repeat: Every 12 seconds

---

## Bottom Tagline

### Closing Message with Gradient

**Text:** "Built for businesses that want more"

**Styling:**
- Font: text-lg font-bold italic
- Gradient: cyan-400 → blue-400 → indigo-400
- Position: Bottom center of animation area

**Animation Properties:**
- Initial: Opacity 0
- Animate: Opacity [0, 0.6, 0.6, 0]
- Y-axis: Moves [20px, 0, 0, -20px]
- Duration: 1.5 seconds
- Delay: 11 seconds
- Repeat: Every 12 seconds

---

## Animation Cycle Timing

| Time (s) | Event |
|----------|-------|
| 0.0 | "Welcome to" fades in and types |
| 0.8 | "BizCore" appears with rotation |
| 2.0 | "Your all-in-one platform" types |
| 3.5 | Platform description types |
| 5.5 | "Online Ordering" + "Scale" word appear |
| 6.0 | First stat "5K+ Active Users" appears |
| 6.2 | "Grow" word appears |
| 6.5 | Vertical words start falling |
| 7.0 | "Real-Time Inventory" + "Automate" appear |
| 7.5 | Second stat "99.9% Uptime" appears |
| 7.8 | "Succeed" word appears |
| 8.5 | "Beautiful Storefront" appears |
| 8.0 | "Reliable" diagonal text appears |
| 10.0 | "Smart POS System" appears |
| 11.0 | Bottom tagline fades in |
| 12.0+ | Loop repeats |

---

## Typewriter Component

The `TypewriterText` component creates character-by-character animation with:
- 0.02s delay between each character
- 0.1s duration per character
- Creates smooth typing effect

---

## Color Palette

- **Primary Gradient:** blue-300 → cyan-300
- **Stat Gradient:** blue-400 → cyan-400
- **Feature Colors:** 
  - Online Ordering: text-blue-300
  - Smart POS: text-cyan-300
  - Inventory: text-blue-400
  - Storefront: text-cyan-400
- **Floating Text:** text-slate-500 to text-slate-600
- **Tagline Gradient:** cyan-400 → blue-400 → indigo-400

---

## Responsive Behavior

- **Desktop (lg breakpoint):** All animations and text visible
- **Mobile:** Hidden with `hidden lg:flex` class
- Animation area height: `min-h-96` (384px minimum)

---

## Performance Notes

- Total animation loop duration: 12 seconds
- Infinite repeat with repeatDelay: 12 seconds
- Uses `pointer-events-none` for floating elements to prevent interaction blocking
- Absolute positioning for overlays keeps layout flowing naturally

