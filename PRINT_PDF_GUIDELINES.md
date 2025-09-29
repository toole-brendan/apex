# Print/PDF Guidelines & Lessons Learned

## Core Objectives
1. **PDF-First Design**: The presentation ONLY needs to look good in Chrome's print preview and final PDF - web view appearance is irrelevant
2. **No Overflow**: Every slide must fit completely within one page with no scrolling or cut-off content
3. **Maximize Space Usage**: Content should fill the available slide space with tight containers and appropriate font scaling

## Architecture Decisions

### CSS Structure
- **styles.css**: Main presentation styles for structure and components
- **styles-print.css**: ALL print-specific overrides in ONE place
- **NO duplicate @media print blocks** - they cause conflicts and unpredictable behavior

### Why This Approach Works
```css
/* styles-print.css */
@media print {
    .slide {
        display: flex !important;      /* Forces visibility */
        width: 11in !important;        /* Fixed dimensions */
        height: 8.5in !important;       /* Letter landscape */
        page-break-after: always;      /* One slide per page */
    }
}
```

## Lessons Learned

### 1. Dynamic Content Loading Issues
**Problem**: Slides are loaded via JavaScript, so they might not be in the DOM when print is triggered.

**Solution**: The `beforeprint` event handler must:
- Query ALL slides fresh from the DOM
- Force them visible with both classes and inline styles
- Add `print-visible` class for CSS targeting

### 2. CSS Specificity Battles
**Problem**: Multiple @media print blocks in different files created conflicts where slides would still be hidden.

**Solution**:
- Single @media print block in styles-print.css
- Use `!important` liberally in print styles (it's OK here!)
- Override ALL possible hiding mechanisms:
  ```css
  .slide:not(.active),
  .slide.inactive,
  .slide[style*="display: none"] {
      display: flex !important;
  }
  ```

### 3. Viewport Units Don't Work in Print
**Problem**: Using `vh`, `vw`, `clamp()`, and `min()` caused unpredictable sizing in PDFs.

**Solution**:
- Use fixed units (`rem`, `px`, `in`) in print styles
- Replace all viewport units in inline styles
- The print CSS overrides any viewport units that remain

### 4. Page Break Control
**Problem**: Slides would sometimes split across pages or not fill the page.

**Solution**:
```css
.slide {
    page-break-after: always !important;
    page-break-inside: avoid !important;
    height: 8.5in !important;  /* Exact page height */
}
.slide:last-child {
    page-break-after: avoid !important;  /* Don't add blank page */
}
```

## Development Workflow

### Testing Print Output
1. **Quick Test**:
   - Open `index.html` in Chrome
   - Press `Cmd+P`
   - Check print preview shows all 10 slides
   - Open DevTools Console - should see "Found 10 slides for printing"

2. **Full Test**:
   ```bash
   node generate-pdf.js
   open apex_presentation.pdf
   ```

### Making Content Changes

#### When editing slide content:
1. **Avoid viewport units** in inline styles - use `rem` or `%`
2. **Test immediately** with Cmd+P to ensure no overflow
3. **Adjust font sizes** in styles-print.css if needed for better fit

#### Font size strategy for print:
```css
/* Base sizes that work well for PDF */
@media print {
    h1 { font-size: 1.5rem; }      /* Main headers */
    h2 { font-size: 1.25rem; }     /* Section headers */
    h3 { font-size: 1rem; }         /* Subsections */
    p, li { font-size: 0.75rem; }   /* Body text */
}
```

### Adding New Slides
1. Add HTML file in `slides/` directory
2. Update `config/slides.json`
3. Test with print preview immediately
4. Ensure slide follows the standard structure:
   ```html
   <div class="slide" id="slide-X">
       <div class="slide-header">...</div>
       <div class="slide-content">...</div>
       <div class="slide-footer">...</div>
   </div>
   ```

## Content Fitting Strategy

### To maximize space usage:
1. **Use flexbox** for slide-content:
   ```css
   .slide-content {
       display: flex;
       flex-direction: column;
       flex: 1 1 auto;  /* Grows to fill available space */
   }
   ```

2. **Scale fonts** based on content density:
   - Slides with less content: Larger fonts (1rem base)
   - Dense slides: Smaller fonts (0.75rem base)

3. **Container sizing**:
   - Don't set explicit heights on content containers
   - Use `flex: 0 0 auto` for tight wrapping
   - Center with flexbox: `justify-content: center; align-items: center;`

## Debugging Print Issues

### If slides aren't showing in print:
1. Check browser console for errors during slide loading
2. Verify `beforeprint` event is firing (console.log output)
3. Inspect elements in DevTools with print media emulation:
   - DevTools → More Tools → Rendering → Emulate CSS media type → print
4. Check for conflicting CSS rules with specificity issues

### If content overflows:
1. Reduce font sizes in styles-print.css
2. Adjust padding/margins
3. Consider breaking content into multiple slides
4. Use `overflow: hidden` on slide-content as last resort

## File Purposes

| File | Purpose | Edit When |
|------|---------|-----------|
| `styles.css` | Main presentation structure | Adding new components or changing layout |
| `styles-print.css` | Print/PDF overrides | Fixing print-specific issues or sizing |
| `script.js` | Slide loading & print events | Changing slide behavior or navigation |
| `generate-pdf.js` | Automated PDF generation | Modifying PDF output settings |
| `slides/*.html` | Individual slide content | Updating presentation content |
| `config/slides.json` | Slide manifest | Adding/removing/reordering slides |

## Critical Rules

### Never Do:
- ❌ Add @media print blocks to styles.css
- ❌ Use vh/vw units in slide content
- ❌ Set fixed heights that might cause overflow
- ❌ Assume web view = print view

### Always Do:
- ✅ Test with Cmd+P after every change
- ✅ Keep all print rules in styles-print.css
- ✅ Use flexible layouts that adapt to content
- ✅ Verify all slides load before printing

## Quick Fixes

### "Only first slide shows in PDF"
```javascript
// Ensure beforeprint makes ALL slides visible
window.addEventListener('beforeprint', () => {
    document.querySelectorAll('.slide').forEach(slide => {
        slide.style.display = 'flex';
        slide.style.visibility = 'visible';
        slide.style.opacity = '1';
    });
});
```

### "Content is cut off"
```css
/* In styles-print.css */
@media print {
    .slide-content {
        font-size: 0.9rem;  /* Reduce base font */
        padding: 0.4in;     /* Reduce padding */
    }
}
```

### "Slides split across pages"
```css
@media print {
    .slide {
        page-break-inside: avoid !important;
        height: 8.5in !important;  /* Force exact height */
    }
}
```

## Final Checklist

Before presenting/submitting:
- [ ] All 10 slides visible in Chrome print preview
- [ ] No content overflow or cutoff
- [ ] Fonts are readable size (not too small)
- [ ] Images display properly
- [ ] Page breaks are clean (one slide per page)
- [ ] PDF file size is reasonable (<10MB)
- [ ] Tested on different screen sizes (print should be consistent)

---

*Remember: The web view is just a preview tool. The ONLY output that matters is the PDF from Chrome's print function.*