#!/usr/bin/env node

/**
 * PDF Generation Script for Apex Presentation
 *
 * This script uses Puppeteer to generate a high-quality PDF
 * with proper spacing and formatting.
 *
 * Usage:
 * 1. Install dependencies: npm install puppeteer
 * 2. Run: node generate-pdf.js
 */

const puppeteer = require('puppeteer');
const path = require('path');
const http = require('http');
const fs = require('fs');

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

async function generatePDF() {
    console.log('Starting PDF generation...');

    // Start local server
    const server = await startServer();

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Set viewport to standard letter size ratio
        await page.setViewport({
            width: 1024,
            height: 768,
            deviceScaleFactor: 2
        });

        // Navigate to the presentation via local server
        await page.goto('http://localhost:8080', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Wait for slides to be loaded by the JavaScript
        await page.waitForFunction(
            () => {
                const slides = document.querySelectorAll('.slide');
                const loadingIndicator = document.querySelector('#loading-indicator');
                // Check if slides are loaded and loading indicator is hidden
                return slides.length > 0 &&
                       loadingIndicator &&
                       loadingIndicator.style.display === 'none';
            },
            { timeout: 15000 }
        );

        // Additional wait to ensure all content is rendered
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Add custom CSS for PDF generation
        await page.addStyleTag({
            content: `
                /* Override for PDF generation */
                .navigation { display: none !important; }
                .loading-indicator { display: none !important; }
                #loading-indicator { display: none !important; }

                /* Ensure each slide takes full page */
                .slide {
                    width: 100vw !important;
                    height: 100vh !important;
                    page-break-after: always !important;
                    page-break-inside: avoid !important;
                    box-sizing: border-box !important;
                    display: block !important;
                }

                /* Show all slides for PDF */
                .slide.inactive {
                    display: block !important;
                    opacity: 1 !important;
                    pointer-events: auto !important;
                }

                /* Fix any overflow issues */
                .slide-content {
                    overflow: hidden !important;
                }

                /* Ensure slide 1 new content is visible */
                .content-section {
                    margin-top: 0 !important;
                }

                /* Specific fix for Slide 3 - SAP badge spacing */
                #slide-3 .slide-content > div:nth-child(2) {
                    margin: 0 0 0.1rem 0 !important; /* minimal bottom gap */
                    justify-content: center !important;
                }

                /* Tighten the SAP badge itself */
                #slide-3 .slide-content > div:nth-child(2) span {
                    margin: 0 !important;
                    padding: 1px 3px !important; /* smaller padding inside the badge */
                }

                /* Also ensure no extra top margin on the grid that follows */
                #slide-3 .slide-content > div:nth-child(3) {
                    margin-top: 0 !important;
                }
            `
        });

        // Make all slides visible for PDF generation
        await page.evaluate(() => {
            // Remove any display:none or inactive classes
            document.querySelectorAll('.slide').forEach(slide => {
                slide.style.display = 'block';
                slide.classList.remove('inactive');
                slide.style.opacity = '1';
            });
        });

        // Generate PDF
        await page.pdf({
            path: 'apex_presentation.pdf',
            format: 'Letter',
            printBackground: true,
            displayHeaderFooter: false,
            margin: {
                top: '0',
                right: '0',
                bottom: '0',
                left: '0'
            },
            preferCSSPageSize: true
        });

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
generatePDF().catch(error => {
    console.error('Error generating PDF:', error);
    process.exit(1);
});