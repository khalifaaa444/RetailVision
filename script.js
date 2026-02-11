/* ===================================
   RetailVision - JavaScript Interactions
   =================================== */

document.addEventListener('DOMContentLoaded', function () {
    // Initialize all components
    initNavigation();
    initScrollAnimations();
    initCounters();
    initFormHandling();
    initSmoothScroll();
    initChartBarAnimation();
    initHeatmapAnimation();
    initScrollSpy();
    initBackToTop();
});

// Check if user prefers reduced motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ===================================
   Mobile Navigation
   =================================== */
function initNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');

    if (navToggle && navLinks) {
        // Create backdrop element for mobile nav
        const backdrop = document.createElement('div');
        backdrop.className = 'nav-backdrop';
        document.body.appendChild(backdrop);

        function toggleMobileNav() {
            const isOpen = navToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
            backdrop.classList.toggle('active');
            document.body.classList.toggle('nav-open', isOpen);
        }

        function closeMobileNav() {
            navToggle.classList.remove('active');
            navLinks.classList.remove('active');
            backdrop.classList.remove('active');
            document.body.classList.remove('nav-open');
        }

        navToggle.addEventListener('click', toggleMobileNav);

        // Close menu when clicking on a link
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', closeMobileNav);
        });

        // Close menu when clicking backdrop
        backdrop.addEventListener('click', closeMobileNav);

        // Close menu when clicking outside
        document.addEventListener('click', function (e) {
            if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
                closeMobileNav();
            }
        });

        // Close menu with Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                closeMobileNav();
                navToggle.focus();
            }
        });
    }

    // Navbar background on scroll
    const navbar = document.getElementById('navbar');
    if (navbar) {
        let ticking = false;
        window.addEventListener('scroll', function () {
            if (!ticking) {
                requestAnimationFrame(function () {
                    if (window.scrollY > 50) {
                        navbar.style.background = 'rgba(10, 15, 26, 0.95)';
                        navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    } else {
                        navbar.style.background = 'rgba(10, 15, 26, 0.8)';
                        navbar.style.boxShadow = 'none';
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
}

/* ===================================
   Scroll Animations
   =================================== */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Add stagger delay based on index within parent
                    const siblings = entry.target.parentElement.querySelectorAll('.animate-on-scroll');
                    const index = Array.from(siblings).indexOf(entry.target);
                    entry.target.style.transitionDelay = `${index * 0.1}s`;

                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animatedElements.forEach(el => observer.observe(el));
    } else {
        // Fallback for older browsers
        animatedElements.forEach(el => el.classList.add('visible'));
    }
}

/* ===================================
   Counter Animations
   =================================== */
function initCounters() {
    const counters = document.querySelectorAll('.counter');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.5
        });

        counters.forEach(counter => observer.observe(counter));
    } else {
        // Fallback - just show the numbers
        counters.forEach(counter => {
            counter.textContent = counter.getAttribute('data-target');
        });
    }
}

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'), 10);

    // Skip animation for reduced motion preference
    if (prefersReducedMotion) {
        element.textContent = formatNumber(target);
        return;
    }

    const duration = 2000; // 2 seconds
    const increment = target / (duration / (1000 / 60));
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = formatNumber(target);
            clearInterval(timer);
        } else {
            element.textContent = formatNumber(Math.floor(current));
        }
    }, 1000 / 60);
}

function formatNumber(num) {
    return num.toLocaleString();
}

/* ===================================
   Form Handling (Firebase Firestore)
   =================================== */
function initFormHandling() {
    const form = document.getElementById('demo-form');

    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Get form data
            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });

            // Validate
            if (!validateForm(data)) {
                return;
            }

            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span>Sending...</span>';
            submitBtn.disabled = true;
            submitBtn.classList.add('btn-loading');

            try {
                // Save to Firebase Firestore
                if (window.db) {
                    await window.db.collection('demo_requests').add({
                        name: data.name || '',
                        email: data.email || '',
                        storeType: data['store-type'] || '',
                        phone: data.phone || '',
                        company: data.company || '',
                        message: data.message || '',
                        submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        status: 'new'
                    });
                }

                // Show success message
                showFormSuccess(form);
            } catch (error) {
                console.error('Error submitting demo request:', error);
                // Show error message
                showFormError(form, 'Something went wrong. Please try again or contact us directly.');
            } finally {
                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                submitBtn.classList.remove('btn-loading');
            }
        });

        // Real-time validation
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function () {
                validateField(this);
            });

            input.addEventListener('input', function () {
                if (this.classList.contains('error')) {
                    validateField(this);
                }
            });
        });
    }
}

