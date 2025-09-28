const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');
const path = require('path');
const fs = require('fs');

async function generatePDF() {
  console.log('🚀 Generating PDF presentation...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Set viewport to match slide design
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2
    });

    // Important: We need to serve the files via HTTP for fetch to work
    // Start a simple HTTP server
    const express = require('express');
    const app = express();
    app.use(express.static(__dirname));
    const server = app.listen(0); // Random port
    const port = server.address().port;

    console.log(`📡 Started local server on port ${port}`);

    // Load the presentation via HTTP
    const presentationUrl = `http://localhost:${port}/index.html`;
    await page.goto(presentationUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for slides to be dynamically loaded
    console.log('⏳ Waiting for slides to load...');
    await page.waitForFunction(
      () => {
        // Check if slides are loaded
        const slides = document.querySelectorAll('.slide');
        // Should have 11 slides (0-10) and none should have error class
        return slides.length === 11 && !document.querySelector('.slide.error');
      },
      { timeout: 10000 }
    );

    // Additional wait to ensure all content is rendered
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Inject CSS to ensure slides are properly sized and visible when shown
    await page.addStyleTag({
      content: `
        /* Override print styles to ensure visibility control works */
        @media print {
          .slide {
            display: none !important;
          }
          .slide.pdf-visible {
            display: flex !important;
          }
        }
        /* Ensure slides fill the viewport when visible */
        .slide.pdf-visible {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 9999 !important;
        }
      `
    });

    console.log('📄 Capturing slides...');

    // Create array to store PDF buffers
    const pdfBuffers = [];

    for (let i = 0; i <= 10; i++) {
      // Use forced inline styles to ensure visibility
      await page.evaluate((slideNum) => {
        const slides = document.querySelectorAll('.slide');

        // First, hide ALL slides using inline styles (most important!)
        slides.forEach((slide) => {
          slide.style.display = 'none';
          slide.style.visibility = 'hidden';
          slide.style.opacity = '0';
          slide.style.position = 'absolute';
          slide.classList.remove('active');
          slide.classList.remove('pdf-visible');
        });

        // Then show ONLY the target slide
        if (slides[slideNum]) {
          const targetSlide = slides[slideNum];
          targetSlide.style.display = 'flex';
          targetSlide.style.visibility = 'visible';
          targetSlide.style.opacity = '1';
          targetSlide.style.position = 'fixed';
          targetSlide.style.top = '0';
          targetSlide.style.left = '0';
          targetSlide.style.width = '100vw';
          targetSlide.style.height = '100vh';
          targetSlide.style.zIndex = '9999';
          targetSlide.classList.add('active');
          targetSlide.classList.add('pdf-visible');

          // Force a reflow to ensure styles are applied
          targetSlide.offsetHeight;
        }

        // Hide navigation controls
        const nav = document.querySelector('.navigation');
        if (nav) nav.style.display = 'none';
      }, i);

      // Wait for slide to render and ensure layout is complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Force another reflow/repaint
      await page.evaluate(() => {
        document.body.style.display = 'none';
        document.body.offsetHeight;
        document.body.style.display = '';
      });

      // Verify the correct slide is visible and get detailed info
      const slideVerification = await page.evaluate((expectedIndex) => {
        const slides = document.querySelectorAll('.slide');
        const targetSlide = slides[expectedIndex];

        if (!targetSlide) {
          return { error: `No slide found at index ${expectedIndex}` };
        }

        const computedStyle = window.getComputedStyle(targetSlide);
        const isVisible = computedStyle.display !== 'none' &&
                         computedStyle.visibility !== 'hidden' &&
                         computedStyle.opacity !== '0';

        // Get title from various possible selectors
        let title = targetSlide.querySelector('.slide-title')?.textContent ||
                   targetSlide.querySelector('.title-main')?.textContent ||
                   targetSlide.querySelector('h1')?.textContent ||
                   'No title';

        // Check if other slides are hidden
        let otherSlidesHidden = true;
        slides.forEach((slide, idx) => {
          if (idx !== expectedIndex) {
            const style = window.getComputedStyle(slide);
            if (style.display !== 'none') {
              otherSlidesHidden = false;
            }
          }
        });

        return {
          id: targetSlide.id,
          title: title.trim(),
          index: expectedIndex,
          isVisible: isVisible,
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          hasContent: targetSlide.innerHTML.length > 100,
          otherSlidesHidden: otherSlidesHidden
        };
      }, i);

      // Log verification details
      if (slideVerification.error) {
        console.error(`  ❌ Error on slide ${i}: ${slideVerification.error}`);
        continue;
      }

      if (!slideVerification.isVisible) {
        console.warn(`  ⚠️  Slide ${i} not visible! Display: ${slideVerification.display}, Visibility: ${slideVerification.visibility}, Opacity: ${slideVerification.opacity}`);
      }

      if (!slideVerification.otherSlidesHidden) {
        console.warn(`  ⚠️  Other slides still visible when showing slide ${i}`);
      }

      // Take a screenshot first for debugging (optional)
      // await page.screenshot({ path: `debug-slide-${i}.png` });

      // Generate PDF for this slide with improved settings
      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        preferCSSPageSize: false,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        scale: 0.75, // Slightly scale down to ensure content fits
        displayHeaderFooter: false,
        pageRanges: '1'
      });

      pdfBuffers.push(pdfBuffer);
      process.stdout.write(`  Slide ${i + 1}/11 - ${slideVerification.title} (${slideVerification.id}) ✓\n`);
    }

    console.log('\n📑 Merging slides into final PDF...');

    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    // Add each slide as a page
    for (let i = 0; i < pdfBuffers.length; i++) {
      const pdf = await PDFDocument.load(pdfBuffers[i]);
      const [firstPage] = await mergedPdf.copyPages(pdf, [0]);
      mergedPdf.addPage(firstPage);
    }

    // Save the merged PDF
    const mergedPdfBytes = await mergedPdf.save();
    fs.writeFileSync('apex_presentation.pdf', mergedPdfBytes);

    // Verify the page count
    const finalPageCount = mergedPdf.getPageCount();
    console.log(`\n📊 Final PDF has ${finalPageCount} pages`);

    console.log('✅ Success! Created: apex_presentation.pdf\n');

    // Close the server
    server.close();

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
  } finally {
    await browser.close();
  }
}

// Run the generator
generatePDF().catch(console.error);