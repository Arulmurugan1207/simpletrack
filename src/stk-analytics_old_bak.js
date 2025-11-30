/**
 * TableTennisTube Analytics SDK
 * Standalone analytics library for any HTML/JavaScript application
 *
 * Usage:
 * <script
 *   src="https://simpletrack.dev/stk-analytics.min.js"
 *   data-api-key="YOUR_API_KEY"
 *   data-api-url="https://your-api-endpoint.com/analytics/log"
 *   data-batch-interval="5000"
 *   data-debug="false">
 * </script>
 */

(function(window) {
  'use strict';

  // Configuration
  let config = {
    apiUrl: '',
    apiKey: 'unknown', // Changed from serviceName to apiKey
    batchIntervalMs: 5000,
    debug: false,
    autoTrackPageViews: true,
    autoTrackClicks: true,
    autoTrackScroll: true,
    autoTrackPerformance: true
  };

  // Internal state
  let eventQueue = [];
  let batchTimer = null;
  let pageLoadTime = 0;
  let maxScroll = 0;
  let startTime = Date.now();
  let sessionId = '';
  let userId = '';
  let userEmail = null;
  let isInitialized = false;

  // Utility functions
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function getAttributionData() {
    if (typeof window === 'undefined' || !window.location) return {};

    const urlParams = new URLSearchParams(window.location.search);

    return {
      utm_source: urlParams.get('utm_source'),
      utm_medium: urlParams.get('utm_medium'),
      utm_campaign: urlParams.get('utm_campaign'),
      utm_term: urlParams.get('utm_term'),
      utm_content: urlParams.get('utm_content'),
      landing_page: window.location.pathname + window.location.search,
      landing_domain: window.location.hostname,
      referrer: document.referrer || null,
      referrer_domain: document.referrer ? new URL(document.referrer).hostname : null,
    };
  }

  function getBrowserInfo() {
    if (typeof navigator === 'undefined') return {};

    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookieEnabled: navigator.cookieEnabled,
      online: navigator.onLine,
    };
  }

  function isLocalStorageAvailable() {
    try {
      const test = '__analytics_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  function isSessionStorageAvailable() {
    try {
      const test = '__analytics_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // Storage helpers
  function getStorageItem(key, storage = localStorage) {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  }

  function setStorageItem(key, value, storage = localStorage) {
    try {
      storage.setItem(key, value);
    } catch (e) {
      if (config.debug) console.warn('[Analytics] Storage error:', e);
    }
  }

  // Initialize session and user data
  function initializeSession() {
    if (isSessionStorageAvailable()) {
      sessionId = getStorageItem('analytics_session_id', sessionStorage) || generateUUID();
      setStorageItem('analytics_session_id', sessionId, sessionStorage);
    } else {
      sessionId = generateUUID();
    }

    if (isLocalStorageAvailable()) {
      userId = getStorageItem('analytics_user_id') || generateUUID();
      setStorageItem('analytics_user_id', userId);

      userEmail = getStorageItem('userEmail');
    } else {
      userId = generateUUID();
    }
  }

  // Track unique visitor (both per session and per day)
  function trackUniqueVisitor() {
    const currentSessionId = getStorageItem('analytics_session_id', sessionStorage);

    // Track per session (more granular)
    if (isSessionStorageAvailable()) {
      const lastTrackedSession = getStorageItem('analytics_unique_visitor_session', sessionStorage);
      if (lastTrackedSession !== currentSessionId) {
        queueEvent('unique_visitor_session', {
          category: 'visitor',
          custom: {
            first_visit_session: true,
            visitor_type: 'unique',
            tracking_type: 'per_session'
          }
        });
        setStorageItem('analytics_unique_visitor_session', currentSessionId, sessionStorage);
      }
    }

    // Track per day (traditional daily uniques)
    if (isLocalStorageAvailable()) {
      const today = new Date().toDateString();
      const lastTrackedDay = getStorageItem('analytics_unique_visitor_day');
      if (lastTrackedDay !== today) {
        queueEvent('unique_visitor_daily', {
          category: 'visitor',
          custom: {
            first_visit_day: true,
            visitor_type: 'unique',
            tracking_type: 'per_day'
          }
        });
        setStorageItem('analytics_unique_visitor_day', today);
      }
    }
  }

  // Queue event
  function queueEvent(eventName, data = {}) {
    const attribution = getAttributionData();
    const browserInfo = getBrowserInfo();

    const eventData = {
      event_category: data.category || 'engagement',
      event_label: data.label || null,
      value: data.value || null,
      custom_parameters: data.custom || {},
      user_id: userId,
      user_email: userEmail,
      session_id: sessionId,
      user_type: userEmail ? 'authenticated' : 'anonymous',
      first_visit: getStorageItem('analytics_first_visit') || new Date().toISOString(),
      visit_count: parseInt(getStorageItem('analytics_visit_count') || '0') + 1,
      page: window.location ? window.location.pathname : '',
      page_title: document.title || '',
      page_load_time: pageLoadTime,
      scroll_depth: maxScroll,
      time_on_page: 0,
      attribution: attribution,
      ...browserInfo,
      ...data
    };

    // Update visit count
    if (isLocalStorageAvailable()) {
      setStorageItem('analytics_visit_count', eventData.visit_count.toString());
      if (!getStorageItem('analytics_first_visit')) {
        setStorageItem('analytics_first_visit', eventData.first_visit);
      }
    }

    const event = {
      event_name: eventName,
      user_id: userId,
      user_email: userEmail || undefined,
      data: eventData,
      service: config.apiKey
    };

    eventQueue.push(event);

    if (config.debug) {
      console.log(`[Analytics] Event "${eventName}":`, data);
    }
  }

  // Send batch
  async function sendBatch() {
    if (eventQueue.length === 0 || !config.apiUrl || !config.apiKey) {
      if (!config.apiKey) {
        console.log('[Analytics] No API key configured - not sending logs');
      }
      if (!config.apiUrl) {
        console.log('[Analytics] No API URL configured - not sending logs');
      }
      return;
    }

    // In debug mode, don't send to backend - only log to console
    if (config.debug) {
      if (config.debug) {
        console.log('[Analytics] Debug mode: Not sending batch to backend. Events in queue:', eventQueue.length);
      }
      eventQueue = []; // Clear the queue but don't send
      return;
    }

    const eventsToSend = [...eventQueue];
    eventQueue = [];

    if (config.debug) {
      console.log('[Analytics] Sending batch:', eventsToSend.length, 'events');
    }

    try {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventsToSend)
      });

      if (response.ok) {
        if (config.debug) {
          console.log('[Analytics] Batch sent successfully');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      if (config.debug) {
        console.error('[Analytics] Batch send failed:', error);
      }
      // Re-queue events on failure
      eventQueue.unshift(...eventsToSend);
    }
  }

  // Start batch timer
  function startBatchTimer() {
    if (batchTimer) clearInterval(batchTimer);
    batchTimer = setInterval(() => {
      sendBatch().catch(error => {
        if (config.debug) console.error('[Analytics] Batch timer error:', error);
      });
    }, config.batchIntervalMs);
  }

  // Setup automatic tracking
  function setupAutomaticTracking() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Track page load time
    window.addEventListener('load', () => {
      pageLoadTime = performance.now();
      queueEvent('page_load_complete', {
        category: 'performance',
        custom: {
          load_time: pageLoadTime,
          dom_ready: performance.getEntriesByType &&
            performance.getEntriesByType('navigation')[0] &&
            performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd || 0,
          fully_loaded: true
        }
      });
    });

    // Track scroll depth
    if (config.autoTrackScroll) {
      window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const docHeight = document.body.offsetHeight || document.documentElement.offsetHeight;
        const winHeight = window.innerHeight;
        const scrollPercent = Math.round((scrollTop / (docHeight - winHeight)) * 100);
        maxScroll = Math.max(maxScroll, scrollPercent);
      });
    }

    // Track page exit
    window.addEventListener('pagehide', () => {
      const timeOnPage = Date.now() - startTime;
      queueEvent('page_exit', {
        time_on_page: timeOnPage,
        scroll_depth: maxScroll,
        page: window.location ? window.location.pathname : ''
      });
      // Send immediately on page exit
      sendBatch().catch(error => {
        if (config.debug) console.error('[Analytics] Page exit batch failed:', error);
      });
    });

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const timeOnPage = Date.now() - startTime;
        queueEvent('page_hidden', {
          time_on_page: timeOnPage,
          scroll_depth: maxScroll,
          page: window.location ? window.location.pathname : ''
        });
      } else {
        startTime = Date.now(); // Reset timer
      }
    });

    // Track clicks on elements with data-click attribute
    if (config.autoTrackClicks) {
      document.addEventListener('click', (event) => {
        const target = event.target.closest('[data-click]');
        if (target) {
          // Stop propagation for tracked clicks to prevent double-tracking
          event.stopPropagation();

          const clickType = target.getAttribute('data-click') || 'click';
          queueEvent('click', {
            category: 'interaction',
            label: target.textContent || target.innerText || '',
            element: target.tagName,
            href: target.href || null,
            click_type: clickType,
            custom: { x: event.clientX, y: event.clientY }
          });
        }
      });
    }

    // Track initial page view
    if (config.autoTrackPageViews) {
      queueEvent('page_view');

      // Track unique visitor
      trackUniqueVisitor();

      // Track session start
      setTimeout(() => {
        queueEvent('session_start', {
          category: 'session',
          custom: {
            session_type: 'new'
          }
        });
      }, 100);
    }
  }

  // Public API
  const Analytics = {
    // Initialize the analytics
    init: function(options = {}) {
      if (isInitialized) {
        if (config.debug) console.warn('[Analytics] Already initialized');
        return;
      }

      // Merge configuration
      config = { ...config, ...options };

      // Check if API key is provided
      if (!config.apiKey || config.apiKey.trim() === '') {
        console.error('[Analytics] API key is required and cannot be empty - not initializing');
        return;
      }

      // Check if API URL is provided
      if (!config.apiUrl || config.apiUrl.trim() === '') {
        console.error('[Analytics] API URL is required and cannot be empty - not initializing');
        return;
      }

      // Check if API URL is provided
      if (!config.apiUrl || config.apiUrl.trim() === '') {
        console.error('[Analytics] API URL is required and cannot be empty - not initializing');
        return;
      }

      // If custom API URL provided, append service name as query parameter
      const url = new URL(config.apiUrl);
      if (!url.searchParams.has('service') && !url.searchParams.has('apiKey')) {
        url.searchParams.set('apiKey', config.apiKey);
        config.apiUrl = url.toString();
      }

      // Initialize session
      initializeSession();

      // Setup automatic tracking
      setupAutomaticTracking();

      // Start batch timer
      startBatchTimer();

      isInitialized = true;

      if (config.debug) {
        console.log('[Analytics] Initialized with config:', config);
      }
    },

    // Track custom event
    trackEvent: function(eventName, data = {}) {
      if (!isInitialized) {
        if (config.debug) console.warn('[Analytics] Not initialized. Call Analytics.init() first.');
        return;
      }
      queueEvent(eventName, data);
    },

    // Track user interaction
    trackInteraction: function(action, label, data = {}) {
      this.trackEvent('interaction', {
        category: 'interaction',
        action,
        label,
        ...data
      });
    },

    // Track navigation
    trackNavigation: function(page, data = {}) {
      this.trackEvent('navigation', {
        category: 'navigation',
        page,
        ...data
      });
    },

    // Track error
    trackError: function(error, data = {}) {
      this.trackEvent('error', {
        category: 'error',
        error_message: error,
        ...data
      });
    },

    // Track performance
    trackPerformance: function(metric, value, data = {}) {
      this.trackEvent('performance', {
        category: 'performance',
        metric,
        value,
        ...data
      });
    },

    // User management
    setUserEmail: function(email) {
      userEmail = email;
      if (isLocalStorageAvailable()) {
        setStorageItem('userEmail', email);
      }
      if (config.debug) {
        console.log(`[Analytics] User email set: ${email}`);
      }
    },

    clearUserEmail: function() {
      userEmail = null;
      if (isLocalStorageAvailable()) {
        localStorage.removeItem('userEmail');
      }
      if (config.debug) {
        console.log('[Analytics] User email cleared');
      }
    },

    // Promo tracking
    trackPromoImpression: function(promoId, data = {}) {
      this.trackEvent('promo_impression', {
        category: 'promo',
        promo_id: promoId,
        ...data,
        ...getAttributionData()
      });
    },

    trackPromoClick: function(promoId, action = 'click', data = {}) {
      this.trackEvent('promo_click', {
        category: 'promo',
        promo_id: promoId,
        action,
        ...data,
        ...getAttributionData()
      });
    },

    // Send batch immediately
    sendBatch: function() {
      return sendBatch();
    },

    // Track unique visitor manually
    trackUniqueVisitor: function() {
      trackUniqueVisitor();
    },

    // Get current config (for debugging)
    getConfig: function() {
      return { ...config };
    },

    // Update config
    updateConfig: function(newConfig) {
      config = { ...config, ...newConfig };
      if (config.debug) {
        console.log('[Analytics] Config updated:', config);
      }
    }
  };

  // Make it available globally
  window.STKAnalytics = Analytics;

  // Get configuration from script tag data attributes
  function getConfigFromScriptTag() {
    // Find the script tag that loaded this file
    const scripts = document.getElementsByTagName('script');
    let analyticsScript = null;

    for (let script of scripts) {
      if (script.src && script.src.includes('stk-analytics') && script.getAttribute('data-api-key')) {
        analyticsScript = script;
        break;
      }
    }

    if (!analyticsScript) return null;

    // Read data attributes and convert to config
    const config = {};

    // data-api-key -> apiKey (required - stop if not provided or empty)
    const apiKey = analyticsScript.getAttribute('data-api-key');
    if (!apiKey || apiKey.trim() === '') {
      console.error('STK Analytics: data-api-key attribute is required and cannot be empty');
      return null; // Stop all initialization if API key not provided or empty
    }
    config.apiKey = apiKey;

    // data-api-url -> apiUrl
    const apiUrl = analyticsScript.getAttribute('data-api-url');
    if (apiUrl) {
      config.apiUrl = apiUrl;
    }

    // data-batch-interval -> batchIntervalMs
    if (analyticsScript.getAttribute('data-batch-interval')) {
      config.batchIntervalMs = parseInt(analyticsScript.getAttribute('data-batch-interval'));
    }

    // data-debug -> debug
    if (analyticsScript.getAttribute('data-debug')) {
      config.debug = analyticsScript.getAttribute('data-debug').toLowerCase() === 'true';
    }

    // data-disable-page-views -> autoTrackPageViews
    if (analyticsScript.getAttribute('data-disable-page-views')) {
      config.autoTrackPageViews = false;
    }

    // data-disable-clicks -> autoTrackClicks
    if (analyticsScript.getAttribute('data-disable-clicks')) {
      config.autoTrackClicks = false;
    }

    // data-disable-scroll -> autoTrackScroll
    if (analyticsScript.getAttribute('data-disable-scroll')) {
      config.autoTrackScroll = false;
    }

    return Object.keys(config).length > 0 ? config : null;
  }

  // Auto-initialize from script tag data attributes or window config
  const scriptConfig = getConfigFromScriptTag();
  if (scriptConfig) {
    Analytics.init(scriptConfig);
  } else if (window.AnalyticsConfig) {
    Analytics.init(window.AnalyticsConfig);
  }

})(typeof window !== 'undefined' ? window : {});