function validateForm(data) {
    let isValid = true;
    const form = document.getElementById('demo-form');

    // Validate name
    const nameInput = form.querySelector('#name');
    if (!data.name || data.name.trim().length < 2) {
        showFieldError(nameInput, 'Please enter your name');
        isValid = false;
    } else {
        clearFieldError(nameInput);
    }

    // Validate email
    const emailInput = form.querySelector('#email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
        showFieldError(emailInput, 'Please enter a valid email address');
        isValid = false;
    } else {
        clearFieldError(emailInput);
    }

    // Validate store type
    const storeTypeInput = form.querySelector('#store-type');
    if (!data['store-type']) {
        showFieldError(storeTypeInput, 'Please select your store type');
        isValid = false;
    } else {
        clearFieldError(storeTypeInput);
    }

    // Validate company
    const companyInput = form.querySelector('#company');
    if (!data.company || data.company.trim().length < 2) {
        showFieldError(companyInput, 'Please enter your company name');
        isValid = false;
    } else {
        clearFieldError(companyInput);
    }

    return isValid;
}

function validateField(field) {
    const value = field.value;
    const name = field.name;

    switch (name) {
        case 'name':
            if (!value || value.trim().length < 2) {
                showFieldError(field, 'Please enter your name');
            } else {
                clearFieldError(field);
            }
            break;
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value || !emailRegex.test(value)) {
                showFieldError(field, 'Please enter a valid email');
            } else {
                clearFieldError(field);
            }
            break;
        case 'store-type':
            if (!value) {
                showFieldError(field, 'Please select store type');
            } else {
                clearFieldError(field);
            }
            break;
        case 'company':
            if (!value || value.trim().length < 2) {
                showFieldError(field, 'Please enter your company name');
            } else {
                clearFieldError(field);
            }
            break;
    }
}

function showFieldError(field, message) {
    field.classList.add('error');

    // Remove existing error message
    const existingError = field.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    field.parentElement.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.classList.remove('error');

    const existingError = field.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
}

function showFormSuccess(form) {
    const successDiv = document.createElement('div');
    successDiv.className = 'form-success';
    successDiv.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style="margin: 0 auto 1rem;">
            <circle cx="24" cy="24" r="20" stroke="#22c55e" stroke-width="2"/>
            <path d="M16 24l6 6 10-12" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h3 style="color: #22c55e; font-size: 1.25rem; margin-bottom: 0.5rem;">Demo Request Received!</h3>
        <p style="color: #94a3b8; font-size: 0.875rem;">We'll get back to you within 24 hours.</p>
    `;

    form.style.display = 'none';
    form.parentElement.appendChild(successDiv);
}

function showFormError(form, message) {
    const existing = form.querySelector('.form-error-banner');
    if (existing) existing.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error-banner';
    errorDiv.textContent = message;
    form.prepend(errorDiv);

    setTimeout(() => errorDiv.remove(), 5000);
}

/* ===================================
   Smooth Scroll
   =================================== */
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');

            if (href === '#') return;

            const target = document.querySelector(href);

            if (target) {
                e.preventDefault();

                const navHeight = document.getElementById('navbar').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* ===================================
   Chart Bar Animation
   =================================== */
function initChartBarAnimation() {
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const bars = entry.target.querySelectorAll('.bar');
                    bars.forEach((bar, index) => {
                        setTimeout(() => {
                            bar.style.transform = 'scaleY(1)';
                        }, index * 100);
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.5
        });

        const chartContainers = document.querySelectorAll('.chart-bars');
        chartContainers.forEach(container => {
            // Initially hide bars
            container.querySelectorAll('.bar').forEach(bar => {
                bar.style.transform = 'scaleY(0)';
                bar.style.transformOrigin = 'bottom';
                bar.style.transition = 'transform 0.6s ease';
            });
            observer.observe(container);
        });
    }
}

/* ===================================
   Heatmap Cell Animation
   =================================== */
function initHeatmapAnimation() {
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const cells = entry.target.querySelectorAll('.heatmap-cell');
                    cells.forEach((cell, index) => {
                        cell.style.opacity = '0';
                        cell.style.transform = 'scale(0.8)';
                        setTimeout(() => {
                            cell.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                            cell.style.opacity = '1';
                            cell.style.transform = 'scale(1)';
                        }, index * 50);
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.3
        });

        const heatmapGrids = document.querySelectorAll('.heatmap-grid');
        heatmapGrids.forEach(grid => observer.observe(grid));
    }
}

/* ===================================
   Scroll Spy — Active Nav Highlighting
   =================================== */
function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinksAll = document.querySelectorAll('.nav-links a:not(.btn)');

    if (sections.length === 0 || navLinksAll.length === 0) return;

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    navLinksAll.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === '#' + id) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: '-80px 0px -50% 0px'
        });

        sections.forEach(section => observer.observe(section));
    }
}

/* ===================================
   Back to Top Button
   =================================== */
function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    let ticking = false;
    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(function () {
                if (window.scrollY > 400) {
                    btn.classList.add('visible');
                } else {
                    btn.classList.remove('visible');
                }
                ticking = false;
            });
            ticking = true;
        }
    });

    btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}
