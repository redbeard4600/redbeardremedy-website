// Analytics Dashboard for Redbeards Remedy
// Real-time analytics and performance tracking

class AnalyticsDashboard {
    constructor() {
        this.charts = {};
        this.refreshInterval = null;
        this.isLoading = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDashboardData();
        this.setupAutoRefresh();
        this.setupRealTimeUpdates();
    }

    bindEvents() {
        document.getElementById('refresh-data')?.addEventListener('click', () => {
            this.loadDashboardData(true);
        });

        document.getElementById('export-data')?.addEventListener('click', () => {
            this.exportAnalyticsData();
        });

        // Auto-refresh toggle (future feature)
        window.addEventListener('focus', () => {
            if (!this.refreshInterval) {
                this.setupAutoRefresh();
            }
        });

        window.addEventListener('blur', () => {
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }
        });
    }

    async loadDashboardData(forceRefresh = false) {
        if (this.isLoading && !forceRefresh) return;
        
        this.isLoading = true;
        this.showLoading();

        try {
            const [
                analyticsData,
                blogData,
                chatData
            ] = await Promise.all([
                this.getAnalyticsData(),
                this.getBlogData(),
                this.getChatData()
            ]);

            this.updateKeyMetrics(analyticsData);
            this.updateCharts(analyticsData);
            this.updateTopPages(analyticsData.topPages);
            this.updateDeviceChart(analyticsData.deviceTypes);
            this.updateCountriesList(analyticsData.countries);
            this.updateBlogPerformance(blogData);
            this.updateChatAnalytics(chatData);
            this.updateRealTimeStats(analyticsData);

        } catch (error) {
            console.error('Dashboard load error:', error);
            this.showError('Failed to load analytics data');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    async getAnalyticsData() {
        const [
            totalResponse,
            todayResponse,
            yesterdayResponse,
            weekResponse
        ] = await Promise.all([
            fetch('tables/site_analytics?limit=10000'),
            fetch(`tables/site_analytics?created_at>${this.getTodayStart()}&limit=1000`),
            fetch(`tables/site_analytics?created_at>${this.getYesterdayStart()}&created_at<${this.getTodayStart()}&limit=1000`),
            fetch(`tables/site_analytics?created_at>${this.getWeekStart()}&limit=5000`)
        ]);

        const [totalData, todayData, yesterdayData, weekData] = await Promise.all([
            totalResponse.json(),
            todayResponse.json(),
            yesterdayResponse.json(),
            weekResponse.json()
        ]);

        return this.processAnalyticsData(totalData.data, todayData.data, yesterdayData.data, weekData.data);
    }

    processAnalyticsData(totalData, todayData, yesterdayData, weekData) {
        // Process visitor data
        const totalVisitors = new Set(totalData?.map(r => r.visitor_id) || []).size;
        const todayVisitors = new Set(todayData?.map(r => r.visitor_id) || []).size;
        const yesterdayVisitors = new Set(yesterdayData?.map(r => r.visitor_id) || []).size;
        const weekVisitors = new Set(weekData?.map(r => r.visitor_id) || []).size;

        // Process page views
        const totalPageViews = totalData?.filter(r => r.action_type === 'page_view').length || 0;
        const todayPageViews = todayData?.filter(r => r.action_type === 'page_view').length || 0;
        const yesterdayPageViews = yesterdayData?.filter(r => r.action_type === 'page_view').length || 0;

        // Top pages
        const pageViews = {};
        totalData?.forEach(record => {
            if (record.action_type === 'page_view') {
                const page = this.getPageTitle(record.page_url);
                pageViews[page] = (pageViews[page] || 0) + 1;
            }
        });

        const topPages = Object.entries(pageViews)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([page, views]) => ({ page, views }));

        // Device types
        const deviceTypes = {};
        totalData?.forEach(record => {
            const device = record.device_type || 'unknown';
            deviceTypes[device] = (deviceTypes[device] || 0) + 1;
        });

        // Countries
        const countries = {};
        totalData?.forEach(record => {
            const country = record.country || 'Unknown';
            countries[country] = (countries[country] || 0) + 1;
        });

        const topCountries = Object.entries(countries)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([country, visits]) => ({ country, visits }));

        // Time series data for charts
        const dailyData = this.processTimeSeriesData(weekData);

        // Real-time users (active in last 5 minutes)
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        const realTimeUsers = new Set(
            totalData?.filter(r => new Date(r.created_at).getTime() > fiveMinutesAgo)
                .map(r => r.visitor_id) || []
        ).size;

        // Bounce rate calculation
        const sessions = {};
        totalData?.forEach(record => {
            if (!sessions[record.session_id]) {
                sessions[record.session_id] = [];
            }
            sessions[record.session_id].push(record);
        });

        const bounces = Object.values(sessions).filter(session => 
            session.filter(r => r.action_type === 'page_view').length === 1
        ).length;
        const bounceRate = sessions.length ? Math.round((bounces / Object.keys(sessions).length) * 100) : 0;

        return {
            visitors: {
                total: totalVisitors,
                today: todayVisitors,
                yesterday: yesterdayVisitors,
                week: weekVisitors,
                change: yesterdayVisitors ? Math.round(((todayVisitors - yesterdayVisitors) / yesterdayVisitors) * 100) : 0
            },
            pageViews: {
                total: totalPageViews,
                today: todayPageViews,
                yesterday: yesterdayPageViews,
                change: yesterdayPageViews ? Math.round(((todayPageViews - yesterdayPageViews) / yesterdayPageViews) * 100) : 0
            },
            topPages,
            deviceTypes,
            countries: topCountries,
            dailyData,
            realTimeUsers,
            bounceRate
        };
    }

    processTimeSeriesData(weekData) {
        const dailyStats = {};
        
        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dailyStats[dateStr] = { visitors: new Set(), pageViews: 0 };
        }

        // Process data
        weekData?.forEach(record => {
            const date = new Date(record.created_at).toISOString().split('T')[0];
            if (dailyStats[date]) {
                dailyStats[date].visitors.add(record.visitor_id);
                if (record.action_type === 'page_view') {
                    dailyStats[date].pageViews++;
                }
            }
        });

        // Convert to chart format
        const labels = Object.keys(dailyStats).map(date => 
            new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        );
        
        const visitorsData = Object.values(dailyStats).map(day => day.visitors.size);
        const pageViewsData = Object.values(dailyStats).map(day => day.pageViews);

        return { labels, visitorsData, pageViewsData };
    }

    async getBlogData() {
        const response = await fetch('tables/blog_posts?limit=100');
        const data = await response.json();
        return data.data || [];
    }

    async getChatData() {
        const response = await fetch('tables/chat_sessions?limit=1000');
        const data = await response.json();
        return data.data || [];
    }

    updateKeyMetrics(data) {
        // Update metric cards
        document.getElementById('total-visitors').textContent = this.formatNumber(data.visitors.total);
        document.getElementById('visitors-change').textContent = `${data.visitors.change >= 0 ? '+' : ''}${data.visitors.change}%`;
        document.getElementById('visitors-change').className = `text-sm ${data.visitors.change >= 0 ? 'text-green-500' : 'text-red-500'}`;

        document.getElementById('total-pageviews').textContent = this.formatNumber(data.pageViews.total);
        document.getElementById('pageviews-change').textContent = `${data.pageViews.change >= 0 ? '+' : ''}${data.pageViews.change}%`;
        document.getElementById('pageviews-change').className = `text-sm ${data.pageViews.change >= 0 ? 'text-green-500' : 'text-red-500'}`;
    }

    updateRealTimeStats(data) {
        document.getElementById('realtime-users').textContent = data.realTimeUsers;
        document.getElementById('today-visitors').textContent = this.formatNumber(data.visitors.today);
        document.getElementById('today-pageviews').textContent = this.formatNumber(data.pageViews.today);
        document.getElementById('bounce-rate').textContent = `${data.bounceRate}%`;
    }

    updateCharts(data) {
        this.createVisitorsChart(data.dailyData);
        this.createPageViewsChart(data.dailyData);
    }

    createVisitorsChart(dailyData) {
        const ctx = document.getElementById('visitorsChart').getContext('2d');
        
        if (this.charts.visitors) {
            this.charts.visitors.destroy();
        }

        this.charts.visitors = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dailyData.labels,
                datasets: [{
                    label: 'Unique Visitors',
                    data: dailyData.visitorsData,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    createPageViewsChart(dailyData) {
        const ctx = document.getElementById('pageViewsChart').getContext('2d');
        
        if (this.charts.pageViews) {
            this.charts.pageViews.destroy();
        }

        this.charts.pageViews = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dailyData.labels,
                datasets: [{
                    label: 'Page Views',
                    data: dailyData.pageViewsData,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    updateDeviceChart(deviceTypes) {
        const ctx = document.getElementById('deviceChart').getContext('2d');
        
        if (this.charts.devices) {
            this.charts.devices.destroy();
        }

        const deviceLabels = Object.keys(deviceTypes);
        const deviceData = Object.values(deviceTypes);
        const colors = ['#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#3B82F6'];

        this.charts.devices = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: deviceLabels.map(label => this.capitalizeFirst(label)),
                datasets: [{
                    data: deviceData,
                    backgroundColor: colors.slice(0, deviceLabels.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateTopPages(topPages) {
        const container = document.getElementById('top-pages-list');
        container.innerHTML = '';

        topPages.forEach((page, index) => {
            const pageElement = document.createElement('div');
            pageElement.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
            pageElement.innerHTML = `
                <div class="flex items-center">
                    <span class="w-6 h-6 bg-burgundy text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                        ${index + 1}
                    </span>
                    <div>
                        <p class="font-medium text-gray-900 truncate" title="${page.page}">${page.page}</p>
                        <p class="text-sm text-gray-500">${this.formatNumber(page.views)} views</p>
                    </div>
                </div>
                <i class="fas fa-external-link-alt text-gray-400"></i>
            `;
            container.appendChild(pageElement);
        });
    }

    updateCountriesList(countries) {
        const container = document.getElementById('countries-list');
        container.innerHTML = '';

        countries.forEach((country, index) => {
            const countryElement = document.createElement('div');
            countryElement.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
            countryElement.innerHTML = `
                <div class="flex items-center">
                    <span class="w-6 h-6 bg-burgundy text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                        ${index + 1}
                    </span>
                    <div>
                        <p class="font-medium text-gray-900">${country.country}</p>
                        <p class="text-sm text-gray-500">${this.formatNumber(country.visits)} visits</p>
                    </div>
                </div>
            `;
            container.appendChild(countryElement);
        });
    }

    updateBlogPerformance(blogData) {
        const tableBody = document.getElementById('blog-performance-table');
        tableBody.innerHTML = '';

        // Update total posts metric
        document.getElementById('total-posts').textContent = blogData.length;
        document.getElementById('posts-change').textContent = '+0%'; // Calculate based on time period

        blogData.sort((a, b) => (b.views || 0) - (a.views || 0)).forEach(post => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900 truncate max-w-xs" title="${post.title}">
                        ${post.title}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${this.formatNumber(post.views || 0)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${this.getCategoryColor(post.category)}-100 text-${this.getCategoryColor(post.category)}-800">
                        ${post.category}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${this.formatDate(post.publish_date || post.created_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${post.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                        ${post.published ? 'Published' : 'Draft'}
                    </span>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    updateChatAnalytics(chatData) {
        // Update total chats metric
        document.getElementById('total-chats').textContent = chatData.length;
        document.getElementById('chats-change').textContent = '+0%'; // Calculate based on time period

        // Calculate average duration
        const completedSessions = chatData.filter(chat => chat.end_time && chat.start_time);
        const avgDuration = completedSessions.length ? 
            completedSessions.reduce((sum, chat) => {
                const duration = new Date(chat.end_time) - new Date(chat.start_time);
                return sum + (duration / 1000 / 60); // minutes
            }, 0) / completedSessions.length : 0;

        document.getElementById('avg-chat-duration').textContent = `${Math.round(avgDuration)}m`;

        // Calculate satisfaction
        const ratedSessions = chatData.filter(chat => chat.satisfaction_rating > 0);
        const avgSatisfaction = ratedSessions.length ?
            ratedSessions.reduce((sum, chat) => sum + chat.satisfaction_rating, 0) / ratedSessions.length : 0;

        document.getElementById('chat-satisfaction').textContent = `${avgSatisfaction.toFixed(1)}/5`;

        // Most popular topic
        const topics = {};
        chatData.forEach(chat => {
            const topic = chat.topic || 'General';
            topics[topic] = (topics[topic] || 0) + 1;
        });

        const popularTopic = Object.entries(topics)
            .sort(([,a], [,b]) => b - a)[0];

        document.getElementById('popular-topics').textContent = 
            popularTopic ? this.capitalizeFirst(popularTopic[0].replace('-', ' ')) : 'None';
    }

    setupAutoRefresh() {
        // Refresh data every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.loadDashboardData();
        }, 5 * 60 * 1000);
    }

    setupRealTimeUpdates() {
        // Update real-time stats more frequently
        setInterval(() => {
            this.updateRealTimeUsers();
        }, 30000); // Every 30 seconds
    }

    async updateRealTimeUsers() {
        try {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const response = await fetch(`tables/site_analytics?created_at>${fiveMinutesAgo}&limit=100`);
            const data = await response.json();
            
            const activeUsers = new Set(data.data?.map(r => r.visitor_id) || []).size;
            document.getElementById('realtime-users').textContent = activeUsers;
        } catch (error) {
            console.error('Real-time update error:', error);
        }
    }

    async exportAnalyticsData() {
        try {
            const data = await this.getAnalyticsData();
            const blogData = await this.getBlogData();
            const chatData = await this.getChatData();

            const exportData = {
                generated: new Date().toISOString(),
                analytics: data,
                blog: blogData,
                chat: chatData,
                summary: {
                    totalVisitors: data.visitors.total,
                    totalPageViews: data.pageViews.total,
                    totalBlogPosts: blogData.length,
                    totalChatSessions: chatData.length
                }
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `redbeard-remedy-analytics-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            this.showNotification('Analytics data exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Export failed. Please try again.', 'error');
        }
    }

    // Utility Methods
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num?.toString() || '0';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    getCategoryColor(category) {
        const colors = {
            'Reality Check': 'red',
            'Court Analysis': 'blue',
            'Constitutional Law': 'green',
            'Pseudolegal Debunking': 'orange',
            'Case Study': 'purple'
        };
        return colors[category] || 'gray';
    }

    getPageTitle(url) {
        const path = new URL(url).pathname;
        const titles = {
            '/': 'Home',
            '/index.html': 'Home',
            '/content-gallery.html': 'Content Gallery',
            '/reality-check-blog.html': 'Reality Check Blog',
            '/civil-law-misconceptions.html': 'Civil Law Reality',
            '/education.html': 'Education',
            '/resources.html': 'Resources',
            '/analytics-dashboard.html': 'Analytics Dashboard'
        };
        return titles[path] || path.replace(/[/-]/g, ' ').replace(/\.html$/, '').trim() || 'Unknown';
    }

    getTodayStart() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today.toISOString();
    }

    getYesterdayStart() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        return yesterday.toISOString();
    }

    getWeekStart() {
        const week = new Date();
        week.setDate(week.getDate() - 7);
        week.setHours(0, 0, 0, 0);
        return week.toISOString();
    }

    showLoading() {
        // Add loading indicators
        document.querySelectorAll('[id$="-visitors"], [id$="-pageviews"], [id$="-posts"], [id$="-chats"]').forEach(el => {
            el.textContent = '--';
        });
    }

    hideLoading() {
        // Remove loading indicators (handled by data updates)
    }

    showError(message) {
        this.showNotification(message, 'error');
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

// Initialize Analytics Dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.analyticsDashboard = new AnalyticsDashboard();
});
