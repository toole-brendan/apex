#!/usr/bin/env node

/**
 * Screenshot-based PDF Generation Script for Apex Presentation
 *
 * This script takes screenshots of each slide as displayed in Chrome
 * and combines them into a PDF, ensuring exact visual fidelity.
 */

const puppeteer = require('puppeteer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Simple static file server
function startServer(port = 8080) {
    return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
            let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

            // Security: prevent directory traversal
            if (!filePath.startsWith(__dirname)) {
                res.writeHead(403);
                res.end('Forbidden');
                return;
            }

            // Determine content type
            const extname = path.extname(filePath).toLowerCase();
            const contentTypes = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js': 'application/javascript',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.svg': 'image/svg+xml'
            };
            const contentType = contentTypes[extname] || 'application/octet-stream';

            // Read and serve file
            fs.readFile(filePath, (error, content) => {
                if (error) {
                    if (error.code === 'ENOENT') {
                        res.writeHead(404);
                        res.end('File not found');
                    } else {
                        res.writeHead(500);
                        res.end('Server error');
                    }
                } else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content, 'utf-8');
                }
            });
        });

        server.listen(port, () => {
            console.log(`Local server started on port ${port}`);
            resolve(server);
        });
    });
}

async function generatePDFFromScreenshots() {
    console.log('Starting screenshot-based PDF generation...');

    // Start local server
    const server = await startServer();

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Set viewport to Letter size in landscape (11" x 8.5" at 96 DPI)
        // 11 inches * 96 DPI = 1056 pixels width
        // 8.5 inches * 96 DPI = 816 pixels height
        await page.setViewport({
            width: 1056,
            height: 816,
            deviceScaleFactor: 2  // High quality screenshots
        });

        // Navigate to the presentation
        await page.goto('http://localhost:8080', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Wait for slides to be loaded
        await page.waitForFunction(
            () => {
                const slides = document.querySelectorAll('.slide');
                const loadingIndicator = document.querySelector('#loading-indicator');
                return slides.length > 0 &&
                       loadingIndicator &&
                       loadingIndicator.style.display === 'none';
            },
            { timeout: 15000 }
        );

        // Get total number of slides
        const totalSlides = await page.evaluate(() => {
            return document.querySelectorAll('.slide').length;
        });

        console.log(`Found ${totalSlides} slides`);

        // Hide navigation for clean screenshots
        await page.evaluate(() => {
            const nav = document.querySelector('.navigation');
            if (nav) nav.style.display = 'none';
        });

        const screenshots = [];

        // Take screenshot of each slide
        for (let i = 0; i < totalSlides; i++) {
            console.log(`Capturing slide ${i + 1}/${totalSlides}...`);

            // Navigate to specific slide
            await page.evaluate((slideIndex) => {
                // Hide all slides
                document.querySelectorAll('.slide').forEach(slide => {
                    slide.classList.add('inactive');
                    slide.style.display = 'none';
                });

                // Show only the current slide
                const currentSlide = document.querySelectorAll('.slide')[slideIndex];
                if (currentSlide) {
                    currentSlide.classList.remove('inactive');
                    currentSlide.style.display = 'block';
                    currentSlide.style.opacity = '1';
                }
            }, i);

            // Wait a moment for any animations/rendering
            await new Promise(resolve => setTimeout(resolve, 500));

            // Take screenshot
            const screenshot = await page.screenshot({
                type: 'png',
                fullPage: false,  // Just the viewport
                encoding: 'binary'
            });

            screenshots.push(screenshot);
        }

        console.log('Creating PDF from screenshots...');

        // Create PDF from screenshots
        const doc = new PDFDocument({
            size: 'LETTER',
            layout: 'landscape',
            margin: 0
        });

        // Pipe to file
        const outputPath = 'apex_presentation.pdf';
        doc.pipe(fs.createWriteStream(outputPath));

        // Add each screenshot as a page
        screenshots.forEach((screenshot, index) => {
            if (index > 0) {
                doc.addPage();
            }

            // Save screenshot temporarily
            const tempPath = path.join(__dirname, `temp_slide_${index}.png`);
            fs.writeFileSync(tempPath, screenshot);

            // Add image to PDF (fill the page)
            doc.image(tempPath, 0, 0, {
                fit: [doc.page.width, doc.page.height],
                align: 'center',
                valign: 'center'
            });

            // Clean up temp file
            fs.unlinkSync(tempPath);
        });

        doc.end();

        console.log('✓ PDF generated successfully: apex_presentation.pdf');

    } catch (error) {
        console.error('Error during PDF generation:', error);
        throw error;
    } finally {
        await browser.close();
        server.close();
        console.log('Server closed');
    }
}

// Run the script
generatePDFFromScreenshots().catch(error => {
    console.error('Error generating PDF:', error);
    process.exit(1);
});