# HeaderGlass Visual Design & Props Reference

## Visual Comparison

### HeaderSection (Original)
```
┌─────────────────────────────────────────────────────┐
│ Logo    Home  Shop  About  Contact          🛒      │
│                                                      │
└─────────────────────────────────────────────────────┘
Background: Solid color (white, dark, custom)
Style: Clean, minimal, flat design
```

### HeaderGlass (New Variant)
```
┌─────────────────────────────────────────────────────┐
│╔═════════════════════════════════════════════════╗  │
│║ Logo    Home  Shop  About  Contact          🛒 ║  │
│║                                                 ║  │
│╚═════════════════════════════════════════════════╝  │
│  (Gradient Background)                            │
└─────────────────────────────────────────────────────┘
Background: Gradient with frosted glass overlay
Style: Modern glass morphism, premium feel
```

## Glass Morphism Technical Details

### Glass Layer Properties
```css
/* Default values */
background: rgba(255, 255, 255, 0.1);      /* 10% white opacity */
backdrop-filter: blur(10px);                /* Blur effect */
border: 1px solid rgba(255, 255, 255, 0.2); /* 20% white border */
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);  /* Depth shadow */
border-radius: 0;                           /* No corner radius for header */
```

### Customizable Parameters

| Property | Type | Default | Range | Usage |
|----------|------|---------|-------|-------|
| `backgroundGradient` | string | `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` | CSS gradient | Set background pattern |
| `hasGlassGradientBg` | boolean | `true` | true/false | Enable gradient or solid |
| `glassBackground` | string | `rgba(255, 255, 255, 0.1)` | RGBA color | Glass overlay color |
| `glassBackdropBlur` | number | `10` | 0-30 | Blur effect intensity (px) |
| `glassBorderColor` | string | `rgba(255, 255, 255, 0.2)` | RGBA color | Border color |
| `glassBorderWidth` | number | `1` | 0-5 | Border thickness (px) |
| `textColor` | string | `#ffffff` | hex/rgb | Text and icon color |
| `logoText` | string | `Your Brand` | text | Logo text display |
| `logoImage` | string | undefined | URL/data-url | Optional logo image |
| `navigationLinks` | array | 4 defaults | nav array | Menu items |
| `showCart` | boolean | `true` | true/false | Show/hide cart button |
| `height` | number | `80` | 50-150 | Header height (px) |
| `sticky` | boolean | `true` | true/false | Fixed on scroll |

## Design Presets

### Preset 1: Purple Dream (Default)
```
Gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Glass: rgba(255, 255, 255, 0.1)
Blur: 10px
Border: 1px rgba(255, 255, 255, 0.2)
Text: #ffffff
```

### Preset 2: Dark Elegance
```
Gradient: linear-gradient(135deg, #1f2937 0%, #111827 100%)
Glass: rgba(0, 0, 0, 0.3)
Blur: 15px
Border: 1px rgba(255, 255, 255, 0.1)
Text: #ffffff
```

### Preset 3: Ocean Vibes
```
Gradient: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)
Glass: rgba(255, 255, 255, 0.08)
Blur: 12px
Border: 1px rgba(255, 255, 255, 0.25)
Text: #ffffff
```

### Preset 4: Sunset Glow
```
Gradient: linear-gradient(135deg, #f97316 0%, #ea580c 100%)
Glass: rgba(255, 255, 255, 0.12)
Blur: 8px
Border: 1px rgba(255, 255, 255, 0.3)
Text: #ffffff
```

### Preset 5: Minimalist Clean
```
Gradient: linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%)
Glass: rgba(255, 255, 255, 0.6)
Blur: 6px
Border: 1px rgba(0, 0, 0, 0.1)
Text: #1f2937
```

## Styling Hierarchy

```
HeaderGlass
├─ Outer Container
│  └─ Background gradient set
├─ Glass Overlay (positioned absolute)
│  ├─ background: glassBackground
│  ├─ backdrop-filter: blur(glassBackdropBlur)
│  ├─ border: glassBorderWidth glassBorderColor
│  └─ box-shadow: depth effect
└─ Content Layer (relative z-index)
   ├─ Logo (with hover scale)
   ├─ Navigation Links (with hover opacity)
   ├─ Cart Button (glass styled)
   └─ Mobile Menu (glass styled)
```

## Interactive Elements

### Buttons & Links
```
Normal State:
├─ background: rgba(255, 255, 255, 0.1)
├─ border: 1px rgba(255, 255, 255, 0.2)
├─ backdrop-filter: blur(5px)
└─ box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1)

Hover State:
├─ background: rgba(255, 255, 255, 0.2)
├─ opacity: 0.8
└─ transform: slight scale up
```

### Mobile Menu
```
Position: Dropdown below header
Background: Inherits glassBackground
Border: Inherits glassBorderColor
Backdrop: Inherits glassBackdropBlur
Animation: Smooth expand from top
```

## Text Effects

```
Logo Text:
├─ text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2)
├─ font-weight: bold
├─ font-size: scales with height
└─ color: textColor

Nav Links:
├─ text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1)
├─ font-weight: 500
├─ font-size: 14px
└─ opacity on hover: 80%
```

## Responsive Behavior

```
Desktop (md breakpoint):
├─ Full navigation visible
├─ Logo + text side by side
├─ Auth buttons visible
└─ Cart in header

Mobile (< md):
├─ Menu hamburger visible
├─ Navigation hidden
├─ Cart button in header
├─ Dropdown menu on toggle
└─ Full width usage
```

## Animation Details

```
Logo Hover:
├─ transform: scale(1.05)
├─ duration: 0.2s
└─ easing: ease-out

Button Click:
├─ scale: 0.95
├─ duration: 0.15s
└─ easing: ease-out

Mobile Menu:
├─ height: 0 → auto
├─ opacity: 0 → 1
├─ duration: 0.3s
└─ easing: cubic-bezier
```

## Common Use Cases

### E-commerce Store
```tsx
<HeaderGlass
  backgroundGradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  glassBackdropBlur={12}
  glassBackground="rgba(255, 255, 255, 0.1)"
  textColor="#ffffff"
  showCart={true}
/>
```

### Portfolio/Agency
```tsx
<HeaderGlass
  backgroundGradient="linear-gradient(135deg, #1f2937 0%, #111827 100%)"
  glassBackdropBlur={15}
  glassBackground="rgba(0, 0, 0, 0.3)"
  textColor="#ffffff"
  showCart={false}
/>
```

### SaaS Product
```tsx
<HeaderGlass
  backgroundGradient="linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)"
  glassBackdropBlur={10}
  glassBackground="rgba(255, 255, 255, 0.08)"
  textColor="#ffffff"
  sticky={true}
/>
```

## Accessibility

- Text contrast: AAA compliant (white text on colored backgrounds)
- Text shadows improve readability on glass
- Interactive elements have clear hover states
- Mobile menu keyboard accessible
- Focus states visible on navigation
- Semantic HTML structure maintained

## Performance Considerations

- Glass effect uses CSS backdrop-filter (GPU accelerated)
- Blur values optimized (10px default for performance)
- No heavy JavaScript animations
- Mobile-optimized with reduced blur on demand
- Static styles, minimal re-renders
