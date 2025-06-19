// client-realtime.js
// CELESTE7 CLIENT SSE + POLLING - MVP
// Handles reconnection, typing detection, and brutal interventions

(function(window) {
  'use strict';

  class Celeste7VercelRealTime {
    constructor(userId, options = {}) {
      this.userId = userId;
      this.apiUrl = options.apiUrl || window.location.origin;
      this.debug = options.debug || false;
      
      // Connection state
      this.sseConnection = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
      this.maxReconnectAttempts = 5;
      this.connectionId = Date.now(); // Track connection instances
      
      // Performance tracking
      this.latencyStats = {
        connection: 0,
        patternReport: 0,
        interventionDelivery: 0
      };
      
      // Typing detection state
      this.typingSession = {
        startTime: Date.now(),
        lastKeyTime: Date.now(),
        deletions: 0,
        additions: 0,
        rewriteCount: 0,
        pauseDetected: false
      };
      
      // Pattern buffer (batched every 3s)
      this.patternBuffer = [];
      this.lastPatternSend = Date.now();
      
      // Event timers
      this.typingTimer = null;
      this.tabSwitchTime = null;
      this.windowBlurTime = null;
      
      this.log('Initializing CELESTE7 Real-Time Client');
      this.init();
    }

    init() {
      this.connectSSE();
      this.setupEventListeners();
      this.startPatternBatching();
    }

    // ============================================
    // SSE CONNECTION WITH RECONNECTION
    // ============================================

    connectSSE() {
      const connectionStart = Date.now();
      
      if (this.sseConnection) {
        this.sseConnection.close();
      }

      const sseUrl = `${this.apiUrl}/api/realtime/${this.userId}`;
      this.log(`Connecting SSE: ${sseUrl}`);
      
      this.sseConnection = new EventSource(sseUrl);
      this.connectionId = Date.now();
      
      this.sseConnection.onopen = () => {
        this.latencyStats.connection = Date.now() - connectionStart;
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        this.log(`SSE connected (${this.latencyStats.connection}ms)`);
        this.fireEvent('connected', { 
          latency: this.latencyStats.connection,
          connectionId: this.connectionId 
        });
      };
      
      this.sseConnection.onmessage = (event) => {
        const messageStart = Date.now();
        try {
          const data = JSON.parse(event.data);
          this.handleServerMessage(data);
          
          if (data.type === 'intervention') {
            this.latencyStats.interventionDelivery = Date.now() - messageStart;
          }
        } catch (error) {
          this.log('Failed to parse SSE message', error);
        }
      };
      
      this.sseConnection.onerror = (error) => {
        this.log('SSE error:', error);
        this.handleConnectionDrop();
      };
    }

    handleConnectionDrop() {
      this.isConnected = false;
      
      this.log(`Connection dropped (attempt ${this.reconnectAttempts + 1})`);
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        
        this.log(`Reconnecting in ${delay}ms`);
        
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connectSSE();
        }, delay);
      } else {
        this.log('Max reconnection attempts reached');
        this.fireEvent('disconnected', { 
          reason: 'max_attempts',
          attempts: this.reconnectAttempts 
        });
      }
    }

    handleServerMessage(data) {
      switch (data.type) {
        case 'connected':
          this.log('Server confirmed connection');
          break;
          
        case 'patterns_detected':
          this.handlePatternsDetected(data.patterns);
          break;
          
        case 'patterns_pending':
          this.log(`Received ${data.count} pending patterns`);
          this.handlePatternsDetected(data.patterns);
          break;
          
        case 'intervention':
          this.handleIntervention(data);
          break;
          
        case 'heartbeat':
          // Connection alive, update stats
          break;
          
        default:
          this.log('Unknown SSE message:', data.type);
      }
    }

    handlePatternsDetected(patterns) {
      this.log(`Patterns: ${patterns.map(p => `${p.type}(${p.confidence})`).join(', ')}`);
      
      this.fireEvent('patterns', {
        patterns,
        timestamp: Date.now()
      });
    }

    handleIntervention(intervention) {
      this.log(`INTERVENTION: ${intervention.pattern} - ${intervention.intervention}`);
      
      // Fire cancelable event for app integration
      const event = new CustomEvent('celeste7:intervention', {
        detail: intervention,
        cancelable: true
      });
      
      if (!window.dispatchEvent(event)) {
        return; // App handled it
      }
      
      // Default brutal intervention UI
      this.showBrutalIntervention(intervention);
    }

    // ============================================
    // BRUTAL INTERVENTION UI
    // ============================================

    showBrutalIntervention(intervention) {
      const existing = document.querySelector('.celeste7-intervention');
      if (existing) existing.remove();
      
      const div = document.createElement('div');
      div.className = 'celeste7-intervention';
      div.innerHTML = `
        <style>
          .celeste7-intervention {
            position: fixed;
            top: 20px;
            right: 20px;
            max-width: 420px;
            z-index: 999999;
            animation: celeste7-slide-brutal 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }
          .celeste7-content {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d1b1b 100%);
            color: #fff;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,68,68,0.3);
            border-left: 6px solid ${intervention.severity === 'critical' ? '#ff1744' : '#ff5722'};
          }
          .celeste7-header {
            color: #ff6b6b;
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            margin: 0 0 12px 0;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          }
          .celeste7-message {
            color: #e8e8e8;
            font-size: 15px;
            line-height: 1.6;
            margin: 12px 0;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          }
          .celeste7-directive {
            background: rgba(255, 183, 77, 0.15);
            border-left: 4px solid #ffb74d;
            padding: 14px 16px;
            margin: 16px 0;
            border-radius: 6px;
            color: #ffb74d;
            font-weight: 600;
            font-size: 16px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          }
          .celeste7-evidence {
            background: rgba(0,0,0,0.4);
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 11px;
            color: #999;
            margin: 12px 0;
            font-family: 'Monaco', 'Menlo', monospace;
            word-break: break-all;
          }
          .celeste7-actions {
            display: flex;
            gap: 12px;
            margin-top: 20px;
          }
          .celeste7-btn {
            padding: 10px 18px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s ease;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          }
          .celeste7-btn-primary {
            background: #ff4444;
            color: white;
            flex: 1;
          }
          .celeste7-btn-primary:hover {
            background: #ff6666;
            transform: translateY(-1px);
          }
          .celeste7-btn-secondary {
            background: rgba(255,255,255,0.1);
            color: #ccc;
            border: 1px solid rgba(255,255,255,0.2);
          }
          .celeste7-btn-secondary:hover {
            background: rgba(255,255,255,0.2);
          }
          @keyframes celeste7-slide-brutal {
            0% {
              transform: translateX(450px) scale(0.8);
              opacity: 0;
            }
            70% {
              transform: translateX(-15px) scale(1.02);
            }
            100% {
              transform: translateX(0) scale(1);
              opacity: 1;
            }
          }
        </style>
        <div class="celeste7-content">
          <div class="celeste7-header">
            ⚡ ${intervention.pattern.toUpperCase()} DETECTED
          </div>
          <div class="celeste7-message">
            ${intervention.intervention}
          </div>
          <div class="celeste7-directive">
            ${intervention.directive}
          </div>
          ${intervention.evidence ? `
            <div class="celeste7-evidence">
              ${this.formatEvidence(intervention.evidence)}
            </div>
          ` : ''}
          <div class="celeste7-actions">
            <button class="celeste7-btn celeste7-btn-primary" onclick="this.parentElement.parentElement.parentElement.remove()">
              Got it
            </button>
            <button class="celeste7-btn celeste7-btn-secondary" onclick="this.parentElement.parentElement.parentElement.style.opacity='0.3'">
              Later
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(div);
      
      // Auto-remove after 45 seconds
      setTimeout(() => {
        if (div.parentNode) {
          div.style.transform = 'translateX(450px)';
          div.style.opacity = '0';
          setTimeout(() => div.remove(), 300);
        }
      }, 45000);
    }

    formatEvidence(evidence) {
      if (Array.isArray(evidence)) {
        return evidence.map(e => this.formatEvidence(e)).join(' | ');
      }
      
      if (typeof evidence === 'object' && evidence !== null) {
        return Object.entries(evidence)
          .slice(0, 3)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
      }
      
      return String(evidence).substring(0, 80);
    }

    // ============================================
    // TYPING DETECTION PIPELINE
    // ============================================

    setupEventListeners() {
      // TYPING DETECTION
      document.addEventListener('input', this.handleInput.bind(this));
      document.addEventListener('keydown', this.handleKeydown.bind(this));
      
      // ACTIVITY DETECTION  
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      window.addEventListener('blur', this.handleWindowBlur.bind(this));
      window.addEventListener('focus', this.handleWindowFocus.bind(this));
      
      // FORM DETECTION
      document.addEventListener('focusin', this.handleFormFocus.bind(this));
      document.addEventListener('focusout', this.handleFormBlur.bind(this));
      
      this.log('Event listeners attached');
    }

    handleInput(event) {
      const now = Date.now();
      const timeSinceLastKey = now - this.typingSession.lastKeyTime;
      
      // HESITATION DETECTION (>5s pause)
      if (timeSinceLastKey > 5000 && this.typingSession.lastKeyTime > 0) {
        this.detectPattern({
          type: 'hesitation',
          confidence: Math.min(timeSinceLastKey / 10000, 0.9),
          evidence: {
            pauseDuration: timeSinceLastKey,
            pauseSeconds: Math.round(timeSinceLastKey / 1000),
            textBeforePause: this.getTextBeforeCursor(event.target),
            fieldType: this.getFieldType(event.target)
          }
        });
        
        this.typingSession.pauseDetected = true;
      }
      
      // Reset typing session if idle >30s
      if (timeSinceLastKey > 30000) {
        this.resetTypingSession();
      }
      
      this.typingSession.lastKeyTime = now;
      
      // Clear existing analysis timer
      clearTimeout(this.typingTimer);
      
      // Analyze typing session after 2s of inactivity
      this.typingTimer = setTimeout(() => {
        this.analyzeTypingSession();
      }, 2000);
    }

    handleKeydown(event) {
      if (event.key === 'Backspace' || event.key === 'Delete') {
        this.typingSession.deletions++;
      } else if (event.key.length === 1) {
        this.typingSession.additions++;
      }
      
      // Detect select-all rewrite
      if (event.ctrlKey && event.key === 'a') {
        this.typingSession.rewriteCount++;
      }
    }

    analyzeTypingSession() {
      const session = this.typingSession;
      
      // UNCERTAINTY DETECTION (excessive deletions)
      if (session.deletions > 0 && session.additions > 10) {
        const deletionRatio = session.deletions / session.additions;
        
        if (deletionRatio > 0.3) {
          this.detectPattern({
            type: 'uncertainty',
            confidence: Math.min(deletionRatio, 0.9),
            evidence: {
              deletionRatio: Number(deletionRatio.toFixed(2)),
              deletions: session.deletions,
              additions: session.additions,
              rewriteCount: session.rewriteCount,
              sessionDuration: Date.now() - session.startTime
            }
          });
        }
      }
      
      this.resetTypingSession();
    }

    resetTypingSession() {
      this.typingSession = {
        startTime: Date.now(),
        lastKeyTime: Date.now(),
        deletions: 0,
        additions: 0,
        rewriteCount: 0,
        pauseDetected: false
      };
    }

    // ============================================
    // DISTRACTION DETECTION
    // ============================================

    handleVisibilityChange() {
      if (document.hidden) {
        this.tabSwitchTime = Date.now();
      } else if (this.tabSwitchTime) {
        const awayDuration = Date.now() - this.tabSwitchTime;
        
        // DISTRACTION: away >30s
        if (awayDuration > 30000) {
          this.detectPattern({
            type: 'distraction',
            confidence: Math.min(awayDuration / 120000, 0.95),
            evidence: {
              awayDuration,
              awayMinutes: Number((awayDuration / 60000).toFixed(1)),
              trigger: 'tab_switch'
            }
          });
        }
        
        this.tabSwitchTime = null;
      }
    }

    handleWindowBlur() {
      this.windowBlurTime = Date.now();
    }

    handleWindowFocus() {
      if (this.windowBlurTime) {
        const awayDuration = Date.now() - this.windowBlurTime;
        
        // PROCRASTINATION: away >60s
        if (awayDuration > 60000) {
          this.detectPattern({
            type: 'procrastination',
            confidence: 0.8,
            evidence: {
              awayDuration,
              awayMinutes: Number((awayDuration / 60000).toFixed(1)),
              trigger: 'window_blur'
            }
          });
        }
        
        this.windowBlurTime = null;
      }
    }

    // ============================================
    // PRICING COWARDICE DETECTION
    // ============================================

    handleFormFocus(event) {
      const fieldType = this.getFieldType(event.target);
      if (fieldType === 'pricing') {
        this.log('Pricing field focused');
      }
    }

    handleFormBlur(event) {
      const value = event.target.value;
      const fieldType = this.getFieldType(event.target);
      
      // PRICING COWARDICE: low price in pricing field
      if (fieldType === 'pricing' && value) {
        const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
        
        if (numericValue > 0 && numericValue < 50) {
          this.detectPattern({
            type: 'pricing_cowardice',
            confidence: numericValue < 20 ? 0.9 : 0.75,
            evidence: {
              suggestedPrice: numericValue,
              fieldName: event.target.name || event.target.id,
              originalValue: value
            }
          });
        }
      }
    }

    // ============================================
    // PATTERN PROCESSING
    // ============================================

    detectPattern(pattern) {
      pattern.detectedAt = Date.now();
      pattern.source = 'client';
      pattern.connectionId = this.connectionId;
      
      this.patternBuffer.push(pattern);
      
      this.log(`Pattern: ${pattern.type} (${pattern.confidence})`);
      
      // Fire immediate event
      this.fireEvent('pattern', pattern);
    }

    startPatternBatching() {
      // Send patterns every 3 seconds
      setInterval(() => {
        if (this.patternBuffer.length > 0) {
          this.sendPatterns();
        }
      }, 3000);
    }

    async sendPatterns() {
      if (this.patternBuffer.length === 0) return;
      
      const patterns = [...this.patternBuffer];
      this.patternBuffer = [];
      
      const sendStart = Date.now();
      
      try {
        const response = await fetch(`${this.apiUrl}/api/pattern`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: this.userId,
            patterns,
            timestamp: Date.now(),
            connectionId: this.connectionId
          })
        });
        
        const result = await response.json();
        this.latencyStats.patternReport = Date.now() - sendStart;
        
        this.log(`Sent ${patterns.length} patterns (${this.latencyStats.patternReport}ms)`);
        
      } catch (error) {
        this.log('Pattern send failed:', error);
        // Re-add to buffer for retry
        this.patternBuffer.unshift(...patterns);
      }
    }

    // ============================================
    // UTILITIES
    // ============================================

    getFieldType(element) {
      const identifier = (element.name || element.id || element.placeholder || '').toLowerCase();
      
      if (identifier.includes('price') || identifier.includes('cost') || identifier.includes('$')) {
        return 'pricing';
      }
      if (identifier.includes('plan') || identifier.includes('strategy')) {
        return 'planning';
      }
      
      return 'general';
    }

    getTextBeforeCursor(element) {
      if (!element.value) return '';
      const pos = element.selectionStart || element.value.length;
      return element.value.substring(Math.max(0, pos - 20), pos);
    }

    fireEvent(type, data) {
      window.dispatchEvent(new CustomEvent(`celeste7:${type}`, {
        detail: { ...data, stats: this.getStats() }
      }));
    }

    getStats() {
      return {
        isConnected: this.isConnected,
        reconnectAttempts: this.reconnectAttempts,
        connectionId: this.connectionId,
        bufferSize: this.patternBuffer.length,
        latency: this.latencyStats
      };
    }

    log(...args) {
      if (this.debug) {
        console.log('[CELESTE7]', ...args);
      }
    }

    // ============================================
    // PUBLIC API
    // ============================================

    disconnect() {
      if (this.sseConnection) {
        this.sseConnection.close();
        this.sseConnection = null;
      }
      this.isConnected = false;
      
      // Send any remaining patterns
      if (this.patternBuffer.length > 0) {
        this.sendPatterns();
      }
    }

    async analyze(message) {
      return await fetch(`${this.apiUrl}/api/pattern`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          eventType: 'message_analysis',
          eventData: { text: message, manual: true }
        })
      }).then(r => r.json());
    }
  }

  // ============================================
  // AUTO-INITIALIZATION
  // ============================================

  function autoInit() {
    const userId = window.CELESTE7_USER_ID || 
                   document.querySelector('[data-celeste7-user]')?.dataset.celeste7User ||
                   localStorage.getItem('celeste7_user_id');
    
    if (userId) {
      const debug = window.CELESTE7_DEBUG || false;
      window.celeste7 = new Celeste7VercelRealTime(userId, { debug });
      console.log('🚀 CELESTE7 Real-Time activated');
    }
  }

  window.Celeste7VercelRealTime = Celeste7VercelRealTime;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

})(window);