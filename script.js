// Presentation navigation script with dynamic slide loading
(function() {
    let currentSlide = 0;
    let slides = [];
    let totalSlides = 0;
    let slideConfig = null;
    let slidesLoaded = false;
    let slidesContainer = null;

    // Load slide configuration
    async function loadSlideConfig() {
        try {
            const response = await fetch('config/slides.json');
            if (!response.ok) {
                throw new Error(`Failed to load slide configuration: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading slide configuration:', error);
            // Fallback: return a basic configuration
            return {
                slides: [
                    { id: "slide-0", file: "slides/slide-00-title.html" }
                ]
            };
        }
    }

    // Load individual slide HTML
    async function loadSlideHTML(slideInfo) {
        try {
            const response = await fetch(slideInfo.file);
            if (!response.ok) {
                throw new Error(`Failed to load slide ${slideInfo.id}: ${response.statusText}`);
            }
            const html = await response.text();
            return html;
        } catch (error) {
            console.error(`Error loading slide ${slideInfo.id}:`, error);
            return `<div class="slide error" id="${slideInfo.id}">
                <div class="slide-content center-content">
                    <p>Error loading slide: ${slideInfo.file}</p>
                </div>
            </div>`;
        }
    }

    // Load all slides
    async function loadAllSlides() {
        const loadingIndicator = document.getElementById('loading-indicator');
        slidesContainer = document.getElementById('presentation-container');

        try {
            // Load configuration
            slideConfig = await loadSlideConfig();

            // Load all slide HTML files
            const slidePromises = slideConfig.slides.map(slideInfo => loadSlideHTML(slideInfo));
            const slideHTMLs = await Promise.all(slidePromises);

            // Insert slides into the container
            const slidesHTML = slideHTMLs.join('\n');

            // Remove loading indicator first
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }

            // Add slides to container (append to preserve any existing elements)
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = slidesHTML;
            while (tempDiv.firstChild) {
                slidesContainer.appendChild(tempDiv.firstChild);
            }

            // Get all slides
            slides = document.querySelectorAll('.slide');
            totalSlides = slides.length;
            slidesLoaded = true;

            // Initialize navigation
            initializeNavigation();

            console.log(`Successfully loaded ${totalSlides} slides`);

        } catch (error) {
            console.error('Error loading slides:', error);
            if (loadingIndicator) {
                loadingIndicator.innerHTML = '<div class="loading-text">Error loading presentation. Please refresh the page.</div>';
            }
        }
    }

    // Ensure all slides are loaded (no longer async - slides always in DOM)
    function ensureAllSlidesLoaded() {
        // Slides are already loaded on page init, just make them visible
        slides.forEach(slide => {
            slide.classList.add('print-visible');
        });
    }

    // Update navigation display
    function updateNavigation() {
        const currentSlideElement = document.getElementById('current-slide');
        const totalSlidesElement = document.getElementById('total-slides');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        if (currentSlideElement) currentSlideElement.textContent = currentSlide + 1;
        if (totalSlidesElement) totalSlidesElement.textContent = totalSlides;

        // Update button states
        if (prevBtn) prevBtn.disabled = currentSlide === 0;
        if (nextBtn) nextBtn.disabled = currentSlide === totalSlides - 1;
    }

    // Show specific slide
    function showSlide(index) {
        if (!slidesLoaded || index < 0 || index >= totalSlides) return;

        // Hide all slides
        slides.forEach(slide => {
            slide.classList.remove('active');
        });

        // Show target slide
        slides[index].classList.add('active');
        currentSlide = index;

        // Update navigation
        updateNavigation();

        // Update URL hash for bookmarking
        window.location.hash = `slide-${index}`;
    }

    // Navigation functions
    function nextSlide() {
        if (currentSlide < totalSlides - 1) {
            showSlide(currentSlide + 1);
        }
    }

    function prevSlide() {
        if (currentSlide > 0) {
            showSlide(currentSlide - 1);
        }
    }

    // Initialize navigation after slides are loaded
    function initializeNavigation() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!slidesLoaded) return;

            switch(e.key) {
                case 'ArrowRight':
                case ' ':  // Spacebar
                    e.preventDefault();
                    nextSlide();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    prevSlide();
                    break;
                case 'Home':
                    e.preventDefault();
                    showSlide(0);
                    break;
                case 'End':
                    e.preventDefault();
                    showSlide(totalSlides - 1);
                    break;
                case 'f':
                case 'F':
                    // Toggle fullscreen
                    if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen();
                    } else {
                        document.exitFullscreen();
                    }
                    break;
            }

            // Number keys for direct navigation
            if (e.key >= '0' && e.key <= '9') {
                const slideNum = parseInt(e.key);
                if (slideNum < totalSlides) {
                    showSlide(slideNum);
                }
            }
        });

        // Button navigation
        const nextBtn = document.getElementById('next-btn');
        const prevBtn = document.getElementById('prev-btn');

        if (nextBtn) nextBtn.addEventListener('click', nextSlide);
        if (prevBtn) prevBtn.addEventListener('click', prevSlide);

        // Touch/swipe navigation for mobile
        let touchStartX = 0;
        let touchEndX = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });

        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Swiped left
                    nextSlide();
                } else {
                    // Swiped right
                    prevSlide();
                }
            }
        }

        // Handle browser back/forward
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash;
            const match = hash.match(/slide-(\d+)/);
            if (match) {
                const slideIndex = parseInt(match[1]);
                if (slideIndex >= 0 && slideIndex < totalSlides && slideIndex !== currentSlide) {
                    showSlide(slideIndex);
                }
            }
        });

        // Check for initial slide from URL hash
        checkInitialSlide();
    }

    // Check for hash on load
    function checkInitialSlide() {
        const hash = window.location.hash;
        if (hash) {
            const match = hash.match(/slide-(\d+)/);
            if (match) {
                const slideIndex = parseInt(match[1]);
                if (slideIndex >= 0 && slideIndex < totalSlides) {
                    showSlide(slideIndex);
                    return;
                }
            }
        }
        // Default to first slide
        showSlide(0);
    }

    // Presentation timer (optional)
    let presentationTimer = null;
    let startTime = null;

    function startTimer() {
        startTime = Date.now();
        presentationTimer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            console.log(`Presentation time: ${minutes}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);
    }

    function stopTimer() {
        if (presentationTimer) {
            clearInterval(presentationTimer);
            presentationTimer = null;
        }
    }

    // Print support - simplified for immediate response
    window.addEventListener('beforeprint', () => {
        console.log('Preparing for print...');
        // Just add the printing class - slides are already in DOM
        document.body.classList.add('printing');
        // Force all slides to be visible immediately
        slides.forEach(slide => {
            slide.classList.add('print-visible');
        });
        console.log('Print preparation complete');
    });

    window.addEventListener('afterprint', () => {
        console.log('Print complete');
        // Remove printing class after print
        document.body.classList.remove('printing');
        // Remove print-visible class
        slides.forEach(slide => {
            slide.classList.remove('print-visible');
        });
        // Restore normal slide visibility
        showSlide(currentSlide);
    });

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAllSlides);
    } else {
        // DOM is already loaded
        loadAllSlides();
    }

    // Show instructions on first load
    const instructionsShown = sessionStorage.getItem('instructionsShown');
    if (!instructionsShown) {
        console.log('%c Presentation Controls:', 'font-weight: bold; font-size: 14px;');
        console.log('→ or Space: Next slide');
        console.log('←: Previous slide');
        console.log('Home: First slide');
        console.log('End: Last slide');
        console.log('F: Toggle fullscreen');
        console.log('0-9: Jump to slide');
        console.log('Ctrl+P: Print to PDF');
        sessionStorage.setItem('instructionsShown', 'true');
    }
})();