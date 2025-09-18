// Enhanced PWA Features and Analytics Dashboard
// Advanced mobile app functionality and traffic tracking

class PWAManager {
    constructor() {
        this.installPrompt = null;
        this.isInstalled = false;
        this.registration = null;
        this.analytics = new AnalyticsManager();
        this.init();
    }

    init() {
        this.checkInstallation();
        this.setupServiceWorker();
        this.setupInstallPrompt();
        this.setupAppShortcuts();
        this.trackAppUsage();
        this.createInstallBanner();
    }

    // Service Worker Management
    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                this.registration = await navigator.serviceWorker.register('/sw.js');
                console.log('PWA: Service Worker registered successfully');
                
                // Listen for updates
                this.registration.addEventListener('updatefound', () => {
                    console.log('PWA: New version available');
                    this.showUpdateNotification();
                });

                // Enable background sync
                if ('sync' in window.ServiceWorkerRegistration.prototype) {
                    this.setupBackgroundSync();
                }

                // Setup push notifications (future feature)
                this.setupPushNotifications();

            } catch (error) {
                console.error('PWA: Service Worker registration failed:', error);
            }
        }
    }

    setupBackgroundSync() {
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'BACKGROUND_SYNC') {
                console.log('PWA: Background sync completed');
            }
        });
    }

    // Installation Management
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.installPrompt = e;
            this.showInstallBanner();
            console.log('PWA: Install prompt ready');
        });

        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.hideInstallBanner();
            this.analytics.trackEvent('pwa_installed');
            console.log('PWA: App installed successfully');
        });
    }

    checkInstallation() {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true) {
            this.isInstalled = true;
            console.log('PWA: App is installed');
        }
    }

    createInstallBanner() {
        const bannerHTML = `
            <div id="pwa-install-banner" class="fixed top-0 left-0 right-0 bg-gradient-to-r from-burgundy to-red-800 text-white p-3 z-50 transform -translate-y-full transition-transform duration-300 hidden">
                <div class="max-w-7xl mx-auto px-4 flex items-center justify-between">
                    <div class="flex items-center">
                        <img src="assets/images/icon-192.png" alt="App Icon" class="h-8 w-8 rounded mr-3">
                        <div>
                            <p class="text-sm font-semibold">Install Redbeards Remedy App</p>
                            <p class="text-xs text-red-100">Get offline access & faster loading</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3">
                        <button id="install-pwa-btn" class="bg-gold text-burgundy px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-400 transition-colors">
                            <i class="fas fa-download mr-1"></i>Install
                        </button>
                        <button id="dismiss-install-banner" class="text-red-100 hover:text-white">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('afterbegin', bannerHTML);

        // Bind events
        document.getElementById('install-pwa-btn')?.addEventListener('click', () => {
            this.promptInstall();
        });

        document.getElementById('dismiss-install-banner')?.addEventListener('click', () => {
            this.hideInstallBanner();
            localStorage.setItem('pwa-install-dismissed', 'true');
        });
    }

    showInstallBanner() {
        if (this.isInstalled || localStorage.getItem('pwa-install-dismissed')) {
            return;
        }

        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            banner.classList.remove('hidden');
            setTimeout(() => {
                banner.classList.remove('-translate-y-full');
            }, 100);
        }
    }

    hideInstallBanner() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            banner.classList.add('-translate-y-full');
            setTimeout(() => {
                banner.classList.add('hidden');
            }, 300);
        }
    }

    async promptInstall() {
        if (!this.installPrompt) {
            this.showNotification('Installation not available on this device', 'info');
            return;
        }

        const result = await this.installPrompt.prompt();
        console.log('PWA: Install prompt result:', result.outcome);
        
        if (result.outcome === 'accepted') {
            this.analytics.trackEvent('pwa_install_accepted');
        } else {
            this.analytics.trackEvent('pwa_install_declined');
        }

        this.installPrompt = null;
    }

    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 left-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-arrow-up text-lg mr-3"></i>
                <div class="flex-1">
                    <p class="font-semibold">Update Available</p>
                    <p class="text-sm text-blue-100">A new version is ready to install</p>
                </div>
                <button id="update-app-btn" class="ml-3 bg-white text-blue-500 px-3 py-1 rounded text-sm hover:bg-blue-50">
                    Update
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        document.getElementById('update-app-btn')?.addEventListener('click', () => {
            window.location.reload();
        });

        setTimeout(() => {
            notification.remove();
        }, 10000);
    }

    // App Shortcuts and Deep Links
    setupAppShortcuts() {
        // Handle URL parameters for shortcuts
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.get('chat') === 'open') {
            // Open chat from shortcut
            setTimeout(() => {
                if (window.liveChatSystem) {
                    window.liveChatSystem.openChat();
                }
            }, 1000);
        }

        if (urlParams.get('action') === 'new-post') {
            // Open new blog post from shortcut
            setTimeout(() => {
                if (window.blogSystem) {
                    window.blogSystem.openNewPostModal();
                }
            }, 1000);
        }
    }

    // App Usage Analytics
    trackAppUsage() {
        // Track session start
        this.analytics.trackEvent('app_session_start', {
            installed: this.isInstalled,
            display_mode: this.getDisplayMode()
        });

        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.analytics.trackEvent('app_backgrounded');
            } else {
                this.analytics.trackEvent('app_foregrounded');
            }
        });

        // Track app focus/blur
        window.addEventListener('focus', () => {
            this.analytics.trackEvent('app_focused');
        });

        window.addEventListener('blur', () => {
            this.analytics.trackEvent('app_blurred');
        });
    }

    getDisplayMode() {
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return 'standalone';
        }
        if (window.matchMedia('(display-mode: minimal-ui)').matches) {
            return 'minimal-ui';
        }
        if (window.matchMedia('(display-mode: fullscreen)').matches) {
            return 'fullscreen';
        }
        return 'browser-tab';
    }

    // Push Notifications (Future Feature)
    async setupPushNotifications() {
        if ('PushManager' in window && 'Notification' in window) {
            // Request notification permission
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('PWA: Notification permission granted');
                // Setup push subscription (implement when backend ready)
            }
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${
                    type === 'success' ? 'fa-check-circle' :
                    type === 'error' ? 'fa-exclamation-circle' :
                    'fa-info-circle'
                } mr-3"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Enhanced Analytics Manager
class AnalyticsManager {
    constructor() {
        this.sessionId = this.getSessionId();
        this.visitorId = this.getVisitorId();
        this.pageStartTime = Date.now();
        this.scrollDepth = 0;
        this.isTrackingScroll = false;
        this.init();
    }

    init() {
        this.trackPageView();
        this.setupScrollTracking();
        this.setupClickTracking();
        this.setupFormTracking();
        this.setupTimeTracking();
    }

    // Core Analytics Tracking
    async trackEvent(eventType, data = {}) {
        const analyticsData = {
            id: this.generateId(),
            page_url: window.location.href,
            visitor_id: this.visitorId,
            session_id: this.sessionId,
            action_type: eventType,
            referrer: document.referrer,
            user_agent: navigator.userAgent,
            device_type: this.getDeviceType(),
            country: await this.getCountry(),
            ip_address: await this.getIP(),
            time_on_page: Math.round((Date.now() - this.pageStartTime) / 1000),
            scroll_depth: this.scrollDepth,
            timestamp: new Date().toISOString(),
            ...data
        };

        try {
            await this.sendAnalytics(analyticsData);
        } catch (error) {
            console.error('Analytics error:', error);
            // Cache for later if offline
            this.cacheAnalyticsOffline(analyticsData);
        }
    }

    async sendAnalytics(data) {
        const response = await fetch('tables/site_analytics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Analytics request failed');
        }
    }

    cacheAnalyticsOffline(data) {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'CACHE_ANALYTICS',
                payload: data
            });
        }
    }

    // Detailed Tracking Methods
    trackPageView() {
        this.trackEvent('page_view', {
            page_title: document.title,
            page_path: window.location.pathname
        });
    }

    setupScrollTracking() {
        let ticking = false;
        
        const updateScrollDepth = () => {
            const scrollTop = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = Math.round((scrollTop / docHeight) * 100);
            
            if (scrollPercent > this.scrollDepth) {
                this.scrollDepth = Math.min(scrollPercent, 100);
                
                // Track milestone scroll depths
                if ([25, 50, 75, 90, 100].includes(this.scrollDepth)) {
                    this.trackEvent('scroll_depth', {
                        depth_percent: this.scrollDepth
                    });
                }
            }
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollDepth);
                ticking = true;
            }
        });
    }

    setupClickTracking() {
        document.addEventListener('click', (event) => {
            const element = event.target.closest('a, button');
            if (element) {
                const elementData = {
                    element_type: element.tagName.toLowerCase(),
                    element_text: element.textContent?.trim().substring(0, 100),
                    element_id: element.id,
                    element_class: element.className
                };

                if (element.tagName === 'A') {
                    elementData.link_url = element.href;
                    this.trackEvent('link_click', elementData);
                } else if (element.tagName === 'BUTTON') {
                    this.trackEvent('button_click', elementData);
                }
            }
        });
    }

    setupFormTracking() {
        document.addEventListener('submit', (event) => {
            const form = event.target;
            if (form.tagName === 'FORM') {
                this.trackEvent('form_submit', {
                    form_id: form.id,
                    form_action: form.action,
                    form_method: form.method
                });
            }
        });

        // Track form field interactions
        document.addEventListener('focus', (event) => {
            if (event.target.matches('input, textarea, select')) {
                this.trackEvent('form_field_focus', {
                    field_type: event.target.type,
                    field_name: event.target.name,
                    field_id: event.target.id
                });
            }
        });
    }

    setupTimeTracking() {
        // Track time spent on page
        setInterval(() => {
            if (!document.hidden) {
                this.trackEvent('time_on_page', {
                    seconds: Math.round((Date.now() - this.pageStartTime) / 1000)
                });
            }
        }, 30000); // Every 30 seconds

        // Track exit intent
        window.addEventListener('beforeunload', () => {
            this.trackEvent('page_exit', {
                total_time: Math.round((Date.now() - this.pageStartTime) / 1000)
            });
        });
    }

    // Utility Methods
    async getCountry() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            return data.country_name || 'Unknown';
        } catch {
            return 'Unknown';
        }
    }

    async getIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip || 'Unknown';
        } catch {
            return 'Unknown';
        }
    }

    getDeviceType() {
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    }

    getVisitorId() {
        let visitorId = localStorage.getItem('visitor_id');
        if (!visitorId) {
            visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('visitor_id', visitorId);
        }
        return visitorId;
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('session_id', sessionId);
        }
        return sessionId;
    }

    generateId() {
        return 'analytics_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Analytics Dashboard Data Methods
    async getDashboardData() {
        try {
            const [visitors, pageViews, topPages, deviceTypes, countries] = await Promise.all([
                this.getVisitorStats(),
                this.getPageViewStats(),
                this.getTopPages(),
                this.getDeviceStats(),
                this.getCountryStats()
            ]);

            return {
                visitors,
                pageViews,
                topPages,
                deviceTypes,
                countries,
                realTimeUsers: await this.getRealTimeUsers()
            };
        } catch (error) {
            console.error('Dashboard data error:', error);
            return null;
        }
    }

    async getVisitorStats() {
        const response = await fetch('tables/site_analytics?action_type=page_view&limit=1000');
        const data = await response.json();
        
        const today = new Date();
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const todayVisitors = new Set();
        const yesterdayVisitors = new Set();
        const weekVisitors = new Set();

        data.data?.forEach(record => {
            const recordDate = new Date(record.created_at);
            if (recordDate >= today.setHours(0, 0, 0, 0)) {
                todayVisitors.add(record.visitor_id);
            }
            if (recordDate >= yesterday && recordDate < today.setHours(0, 0, 0, 0)) {
                yesterdayVisitors.add(record.visitor_id);
            }
            if (recordDate >= lastWeek) {
                weekVisitors.add(record.visitor_id);
            }
        });

        return {
            today: todayVisitors.size,
            yesterday: yesterdayVisitors.size,
            week: weekVisitors.size,
            total: new Set(data.data?.map(r => r.visitor_id)).size
        };
    }

    async getPageViewStats() {
        const response = await fetch('tables/site_analytics?action_type=page_view&limit=1000');
        const data = await response.json();
        
        // Process page view data by date
        const pageViews = {};
        data.data?.forEach(record => {
            const date = new Date(record.created_at).toDateString();
            pageViews[date] = (pageViews[date] || 0) + 1;
        });

        return pageViews;
    }

    async getRealTimeUsers() {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const response = await fetch(`tables/site_analytics?created_at>${fiveMinutesAgo}&limit=100`);
        const data = await response.json();
        
        const activeUsers = new Set(data.data?.map(r => r.visitor_id));
        return activeUsers.size;
    }
}

// Initialize PWA Manager
document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAManager();
});
