// Live Chat & Q&A System for Legal Education
// Real-time support and educational assistance

class LiveChatSystem {
    constructor() {
        this.isOpen = false;
        this.currentSession = null;
        this.messages = [];
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.init();
    }

    init() {
        this.createChatUI();
        this.bindEvents();
        this.loadChatHistory();
        this.startHeartbeat();
    }

    createChatUI() {
        const chatHTML = `
            <!-- Chat Widget Button -->
            <div id="chat-widget-button" class="fixed bottom-6 right-6 z-40">
                <button class="bg-burgundy hover:bg-red-800 text-white rounded-full p-4 shadow-lg transform transition-all duration-300 hover:scale-110">
                    <i class="fas fa-comments text-xl"></i>
                    <span id="unread-count" class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center hidden">0</span>
                </button>
            </div>

            <!-- Chat Window -->
            <div id="chat-window" class="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl z-50 hidden transform transition-all duration-300 scale-95 opacity-0">
                
                <!-- Chat Header -->
                <div class="bg-gradient-to-r from-burgundy to-red-800 text-white p-4 rounded-t-lg">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <img src="assets/images/redbeard-logo.png" alt="Redbeards Remedy" class="h-8 w-8 rounded-full mr-3">
                            <div>
                                <h3 class="font-semibold">Legal Education Support</h3>
                                <p class="text-xs text-red-100" id="chat-status">Online • Ready to help</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button id="minimize-chat" class="text-red-100 hover:text-white">
                                <i class="fas fa-minus"></i>
                            </button>
                            <button id="close-chat" class="text-red-100 hover:text-white">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Chat Messages Area -->
                <div id="chat-messages" class="flex-1 p-4 overflow-y-auto h-[340px] bg-gray-50">
                    <div class="welcome-message mb-4">
                        <div class="bg-white p-3 rounded-lg shadow-sm border-l-4 border-burgundy">
                            <div class="flex items-start">
                                <img src="assets/images/redbeard-logo.png" alt="Support" class="h-8 w-8 rounded-full mr-3 mt-1">
                                <div>
                                    <p class="text-sm text-gray-800 font-medium">Welcome to Redbeards Remedy Legal Education Support!</p>
                                    <p class="text-xs text-gray-600 mt-1">I'm here to help with constitutional law questions and clarify the difference between effective legal strategies and failed pseudolegal theories.</p>
                                    <div class="mt-3 space-y-1">
                                        <button class="quick-question bg-burgundy text-white text-xs px-3 py-1 rounded-full hover:bg-red-800" data-question="What's the difference between constitutional law and sovereign citizen theories?">
                                            Constitutional vs Sovereign Theories
                                        </button>
                                        <button class="quick-question bg-burgundy text-white text-xs px-3 py-1 rounded-full hover:bg-red-800" data-question="How can I challenge a traffic stop constitutionally?">
                                            Constitutional Traffic Stop Challenges
                                        </button>
                                        <button class="quick-question bg-burgundy text-white text-xs px-3 py-1 rounded-full hover:bg-red-800" data-question="What are the most common pseudolegal arguments that fail?">
                                            Failed Pseudolegal Arguments
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Chat Input Area -->
                <div class="border-t border-gray-200 p-4">
                    <div id="visitor-info-form" class="space-y-3">
                        <input type="text" id="visitor-name" placeholder="Your name (optional)" class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-burgundy focus:border-transparent">
                        <input type="email" id="visitor-email" placeholder="Your email (optional)" class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-burgundy focus:border-transparent">
                        <select id="question-topic" class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-burgundy focus:border-transparent">
                            <option value="">Question topic...</option>
                            <option value="constitutional-law">Constitutional Law</option>
                            <option value="court-procedures">Court Procedures</option>
                            <option value="traffic-stops">Traffic Stops</option>
                            <option value="pseudolegal-myths">Pseudolegal Myths</option>
                            <option value="case-analysis">Case Analysis</option>
                            <option value="general-question">General Question</option>
                        </select>
                        <button id="start-chat" class="w-full bg-burgundy text-white p-2 rounded-lg hover:bg-red-800 transition-colors">
                            Start Chat Session
                        </button>
                    </div>
                    
                    <div id="chat-input-area" class="hidden">
                        <div class="flex items-end space-x-2">
                            <div class="flex-1">
                                <textarea id="message-input" placeholder="Type your legal education question..." class="w-full p-2 border border-gray-300 rounded-lg resize-none text-sm focus:ring-2 focus:ring-burgundy focus:border-transparent" rows="2"></textarea>
                            </div>
                            <button id="send-message" class="bg-burgundy text-white p-2 rounded-lg hover:bg-red-800 transition-colors">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                        <div class="flex items-center justify-between mt-2 text-xs text-gray-500">
                            <span id="typing-indicator" class="hidden">
                                <i class="fas fa-circle text-green-500 animate-pulse"></i> Support is typing...
                            </span>
                            <div class="flex items-center space-x-2">
                                <button id="attach-file" class="text-gray-400 hover:text-gray-600" title="Attach document">
                                    <i class="fas fa-paperclip"></i>
                                </button>
                                <button id="voice-message" class="text-gray-400 hover:text-gray-600" title="Voice message">
                                    <i class="fas fa-microphone"></i>
                                </button>
                                <span id="char-count">0/500</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Chat Footer -->
                <div class="bg-gray-100 px-4 py-2 rounded-b-lg">
                    <div class="flex items-center justify-between text-xs text-gray-500">
                        <div class="flex items-center space-x-2">
                            <div id="connection-status" class="flex items-center">
                                <i class="fas fa-circle text-green-500 text-xs mr-1"></i>
                                <span>Connected</span>
                            </div>
                            <span>•</span>
                            <span>Educational purposes only</span>
                        </div>
                        <button id="end-session" class="text-red-500 hover:text-red-700 hidden">
                            End Session
                        </button>
                    </div>
                </div>
            </div>

            <!-- Mobile Chat Overlay -->
            <div id="mobile-chat-overlay" class="fixed inset-0 bg-white z-50 hidden md:hidden">
                <div class="flex flex-col h-full">
                    <!-- Mobile Header -->
                    <div class="bg-gradient-to-r from-burgundy to-red-800 text-white p-4">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <img src="assets/images/redbeard-logo.png" alt="Redbeards Remedy" class="h-8 w-8 rounded-full mr-3">
                                <div>
                                    <h3 class="font-semibold">Legal Education Support</h3>
                                    <p class="text-xs text-red-100">Online • Ready to help</p>
                                </div>
                            </div>
                            <button id="close-mobile-chat" class="text-red-100 hover:text-white">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Mobile Messages -->
                    <div id="mobile-chat-messages" class="flex-1 p-4 overflow-y-auto bg-gray-50">
                        <!-- Messages will be mirrored here -->
                    </div>

                    <!-- Mobile Input -->
                    <div class="border-t border-gray-200 p-4 bg-white">
                        <div class="flex items-end space-x-2">
                            <textarea id="mobile-message-input" placeholder="Type your question..." class="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-burgundy focus:border-transparent" rows="2"></textarea>
                            <button id="mobile-send-message" class="bg-burgundy text-white p-3 rounded-lg hover:bg-red-800 transition-colors">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatHTML);
    }

    bindEvents() {
        // Widget button
        document.getElementById('chat-widget-button')?.addEventListener('click', () => this.toggleChat());
        
        // Chat window controls
        document.getElementById('close-chat')?.addEventListener('click', () => this.closeChat());
        document.getElementById('minimize-chat')?.addEventListener('click', () => this.minimizeChat());
        document.getElementById('start-chat')?.addEventListener('click', () => this.startChatSession());
        document.getElementById('send-message')?.addEventListener('click', () => this.sendMessage());
        document.getElementById('end-session')?.addEventListener('click', () => this.endSession());

        // Mobile controls
        document.getElementById('close-mobile-chat')?.addEventListener('click', () => this.closeMobileChat());
        document.getElementById('mobile-send-message')?.addEventListener('click', () => this.sendMobileMessage());

        // Input events
        document.getElementById('message-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        document.getElementById('mobile-message-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMobileMessage();
            }
        });

        // Character counter
        document.getElementById('message-input')?.addEventListener('input', (e) => {
            const charCount = document.getElementById('char-count');
            if (charCount) {
                charCount.textContent = `${e.target.value.length}/500`;
                if (e.target.value.length > 450) {
                    charCount.classList.add('text-red-500');
                } else {
                    charCount.classList.remove('text-red-500');
                }
            }
        });

        // Quick questions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-question')) {
                const question = e.target.dataset.question;
                this.sendQuickQuestion(question);
            }
        });

        // File attachment (future feature)
        document.getElementById('attach-file')?.addEventListener('click', () => {
            this.showNotification('File attachment coming soon!', 'info');
        });

        // Voice message (future feature)
        document.getElementById('voice-message')?.addEventListener('click', () => {
            this.showNotification('Voice messages coming soon!', 'info');
        });
    }

    toggleChat() {
        const chatWindow = document.getElementById('chat-window');
        const mobileOverlay = document.getElementById('mobile-chat-overlay');
        
        if (window.innerWidth < 768) {
            // Mobile view
            mobileOverlay.classList.toggle('hidden');
            this.isOpen = !mobileOverlay.classList.contains('hidden');
        } else {
            // Desktop view
            if (chatWindow.classList.contains('hidden')) {
                this.openChat();
            } else {
                this.closeChat();
            }
        }
    }

    openChat() {
        const chatWindow = document.getElementById('chat-window');
        chatWindow.classList.remove('hidden');
        setTimeout(() => {
            chatWindow.classList.remove('scale-95', 'opacity-0');
            chatWindow.classList.add('scale-100', 'opacity-100');
        }, 10);
        this.isOpen = true;
        
        // Track analytics
        this.trackAnalyticsEvent('chat_opened');
    }

    closeChat() {
        const chatWindow = document.getElementById('chat-window');
        chatWindow.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            chatWindow.classList.add('hidden');
        }, 300);
        this.isOpen = false;
    }

    closeMobileChat() {
        document.getElementById('mobile-chat-overlay').classList.add('hidden');
        this.isOpen = false;
    }

    minimizeChat() {
        this.closeChat();
        // Could add minimize state different from close
    }

    async startChatSession() {
        const visitorName = document.getElementById('visitor-name').value || 'Anonymous';
        const visitorEmail = document.getElementById('visitor-email').value;
        const topic = document.getElementById('question-topic').value;

        // Create chat session
        const sessionData = {
            id: this.generateId(),
            visitor_name: visitorName,
            visitor_email: visitorEmail,
            topic: topic || 'General Question',
            status: 'active',
            priority: 'medium',
            start_time: new Date().toISOString(),
            satisfaction_rating: 0
        };

        try {
            const response = await fetch('tables/chat_sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sessionData)
            });

            if (response.ok) {
                this.currentSession = sessionData;
                this.switchToChatInput();
                this.addSystemMessage(`Welcome ${visitorName}! I'm here to help with your ${topic.replace('-', ' ')} questions. What would you like to know?`);
                
                // Track analytics
                this.trackAnalyticsEvent('chat_session_started', {
                    topic: topic,
                    visitor_type: visitorEmail ? 'registered' : 'anonymous'
                });
            } else {
                throw new Error('Failed to start chat session');
            }
        } catch (error) {
            console.error('Error starting chat session:', error);
            this.showNotification('Error starting chat session. Please try again.', 'error');
        }
    }

    switchToChatInput() {
        document.getElementById('visitor-info-form').classList.add('hidden');
        document.getElementById('chat-input-area').classList.remove('hidden');
        document.getElementById('end-session').classList.remove('hidden');
    }

    async sendMessage() {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();
        
        if (!message || !this.currentSession) return;

        // Add user message to UI
        this.addUserMessage(message);
        messageInput.value = '';
        
        // Save message to database
        await this.saveMessage('visitor', message);
        
        // Simulate typing indicator
        this.showTypingIndicator();
        
        // Generate AI response (simulate for now)
        setTimeout(() => {
            this.hideTypingIndicator();
            this.generateResponse(message);
        }, 1500 + Math.random() * 2000);
    }

    async sendMobileMessage() {
        const messageInput = document.getElementById('mobile-message-input');
        const message = messageInput.value.trim();
        
        if (!message) return;

        messageInput.value = '';
        // Reuse desktop logic
        await this.addUserMessage(message);
        await this.saveMessage('visitor', message);
        
        setTimeout(() => {
            this.generateResponse(message);
        }, 1500 + Math.random() * 2000);
    }

    sendQuickQuestion(question) {
        if (!this.currentSession) {
            // Auto-start session for quick questions
            document.getElementById('question-topic').value = 'general-question';
            this.startChatSession().then(() => {
                setTimeout(() => {
                    document.getElementById('message-input').value = question;
                    this.sendMessage();
                }, 500);
            });
        } else {
            document.getElementById('message-input').value = question;
            this.sendMessage();
        }
    }

    addUserMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        const mobileMessagesContainer = document.getElementById('mobile-chat-messages');
        
        const messageHTML = `
            <div class="message user-message mb-3 flex justify-end">
                <div class="bg-burgundy text-white p-3 rounded-lg max-w-xs break-words">
                    <p class="text-sm">${this.escapeHtml(message)}</p>
                    <span class="text-xs text-red-100 mt-1 block">${this.formatTime(new Date())}</span>
                </div>
            </div>
        `;
        
        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        if (mobileMessagesContainer) {
            mobileMessagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        }
        
        this.scrollToBottom();
    }

    addBotMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        const mobileMessagesContainer = document.getElementById('mobile-chat-messages');
        
        const messageHTML = `
            <div class="message bot-message mb-3 flex justify-start">
                <div class="flex items-start max-w-xs">
                    <img src="assets/images/redbeard-logo.png" alt="Support" class="h-6 w-6 rounded-full mr-2 mt-1">
                    <div class="bg-white border border-gray-200 p-3 rounded-lg">
                        <p class="text-sm text-gray-800">${message}</p>
                        <span class="text-xs text-gray-500 mt-1 block">${this.formatTime(new Date())}</span>
                    </div>
                </div>
            </div>
        `;
        
        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        if (mobileMessagesContainer) {
            mobileMessagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        }
        
        this.scrollToBottom();
    }

    addSystemMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        const mobileMessagesContainer = document.getElementById('mobile-chat-messages');
        
        const messageHTML = `
            <div class="message system-message mb-3">
                <div class="text-center">
                    <span class="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                        <i class="fas fa-info-circle mr-1"></i>${message}
                    </span>
                </div>
            </div>
        `;
        
        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        if (mobileMessagesContainer) {
            mobileMessagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        }
        
        this.scrollToBottom();
    }

    showTypingIndicator() {
        document.getElementById('typing-indicator')?.classList.remove('hidden');
    }

    hideTypingIndicator() {
        document.getElementById('typing-indicator')?.classList.add('hidden');
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        const mobileMessagesContainer = document.getElementById('mobile-chat-messages');
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        if (mobileMessagesContainer) {
            mobileMessagesContainer.scrollTop = mobileMessagesContainer.scrollHeight;
        }
    }

    async generateResponse(userMessage) {
        // Simulate AI response based on keywords
        let response = this.getResponseByKeywords(userMessage);
        
        this.addBotMessage(response);
        await this.saveMessage('admin', response);
    }

    getResponseByKeywords(message) {
        const msg = message.toLowerCase();
        
        if (msg.includes('traveling') || msg.includes('driving') || msg.includes('license')) {
            return "The 'traveling vs driving' argument fails in court every time. I tried it myself in Delaware County - the judge wasn't impressed. The reality is that operating a motor vehicle on public roads requires proper licensing regardless of how you label it. Want to see the actual court transcripts that prove this?";
        }
        
        if (msg.includes('sovereign') || msg.includes('citizen') || msg.includes('corporation')) {
            return "I spent years believing sovereign citizen theories before learning they don't work in real courtrooms. The 'state is a corporation' argument sounds compelling online but gets shot down immediately in practice. I can show you what constitutional challenges actually succeed instead.";
        }
        
        if (msg.includes('constitutional') || msg.includes('14th') || msg.includes('amendment')) {
            return "Now we're talking! The 14th Amendment's Due Process and Equal Protection clauses are your real constitutional shields. Instead of word games, focus on actual procedural violations or unequal enforcement. This is what courts recognize and respect.";
        }
        
        if (msg.includes('traffic') || msg.includes('stop') || msg.includes('pulled over')) {
            return "Traffic stops have specific constitutional requirements. Focus on whether proper procedures were followed, if reasonable suspicion existed, and if your rights were violated during the stop. Forget the 'no contract' arguments - challenge the actual conduct instead.";
        }
        
        if (msg.includes('court') || msg.includes('hearing') || msg.includes('judge')) {
            return "Court appearances require preparation and understanding real legal procedure. Pseudolegal arguments make you look unprepared and can hurt your case. I learned this the hard way. Want specific advice on how to properly challenge your case using actual constitutional law?";
        }
        
        return "Great question! I've been studying constitutional law for 12+ years and learned through real courtroom experience what works versus what fails. Could you be more specific about your situation? I can share insights based on actual case outcomes rather than internet theories.";
    }

    async saveMessage(sender, message) {
        if (!this.currentSession) return;
        
        const messageData = {
            id: this.generateId(),
            session_id: this.currentSession.id,
            sender: sender,
            message: message,
            timestamp: new Date().toISOString(),
            message_type: 'text'
        };

        try {
            await fetch('tables/chat_messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });
        } catch (error) {
            console.error('Error saving message:', error);
        }
    }

    async endSession() {
        if (!this.currentSession) return;

        // Show satisfaction survey
        const rating = await this.showSatisfactionSurvey();
        
        // Update session
        try {
            await fetch(`tables/chat_sessions/${this.currentSession.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'resolved',
                    end_time: new Date().toISOString(),
                    satisfaction_rating: rating
                })
            });
            
            this.addSystemMessage('Chat session ended. Thank you for using Redbeards Remedy Legal Education Support!');
            document.getElementById('end-session').classList.add('hidden');
            document.getElementById('chat-input-area').classList.add('hidden');
            document.getElementById('visitor-info-form').classList.remove('hidden');
            
            this.currentSession = null;
            
            // Track analytics
            this.trackAnalyticsEvent('chat_session_ended', {
                satisfaction_rating: rating
            });
            
        } catch (error) {
            console.error('Error ending session:', error);
        }
    }

    showSatisfactionSurvey() {
        return new Promise((resolve) => {
            const surveyHTML = `
                <div id="satisfaction-survey" class="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
                    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 class="text-lg font-semibold text-charcoal mb-4">How was your experience?</h3>
                        <p class="text-gray-600 mb-4">Please rate your legal education support experience:</p>
                        <div class="flex justify-center space-x-2 mb-4">
                            ${[1,2,3,4,5].map(i => `
                                <button class="rating-btn text-2xl text-gray-300 hover:text-gold" data-rating="${i}">
                                    <i class="fas fa-star"></i>
                                </button>
                            `).join('')}
                        </div>
                        <div class="flex space-x-3">
                            <button id="skip-rating" class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors">
                                Skip
                            </button>
                            <button id="submit-rating" class="flex-1 bg-burgundy text-white py-2 px-4 rounded-lg hover:bg-red-800 transition-colors" disabled>
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', surveyHTML);
            
            let selectedRating = 0;
            
            // Rating button events
            document.querySelectorAll('.rating-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    selectedRating = parseInt(e.currentTarget.dataset.rating);
                    document.querySelectorAll('.rating-btn').forEach((b, i) => {
                        if (i < selectedRating) {
                            b.classList.add('text-gold');
                            b.classList.remove('text-gray-300');
                        } else {
                            b.classList.remove('text-gold');
                            b.classList.add('text-gray-300');
                        }
                    });
                    document.getElementById('submit-rating').disabled = false;
                });
            });
            
            // Submit/skip events
            document.getElementById('submit-rating').addEventListener('click', () => {
                document.getElementById('satisfaction-survey').remove();
                resolve(selectedRating);
            });
            
            document.getElementById('skip-rating').addEventListener('click', () => {
                document.getElementById('satisfaction-survey').remove();
                resolve(0);
            });
        });
    }

    loadChatHistory() {
        // Load previous chat history if needed
    }

    startHeartbeat() {
        // Maintain connection status
        setInterval(() => {
            this.updateConnectionStatus();
        }, 30000); // Check every 30 seconds
    }

    updateConnectionStatus() {
        const statusEl = document.getElementById('connection-status');
        const chatStatus = document.getElementById('chat-status');
        
        // Simulate connection check
        const isConnected = navigator.onLine;
        
        if (isConnected) {
            statusEl.innerHTML = '<i class="fas fa-circle text-green-500 text-xs mr-1"></i><span>Connected</span>';
            chatStatus.textContent = 'Online • Ready to help';
        } else {
            statusEl.innerHTML = '<i class="fas fa-circle text-red-500 text-xs mr-1"></i><span>Offline</span>';
            chatStatus.textContent = 'Offline • Reconnecting...';
        }
    }

    formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    generateId() {
        return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    trackAnalyticsEvent(eventType, data = {}) {
        // Reuse analytics from blog system
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

// Initialize chat system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.liveChatSystem = new LiveChatSystem();
});
