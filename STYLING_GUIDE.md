# Apex Panel Presentation - Styling Guide

## Core Design Principles

### No Scrolling Policy
- **CRITICAL**: No internal scrolling or overflow on any slide
- All slides must use `overflow: hidden` to prevent scrolling
- Content must be compressed to fit within viewport using `clamp()` functions
- Never use `overflow-y: auto` or `overflow: scroll` in slide content

### Color Palette

#### Primary Colors
- **Accent Blue**: `#4a7ba7` - Used for primary accents, badges, borders
- **Title Blue**: `#2c5282` - Used for section titles and headers
- **Text Gray**: `#616161` - Used for secondary/body text
- **Border Gray**: `#dee2e6` - Used for all borders
- **Background Light Gray**: `#f8f9fa` - Used for subtle backgrounds
- **Background Medium Gray**: `#f0f0f0` - Used for alternating sections

#### Special Colors
- **Navy Gradient**: `linear-gradient(135deg, #1a237e 0%, #283593 100%)` - Reserved for important bands/CTAs
- **White**: `#ffffff` - Primary background for cards

## Layout Structure

### Slide Container
```css
.slide-content {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  overflow: hidden; /* CRITICAL */
  padding: 0 2vw 0.5vh 2vw;
  gap: min(1vh, 0.75rem);
  position: relative;
}
```

### Background Grid Pattern
Every slide should include this subtle grid pattern:
```html
<div style="position: absolute; inset: 0; background-image: repeating-linear-gradient(0deg, rgba(74, 123, 167, 0.03) 0px, transparent 1px, transparent 40px, rgba(74, 123, 167, 0.03) 41px), repeating-linear-gradient(90deg, rgba(74, 123, 167, 0.03) 0px, transparent 1px, transparent 40px, rgba(74, 123, 167, 0.03) 41px); pointer-events: none;"></div>
```

## Component Styles

### Cards/Containers
- **Background**: White (`#ffffff`)
- **Border**: 1px solid `#dee2e6`
- **Border Radius**: `12px` (consistent across all cards)
- **Shadow**: `0 4px 16px rgba(0,0,0,0.08)` for subtle depth
- **Shadow (stronger)**: `0 8px 32px rgba(0,0,0,0.1)` for emphasis
- **Padding**: `min(1.5vh, 1rem)` or similar responsive padding

### Typography

#### Headers
- **Main Titles**: `color: #2c5282; font-weight: 600;`
- **Monospace Headers**: `font-family: 'IBM Plex Mono', monospace; text-transform: uppercase;`

#### Body Text
- **Primary Text**: `color: #424242` or `color: var(--text-primary)`
- **Secondary Text**: `color: #616161`

#### Font Sizing (Responsive)
- Use `clamp()` functions for all font sizes
- Example: `font-size: clamp(0.75rem, 1.5vh, 0.95rem)`

### Badges/Chips
- **Filled Badge**: `background: #4a7ba7; color: white; padding: 4px 10px; border-radius: 4px;`
- **Outlined Badge**: `background: white; border: 1px solid #4a7ba7; color: #2c5282; padding: 4px 10px; border-radius: 4px;`

### Numbered Circles
Used for visual hierarchy and section numbering:
```css
background: #4a7ba7;
color: white;
width: 24px;
height: 24px;
border-radius: 50%;
display: flex;
align-items: center;
justify-content: center;
font-size: clamp(0.6rem, 1.2vh, 0.75rem);
font-weight: 700;
```

### Tables/Grids
- **Header Background**: `#f8f9fa`
- **Cell Background**: White
- **Grid Gap**: `1px` with background `#dee2e6` to create borders
- **Border Radius**: `6px` for inner elements, `12px` for container

### Tab Headers
For comparison sections:
- **Inactive Tab**: `background: #616161; color: white;`
- **Active/Future Tab**: `background: #4a7ba7; color: white;`
- **Tab Container Background**: `linear-gradient(to right, #f8f9fa, #e9ecef)`

## Spacing Guidelines

### Gaps
- **Small**: `min(0.5vh, 0.25rem)`
- **Medium**: `min(1vh, 0.75rem)`
- **Large**: `min(2vh, 1.25rem)`

### Padding
- **Small**: `min(0.75vh, 0.5rem)`
- **Medium**: `min(1.5vh, 1rem)`
- **Large**: `min(2vh, 1.5rem)`

## Special Elements

### Call-to-Action Bands
For important messages or transitions:
```css
background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
color: white;
padding: min(0.75vh, 0.5rem) min(1vh, 0.75rem);
border-radius: 6px;
box-shadow: 0 4px 16px rgba(26,35,126,0.3);
```

### Metrics/Progress Bars
```css
background: #f0f0f0;
border-left: 3px solid #4a7ba7;
border-radius: 4px;
padding: min(0.35vh, 0.25rem) min(0.5vh, 0.35rem);
```

## Best Practices

1. **Always use white backgrounds** for primary content containers
2. **Keep color usage minimal** - primarily blues and grays
3. **Use consistent border radius** - 12px for main containers, 6px for inner elements
4. **Apply subtle shadows** for depth without overwhelming
5. **Use z-index appropriately** when layering with background grid (typically `z-index: 1` for content)
6. **Test all clamp() functions** at different viewport sizes
7. **Never allow scrolling** - adjust font sizes and spacing to fit content

## Avoided Patterns

- ❌ Bright gradients or multiple colors
- ❌ Dark backgrounds for content areas
- ❌ Inconsistent border radius values
- ❌ Heavy shadows or multiple shadow layers
- ❌ Fixed pixel values (use responsive units)
- ❌ Overflow: auto or scroll on any element
- ❌ Excessive use of accent colors

## Example Card Structure

```html
<div style="background: white;
            border: 1px solid #dee2e6;
            border-radius: 12px;
            padding: min(1.5vh, 1rem);
            box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
  <h3 style="color: #2c5282;
             font-size: clamp(0.9rem, 1.8vh, 1.1rem);
             margin-bottom: min(0.75vh, 0.5rem);">
    Section Title
  </h3>
  <p style="color: #616161;
            font-size: clamp(0.75rem, 1.5vh, 0.9rem);
            line-height: 1.4;">
    Content text here...
  </p>
</div>
```

This styling system creates a professional, modern, and cohesive presentation while ensuring all content remains visible without scrolling.