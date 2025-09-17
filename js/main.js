// Main JavaScript for Red Beard Remedy Website
// Enhanced functionality and interactivity

document.addEventListener('DOMContentLoaded', function() {
    
    // Mobile menu functionality
    initializeMobileMenu();
    
    // Smooth scrolling for navigation links
    initializeSmoothScrolling();
    
    // Form handling
    initializeContactForms();
    
    // Document download tracking
    initializeDownloadTracking();
    
    // Search and filter functionality
    initializeSearchAndFilter();
    
    // Analytics and user tracking
    initializeAnalytics();
    
    // Error handling and notifications
    initializeNotifications();
});

// Mobile Menu Functions
function initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            
            // Update aria attributes for accessibility
            const isOpen = !mobileMenu.classList.contains('hidden');
            mobileMenuBtn.setAttribute('aria-expanded', isOpen);
            mobileMenu.setAttribute('aria-hidden', !isOpen);
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!mobileMenu.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
                mobileMenu.classList.add('hidden');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                mobileMenu.setAttribute('aria-hidden', 'true');
            }
        });
    }
}

// Smooth Scrolling
function initializeSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault();
                
                // Close mobile menu if open
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu) {
                    mobileMenu.classList.remove('active');
                }
                
                // Smooth scroll to target
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update URL without causing page jump
                window.history.pushState(null, null, targetId);
            }
        });
    });
}

// Contact Form Handling
function initializeContactForms() {
    const contactForms = document.querySelectorAll('form[id*="contact"]');
    
    contactForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic form validation
            if (validateForm(this)) {
                // Show success message
                showNotification('Thank you for your message! We will respond within 24 hours.', 'success');
                
                // Reset form
                this.reset();
                
                // Track form submission
                trackEvent('contact_form_submission', {
                    form_type: this.id,
                    timestamp: new Date().toISOString()
                });
            } else {
                showNotification('Please fill in all required fields correctly.', 'error');
            }
        });
    });
}

// Form Validation
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('border-red-500');
        } else {
            field.classList.remove('border-red-500');
        }
        
        // Email validation
        if (field.type === 'email' && field.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value)) {
                isValid = false;
                field.classList.add('border-red-500');
            }
        }
    });
    
    return isValid;
}

// Document Download Tracking
function initializeDownloadTracking() {
    const downloadButtons = document.querySelectorAll('[data-download]');
    
    downloadButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const filename = this.getAttribute('data-download');
            const documentType = this.getAttribute('data-document-type') || 'unknown';
            
            // Track download attempt
            trackEvent('document_download', {
                filename: filename,
                document_type: documentType,
                timestamp: new Date().toISOString(),
                user_agent: navigator.userAgent
            });
            
            // Check if file exists before attempting download
            checkFileExists(filename).then(exists => {
                if (!exists) {
                    e.preventDefault();
                    showNotification('This document is currently being processed. Please check back soon.', 'info');
                    
                    // Redirect to processing status page
                    setTimeout(() => {
                        window.location.href = 'document-processing-status.html';
                    }, 2000);
                }
            });
        });
    });
}

// File Existence Check
async function checkFileExists(filename) {
    try {
        const response = await fetch(`assets/documents/${filename}`, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.log('File check failed:', error);
        return false;
    }
}

// Search and Filter Functionality
function initializeSearchAndFilter() {
    const searchInput = document.getElementById('content-search');
    const filterButtons = document.querySelectorAll('[data-filter]');
    const contentItems = document.querySelectorAll('[data-content-item]');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            filterContent(this.value, getActiveFilter());
        }, 300));
    }
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active filter
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const filterValue = this.getAttribute('data-filter');
            const searchValue = searchInput ? searchInput.value : '';
            
            filterContent(searchValue, filterValue);
        });
    });
}

function filterContent(searchTerm, filterCategory) {
    const contentItems = document.querySelectorAll('[data-content-item]');
    let visibleCount = 0;
    
    contentItems.forEach(item => {
        const title = item.querySelector('[data-title]')?.textContent?.toLowerCase() || '';
        const content = item.querySelector('[data-content]')?.textContent?.toLowerCase() || '';
        const category = item.getAttribute('data-category') || '';
        
        const matchesSearch = !searchTerm || 
            title.includes(searchTerm.toLowerCase()) || 
            content.includes(searchTerm.toLowerCase());
        
        const matchesFilter = !filterCategory || 
            filterCategory === 'all' || 
            category === filterCategory;
        
        if (matchesSearch && matchesFilter) {
            item.style.display = '';
            item.classList.add('fade-in');
            visibleCount++;
        } else {
            item.style.display = 'none';
            item.classList.remove('fade-in');
        }
    });
    
    // Update results count
    updateResultsCount(visibleCount);
}

function getActiveFilter() {
    const activeFilter = document.querySelector('[data-filter].active');
    return activeFilter ? activeFilter.getAttribute('data-filter') : 'all';
}

function updateResultsCount(count) {
    const resultsCounter = document.getElementById('results-count');
    if (resultsCounter) {
        resultsCounter.textContent = `${count} item${count !== 1 ? 's' : ''} found`;
    }
}

// Analytics and Event Tracking
function initializeAnalytics() {
    // Track page views
    trackEvent('page_view', {
        page: window.location.pathname,
        title: document.title,
        timestamp: new Date().toISOString(),
        referrer: document.referrer
    });
    
    // Track scroll depth
    let maxScroll = 0;
    window.addEventListener('scroll', debounce(function() {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;
            
            // Track significant scroll milestones
            if (maxScroll >= 25 && maxScroll < 50) {
                trackEvent('scroll_depth', { depth: '25%' });
            } else if (maxScroll >= 50 && maxScroll < 75) {
                trackEvent('scroll_depth', { depth: '50%' });
            } else if (maxScroll >= 75 && maxScroll < 100) {
                trackEvent('scroll_depth', { depth: '75%' });
            } else if (maxScroll >= 100) {
                trackEvent('scroll_depth', { depth: '100%' });
            }
        }
    }, 1000));
}

function trackEvent(eventName, eventData) {
    // Store events in localStorage for now
    // In production, this would send to analytics service
    try {
        const events = JSON.parse(localStorage.getItem('redbeard_analytics') || '[]');
        events.push({
            event: eventName,
            data: eventData,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 100 events to prevent storage bloat
        if (events.length > 100) {
            events.splice(0, events.length - 100);
        }
        
        localStorage.setItem('redbeard_analytics', JSON.stringify(events));
    } catch (error) {
        console.log('Analytics tracking failed:', error);
    }
}

// Notification System
function initializeNotifications() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(container);
    }
}

function showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `
        notification p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full
        ${type === 'success' ? 'bg-green-500 text-white' : 
          type === 'error' ? 'bg-red-500 text-white' : 
          type === 'warning' ? 'bg-yellow-500 text-white' : 
          'bg-blue-500 text-white'}
    `;
    
    notification.innerHTML = `
        <div class="flex items-center justify-between">
            <span>${message}</span>
            <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
        notification.classList.remove('translate-x-full');
    });
    
    // Auto remove after duration
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, duration);
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Error Handler
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    
    // Track error for debugging
    trackEvent('javascript_error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error?.stack
    });
});

// Service Worker Registration (for PWA functionality)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}
