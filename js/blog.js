// Reality Check Blog System
// Advanced blog functionality with real-time features

class BlogSystem {
    constructor() {
        this.currentPage = 1;
        this.postsPerPage = 9;
        this.allPosts = [];
        this.filteredPosts = [];
        this.featuredOnly = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadPosts();
        this.loadFeaturedPosts();
    }

    bindEvents() {
        // New post modal
        document.getElementById('new-post-btn')?.addEventListener('click', () => this.openNewPostModal());
        document.getElementById('close-post-modal')?.addEventListener('click', () => this.closeNewPostModal());
        document.getElementById('new-post-form')?.addEventListener('submit', (e) => this.handleNewPost(e));
        document.getElementById('save-draft')?.addEventListener('click', () => this.saveDraft());

        // Search and filters
        document.getElementById('search-posts')?.addEventListener('input', (e) => this.searchPosts(e.target.value));
        document.getElementById('category-filter')?.addEventListener('change', (e) => this.filterByCategory(e.target.value));
        document.getElementById('sort-posts')?.addEventListener('change', (e) => this.sortPosts(e.target.value));
        document.getElementById('featured-only')?.addEventListener('click', () => this.toggleFeaturedOnly());

        // Load more
        document.getElementById('load-more')?.addEventListener('click', () => this.loadMorePosts());

        // Admin panel
        document.getElementById('admin-panel-btn')?.addEventListener('click', () => this.openAdminPanel());

        // Close modal on outside click
        document.getElementById('new-post-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'new-post-modal') {
                this.closeNewPostModal();
            }
        });
    }

    async loadPosts() {
        try {
            const response = await fetch('tables/blog_posts?sort=created_at&limit=100');
            const data = await response.json();
            this.allPosts = data.data || [];
            this.filteredPosts = [...this.allPosts];
            this.renderPosts();
        } catch (error) {
            console.error('Error loading posts:', error);
            this.showNotification('Error loading blog posts', 'error');
        }
    }

    async loadFeaturedPosts() {
        try {
            const response = await fetch('tables/blog_posts?search=featured:true&limit=4');
            const data = await response.json();
            const featuredPosts = data.data || [];
            this.renderFeaturedPosts(featuredPosts);
        } catch (error) {
            console.error('Error loading featured posts:', error);
        }
    }

    renderFeaturedPosts(posts) {
        const container = document.getElementById('featured-posts-grid');
        if (!container) return;

        if (posts.length === 0) {
            container.innerHTML = '<p class="text-gray-500 col-span-2 text-center">No featured posts yet.</p>';
            return;
        }

        container.innerHTML = posts.map(post => `
            <article class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer" onclick="blogSystem.openPost('${post.id}')">
                <div class="relative">
                    ${post.featured_image ? `<img src="${post.featured_image}" alt="${post.title}" class="w-full h-48 object-cover">` : 
                      '<div class="w-full h-48 bg-gradient-to-br from-burgundy to-red-800 flex items-center justify-center"><i class="fas fa-skull-crossbones text-gold text-4xl"></i></div>'}
                    <div class="absolute top-4 left-4">
                        <span class="bg-gold text-burgundy px-3 py-1 rounded-full text-sm font-semibold">
                            <i class="fas fa-star mr-1"></i>Featured
                        </span>
                    </div>
                    <div class="absolute top-4 right-4">
                        <span class="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                            ${post.category}
                        </span>
                    </div>
                </div>
                <div class="p-6">
                    <h3 class="text-xl font-bold text-charcoal mb-3 line-clamp-2">${post.title}</h3>
                    <p class="text-gray-600 mb-4 line-clamp-3">${post.excerpt || this.extractExcerpt(post.content)}</p>
                    <div class="flex items-center justify-between text-sm text-gray-500">
                        <span><i class="fas fa-calendar mr-1"></i>${this.formatDate(post.publish_date || post.created_at)}</span>
                        <span><i class="fas fa-eye mr-1"></i>${post.views || 0} views</span>
                    </div>
                </div>
            </article>
        `).join('');
    }

    renderPosts() {
        const container = document.getElementById('blog-posts-grid');
        if (!container) return;

        const startIndex = (this.currentPage - 1) * this.postsPerPage;
        const endIndex = startIndex + this.postsPerPage;
        const postsToShow = this.filteredPosts.slice(0, endIndex);

        if (postsToShow.length === 0) {
            container.innerHTML = '<p class="text-gray-500 col-span-3 text-center">No posts found.</p>';
            return;
        }

        container.innerHTML = postsToShow.map(post => `
            <article class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onclick="blogSystem.openPost('${post.id}')">
                <div class="relative">
                    ${post.featured_image ? `<img src="${post.featured_image}" alt="${post.title}" class="w-full h-40 object-cover">` : 
                      '<div class="w-full h-40 bg-gradient-to-br from-burgundy to-red-800 flex items-center justify-center"><i class="fas fa-gavel text-gold text-2xl"></i></div>'}
                    <div class="absolute top-2 right-2">
                        <span class="bg-${this.getCategoryColor(post.category)} text-white px-2 py-1 rounded text-xs">
                            ${post.category}
                        </span>
                    </div>
                    ${post.featured ? '<div class="absolute top-2 left-2"><i class="fas fa-star text-gold text-lg"></i></div>' : ''}
                </div>
                <div class="p-4">
                    <h3 class="text-lg font-semibold text-charcoal mb-2 line-clamp-2">${post.title}</h3>
                    <p class="text-gray-600 text-sm mb-3 line-clamp-2">${post.excerpt || this.extractExcerpt(post.content)}</p>
                    <div class="flex items-center justify-between text-xs text-gray-500">
                        <span><i class="fas fa-calendar mr-1"></i>${this.formatDate(post.publish_date || post.created_at)}</span>
                        <span><i class="fas fa-eye mr-1"></i>${post.views || 0}</span>
                    </div>
                </div>
            </article>
        `).join('');

        // Show/hide load more button
        const loadMoreBtn = document.getElementById('load-more');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = endIndex < this.filteredPosts.length ? 'block' : 'none';
        }
    }

    getCategoryColor(category) {
        const colors = {
            'Reality Check': 'red-600',
            'Court Analysis': 'blue-600',
            'Constitutional Law': 'green-600',
            'Pseudolegal Debunking': 'orange-600',
            'Case Study': 'purple-600'
        };
        return colors[category] || 'gray-600';
    }

    extractExcerpt(content, length = 150) {
        const text = content.replace(/<[^>]*>/g, '');
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    searchPosts(query) {
        if (!query.trim()) {
            this.filteredPosts = [...this.allPosts];
        } else {
            this.filteredPosts = this.allPosts.filter(post => 
                post.title.toLowerCase().includes(query.toLowerCase()) ||
                post.content.toLowerCase().includes(query.toLowerCase()) ||
                post.excerpt?.toLowerCase().includes(query.toLowerCase()) ||
                (post.tags && post.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
            );
        }
        this.currentPage = 1;
        this.renderPosts();
    }

    filterByCategory(category) {
        if (!category) {
            this.filteredPosts = [...this.allPosts];
        } else {
            this.filteredPosts = this.allPosts.filter(post => post.category === category);
        }
        this.currentPage = 1;
        this.renderPosts();
    }

    sortPosts(sortBy) {
        switch (sortBy) {
            case 'newest':
                this.filteredPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'oldest':
                this.filteredPosts.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'most-viewed':
                this.filteredPosts.sort((a, b) => (b.views || 0) - (a.views || 0));
                break;
            case 'title':
                this.filteredPosts.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }
        this.renderPosts();
    }

    toggleFeaturedOnly() {
        this.featuredOnly = !this.featuredOnly;
        const btn = document.getElementById('featured-only');
        
        if (this.featuredOnly) {
            this.filteredPosts = this.allPosts.filter(post => post.featured);
            btn.classList.add('bg-gold', 'text-burgundy');
            btn.classList.remove('bg-burgundy', 'text-white');
        } else {
            this.filteredPosts = [...this.allPosts];
            btn.classList.remove('bg-gold', 'text-burgundy');
            btn.classList.add('bg-burgundy', 'text-white');
        }
        
        this.currentPage = 1;
        this.renderPosts();
    }

    loadMorePosts() {
        this.currentPage++;
        this.renderPosts();
    }

    openNewPostModal() {
        document.getElementById('new-post-modal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeNewPostModal() {
        document.getElementById('new-post-modal').classList.add('hidden');
        document.body.style.overflow = '';
        document.getElementById('new-post-form').reset();
    }

    async handleNewPost(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const postData = {
            id: this.generateId(),
            title: document.getElementById('post-title').value,
            content: document.getElementById('post-content').value,
            excerpt: document.getElementById('post-excerpt').value,
            author: 'Saddiq Abdullah',
            category: document.getElementById('post-category').value,
            tags: document.getElementById('post-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            featured_image: document.getElementById('post-image').value,
            published: document.getElementById('post-published').checked,
            featured: document.getElementById('post-featured').checked,
            views: 0,
            publish_date: new Date().getTime()
        };

        try {
            const response = await fetch('tables/blog_posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });

            if (response.ok) {
                this.showNotification('Reality check published successfully!', 'success');
                this.closeNewPostModal();
                this.loadPosts();
                this.loadFeaturedPosts();
                
                // Track analytics
                this.trackAnalyticsEvent('blog_post_created', {
                    category: postData.category,
                    featured: postData.featured
                });
            } else {
                throw new Error('Failed to publish post');
            }
        } catch (error) {
            console.error('Error publishing post:', error);
            this.showNotification('Error publishing post. Please try again.', 'error');
        }
    }

    async saveDraft() {
        // Similar to handleNewPost but with published: false
        const postData = {
            id: this.generateId(),
            title: document.getElementById('post-title').value || 'Untitled Draft',
            content: document.getElementById('post-content').value,
            excerpt: document.getElementById('post-excerpt').value,
            author: 'Saddiq Abdullah',
            category: document.getElementById('post-category').value || 'Reality Check',
            tags: document.getElementById('post-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            featured_image: document.getElementById('post-image').value,
            published: false,
            featured: false,
            views: 0
        };

        try {
            const response = await fetch('tables/blog_posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });

            if (response.ok) {
                this.showNotification('Draft saved successfully!', 'success');
                this.closeNewPostModal();
                this.loadPosts();
            } else {
                throw new Error('Failed to save draft');
            }
        } catch (error) {
            console.error('Error saving draft:', error);
            this.showNotification('Error saving draft. Please try again.', 'error');
        }
    }

    async openPost(postId) {
        // Increment view count
        try {
            await fetch(`tables/blog_posts/${postId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    views: (this.allPosts.find(p => p.id === postId)?.views || 0) + 1
                })
            });

            // Track analytics
            this.trackAnalyticsEvent('blog_post_viewed', {
                post_id: postId
            });

            // Open post in modal or new page (implement as needed)
            this.showPostModal(postId);
        } catch (error) {
            console.error('Error updating view count:', error);
        }
    }

    showPostModal(postId) {
        const post = this.allPosts.find(p => p.id === postId);
        if (!post) return;

        // Create and show post modal (implement full post view)
        const modalHtml = `
            <div id="post-view-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div class="p-6 border-b border-gray-200">
                        <div class="flex items-center justify-between">
                            <div>
                                <span class="bg-${this.getCategoryColor(post.category)} text-white px-3 py-1 rounded-full text-sm">
                                    ${post.category}
                                </span>
                                ${post.featured ? '<i class="fas fa-star text-gold ml-2"></i>' : ''}
                            </div>
                            <button onclick="document.getElementById('post-view-modal').remove()" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        <h1 class="text-2xl font-bold text-charcoal mt-4">${post.title}</h1>
                        <div class="flex items-center text-sm text-gray-500 mt-2">
                            <span><i class="fas fa-user mr-1"></i>${post.author}</span>
                            <span class="mx-2">•</span>
                            <span><i class="fas fa-calendar mr-1"></i>${this.formatDate(post.publish_date || post.created_at)}</span>
                            <span class="mx-2">•</span>
                            <span><i class="fas fa-eye mr-1"></i>${post.views || 0} views</span>
                        </div>
                    </div>
                    <div class="p-6">
                        ${post.featured_image ? `<img src="${post.featured_image}" alt="${post.title}" class="w-full h-64 object-cover rounded-lg mb-6">` : ''}
                        <div class="prose prose-lg max-w-none">
                            ${post.content.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.body.style.overflow = 'hidden';
    }

    openAdminPanel() {
        // Redirect to admin dashboard or show admin modal
        this.showNotification('Admin panel functionality coming soon!', 'info');
    }

    generateId() {
        return 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    trackAnalyticsEvent(eventType, data = {}) {
        // Track analytics event
        const analyticsData = {
            id: 'analytics_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            page_url: window.location.href,
            visitor_id: this.getVisitorId(),
            session_id: this.getSessionId(),
            action_type: eventType,
            referrer: document.referrer,
            user_agent: navigator.userAgent,
            device_type: this.getDeviceType(),
            ...data
        };

        fetch('tables/site_analytics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(analyticsData)
        }).catch(error => console.error('Analytics error:', error));
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

    getDeviceType() {
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
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

// Initialize blog system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.blogSystem = new BlogSystem();
});
