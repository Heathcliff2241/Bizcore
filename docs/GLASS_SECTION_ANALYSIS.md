# HeaderSectionPreview Analysis - How It Works & Why It's Editable

## Overview
The `HeaderSectionPreview` component is a fully interactive, editable section preview in BrandStudio's canvas. Here's how it achieves editability and interactivity.

---

## 1. PREVIEW COMPONENT STRUCTURE (HeaderSectionPreview.tsx)

### Key Characteristics:

```tsx
export function HeaderSectionPreview({ component }: { component: Component }) {
  const props = component.props || {};
  
  // All styling comes from component.props
  const logoText = props.logoText || "Your Brand";
  const textColor = props.textColor || "#1f2937";
  const height = component.size?.height || 80;
  
  // React state for interactivity (mobile menu toggle)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return <header>...</header>
}
```

**Why it's editable:**
- **Props-driven**: All text, colors, layout comes from `component.props`
- **State management**: Uses React `useState` for interactive features (mobile menu)
- **Real HTML/CSS**: Not Konva shapes - actual DOM elements that respond to clicks
- **Framer Motion**: Animations work in preview (mobile menu transitions)

---

## 2. CANVAS RENDERING (CanvasComponent.tsx - header case)

### The Rendering Pipeline:

```
Rect (Konva shape for hit detection)
  ↓ onClick/onTap listeners
  ↓
Html wrapper (converts React to Konva-compatible)
  ↓
ComponentActionButtons (when selected)
  ├─ Duplicate button
  ├─ Move up button
  ├─ Move down button
  └─ Delete button
  ↓
Resize handles (top and bottom)
  ├─ Visual indicator bar
  ├─ Height display tooltip
  └─ Mouse event listeners
  ↓
ContentWrapper div
  ├─ Selection border (blue when selected)
  └─ HeaderSectionPreview (actual preview)
```

### Key HTML Wrapper Properties:

```tsx
<Html divProps={{
  style: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: `${size.width}px`,
    // CRUCIAL: Expands on selection to show action buttons above
    height: isSelected 
      ? `${(isResizing ? tempHeight : size.height) + 80}px` 
      : `${isResizing ? tempHeight : size.height}px`,
    pointerEvents: 'none',      // HTML doesn't block Konva
    overflow: 'visible',         // Action buttons show outside
    zIndex: component.zIndex ?? 0,
  }
}}>
```

---

## 3. HOW EDITABILITY WORKS

### A. Selection & Interaction
```
1. User clicks on component
2. Rect's onClick handler fires
3. handleClick() -> selectComponent(id)
4. isSelected becomes true
5. UI shows:
   - ComponentActionButtons (appears above)
   - Resize handles (appear above/below)
   - Blue selection border
   - Height indicator tooltip
```

### B. Action Buttons Display
```tsx
{isSelected && (
  <ComponentActionButtons
    component={component}
    isTopSection={isTopSection}
    isBottomSection={isBottomSection}
    onMoveUp={moveComponentUp}
    onMoveDown={moveComponentDown}
    onDuplicate={duplicateComponent}
    onDelete={deleteComponent}
  />
)}
```

**Why buttons are visible:**
- `overflow: 'visible'` on Html wrapper
- Buttons positioned ABOVE (-ve top) the component
- `zIndex: 9999` ensures they're on top
- `pointerEvents: 'auto'` on buttons allows clicking

### C. Resize Handles
```tsx
{isSelected && (
  <>
    {/* Top handle at -12px (above component) */}
    <div
      style={{
        position: 'absolute',
        top: '-12px',
        left: '0',
        width: '100%',
        height: '24px',
        cursor: 'ns-resize',
        zIndex: 9999,
        pointerEvents: 'auto', // ← ENABLES INTERACTION
      }}
      onMouseDown={handleHtmlTopMouseDown}
      onMouseEnter={(e) => {
        // Visual feedback: highlight when hovering
        e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
      }}
      onMouseLeave={(e) => {
        // Visual feedback: reset style
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {/* Thin visual bar indicator */}
      <div data-handle-bar style={{ ... }} />
    </div>
    
    {/* Bottom handle at size.height (below component) */}
    <div
      style={{
        position: 'absolute',
        top: `${size.height}px`,
        // ... same as top, but positioned at bottom
      }}
      onMouseDown={handleHtmlBottomMouseDown}
    />
  </>
)}
```

### D. Props Editing Flow
```
1. User selects component → isSelected = true
2. Properties panel shows (external to canvas)
3. User changes "Logo Text" → props.logoText = "New Text"
4. Component re-renders automatically
5. HeaderSectionPreview receives new props
6. Component updates in real-time on canvas
```

---

## 4. WHY GLASS SECTIONS WEREN'T EDITABLE

### Problems in Original Implementation:
```tsx
<Html divProps={{ 
  style: { 
    ...,
    overflow: 'hidden'  // ← WRONG: Hides action buttons!
  } 
}}>
  <div style={{ 
    ...,
    opacity: isSelected ? 0.5 : 1,  // ← Fades content (bad UX)
    pointerEvents: 'none'
  }}>
    <div style={{ /* missing action buttons */ }}>
      <GlassPreview />
    </div>
  </div>
</Html>
```

