# PDF Generation Guide

## Problem
The presentation uses viewport units (vh, vw) and responsive clamp() functions that don't translate well to PDF format, causing spacing issues.

## Solution
We've added a print-specific stylesheet (`styles-print.css`) that converts all relative units to fixed pixel values for proper PDF rendering.

## Method 1: Browser Print (Quick)
1. Open the presentation in your browser
2. Press `Cmd+P` (Mac) or `Ctrl+P` (Windows)
3. Settings:
   - Destination: Save as PDF
   - Layout: Landscape
   - Paper size: Letter
   - Margins: None
   - Background graphics: ✓ Enabled
4. Click "Save"

## Method 2: Puppeteer (Recommended)
```bash
# Install Puppeteer
npm install puppeteer

# Run the PDF generator
node generate-pdf.js
```
This will create `apex_presentation.pdf` with consistent spacing.

## Method 3: Command Line Tools

### Using wkhtmltopdf
```bash
# Install wkhtmltopdf
brew install wkhtmltopdf  # Mac
# or
apt-get install wkhtmltopdf  # Linux

# Generate PDF
wkhtmltopdf --enable-local-file-access \
  --print-media-type \
  --orientation Landscape \
  --page-size Letter \
  --margin-top 0 --margin-right 0 --margin-bottom 0 --margin-left 0 \
  index.html apex_presentation.pdf
```

### Using Chrome/Chromium headless
```bash
# Mac with Chrome
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless --disable-gpu \
  --print-to-pdf=apex_presentation.pdf \
  --print-to-pdf-no-header \
  --no-margins \
  file:///path/to/apex_panel_presentation/index.html
```

## Troubleshooting

### If spacing still looks off:
1. Clear browser cache
2. Make sure `styles-print.css` is loaded
3. Try different PDF generation methods
4. Adjust the fixed pixel values in `styles-print.css` if needed

### For best results:
- Use Puppeteer method (Method 2)
- Ensure all images are loaded before generating PDF
- Test on a standard Letter-size page (8.5" x 11")