**Issues:**
1. ❌ No `ComponentActionButtons` rendered at all
2. ❌ No resize handles
3. ❌ `overflow: 'hidden'` prevented action buttons from showing
4. ❌ `pointerEvents: 'none'` made everything unclickable
5. ❌ Opacity change was confusing selection feedback

---

## 5. SOLUTION: ALIGN GLASS SECTIONS WITH HEADER PATTERN

### What We Fixed:

```tsx
case 'header-glass':
  return (
    <>
      <Rect width={size.width} height={size.height} fill="transparent" 
            onClick={handleClick} onTap={handleClick} />
      <Html divProps={{
        style: {
          position: 'absolute',
          top: '0',
          left: '0',
          width: `${size.width}px`,
          // CORRECT: Expands to show action buttons
          height: isSelected 
            ? `${(isResizing ? tempHeight : size.height) + 80}px` 
            : `${isResizing ? tempHeight : size.height}px`,
          pointerEvents: 'none',    // Correct: HTML doesn't block Konva
          overflow: 'visible',      // FIXED: Was 'hidden'
          zIndex: component.zIndex ?? 0,
        }
      }}>
        {/* NOW INCLUDES ACTION BUTTONS */}
        {isSelected && (
          <ComponentActionButtons
            component={component}
            isTopSection={isTopSection}
            isBottomSection={isBottomSection}
            onMoveUp={moveComponentUp}
            onMoveDown={moveComponentDown}
            onDuplicate={duplicateComponent}
            onDelete={deleteComponent}
          />
        )}
        
        {/* NOW INCLUDES RESIZE HANDLES */}
        {isSelected && (
          <>
            <div style={{...}} onMouseDown={handleHtmlTopMouseDown} />
            <div style={{...}} onMouseDown={handleHtmlBottomMouseDown} />
          </>
        )}
        
        {/* Content wrapper - correct nesting */}
        <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'none' }}>
          <div style={{ 
            border: isSelected ? '2px solid #3b82f6' : 'none',
            boxSizing: 'border-box'
          }}>
            <HeaderGlassPreview component={component} />
          </div>
        </div>
      </Html>
    </>
  )
```

---

## 6. KEY PRINCIPLES FOR EDITABLE SECTIONS

| Feature | Why Important | How Implemented |
|---------|--------------|-----------------|
| **Rect for hit detection** | Captures clicks even on transparent areas | Konva Rect with onClick handler |
| **Html wrapper** | Bridges React to Konva canvas | Html from react-konva |
| **overflow: 'visible'** | Lets action buttons show outside | CSS overflow property |
| **ComponentActionButtons** | Provides duplicate/move/delete | Conditional rendering when isSelected |
| **Resize handles** | Allows height adjustment | Absolutely positioned divs with mouse handlers |
| **pointerEvents: 'auto'** on buttons | Makes buttons clickable | CSS pointer-events property |
| **Props-driven preview** | Real-time editing | All text/colors from component.props |
| **Selection feedback** | Visual indication | Blue border + opacity changes |

---

## 7. EDITABILITY FEATURES NOW WORKING

✅ **Selection** - Click component to select
✅ **Duplicate** - Duplicate button creates copy
✅ **Move Up/Down** - Reorder sections in stack
✅ **Delete** - Remove section
✅ **Resize** - Drag top/bottom handles to change height
✅ **Real-time props** - Edit text/colors in properties panel → updates on canvas
✅ **Visual feedback** - Blue border shows selection, tooltips show dimensions

---

## 8. COMPARISON: HEADER vs GLASS SECTIONS

### HeaderSectionPreview
- **Status**: ✅ Fully editable
- **Layout**: Traditional HTML/CSS header
- **Interactivity**: Mobile menu toggle (demo feature)
- **Props used**: logoText, textColor, navigationLinks, etc.

### GlassPreview Sections (Header, Hero, CTA, Footer, Feature)
- **Status**: ✅ Now fully editable (after fixes)
- **Layout**: Glass morphism with blur/transparency
- **Interactivity**: Hover effects on cards
- **Props used**: Similar structure to originals

**They now work identically** in terms of:
- Selection and action buttons
- Resizing
- Props editing
- Real-time updates
- Keyboard shortcuts
- Duplication and deletion

---

## SUMMARY

The reason `HeaderSectionPreview` is editable while glass sections initially weren't:

1. **Proper Html wrapper configuration** with `overflow: 'visible'`
2. **ComponentActionButtons** rendered conditionally
3. **Resize handles** with mouse event handlers
4. **Props-driven rendering** (all values from component.props)
5. **Correct z-index layering** for UI elements
6. **pointerEvents management** to allow clicks where needed

Glass sections now follow the exact same pattern, making them **100% editable** with all the same capabilities as the header section.
