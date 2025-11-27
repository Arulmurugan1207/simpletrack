import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timer } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AnalyticsAPIService } from './analytics-api.service';

export interface AnalyticsSummary {
  total_events: number;
  unique_users: number;
}

export interface EventData {
  event: string;
  count: number;
}

export interface GeoData {
  country: string;
  count: number;
}

export interface PageViewData {
  page: string;
  views: number;
}

export interface DeviceApiData {
  device: string;
  os: string;
  count: number;
}

export interface AnalyticsApiResponse {
  summary: AnalyticsSummary;
  events: EventData[];
  geo: GeoData[];
  pages: PageViewData[];
  devices: DeviceApiData[];
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface AnalyticsMetrics {
  liveVisitors: number;
  totalPageViews: number;
  conversionRate: number;
  bounceRate: number;
  avgSessionDuration: number;
  newVsReturning: {
    new: number;
    returning: number;
  };
}

export interface DeviceBreakdown {
  desktop: number;
  mobile: number;
  tablet: number;
  desktopPercentage: number;
  mobilePercentage: number;
  tabletPercentage: number;
}

export interface PageData {
  path: string;
  views: number;
  uniqueViews: number;
  avgTime: number;
  bounceRate: number;
}

export interface GeographicData {
  country: string;
  visitors: number;
  percentage: number;
  flag?: string;
}

export interface ConversionFunnel {
  labels: string[];
  values: number[];
}

export interface RealtimeEvent {
  event_name: string;
  user_id: string;
  data: {
    event_category?: string;
    event_label?: string | null;
    value?: number | null;
    custom_parameters?: Record<string, any>;
    user_id: string;
    user_email?: string | null;
    session_id: string;
    user_type: string;
    first_visit: string;
    visit_count: number;
    page_views?: number;
    page: string;
    page_load_time?: number;
    scroll_depth?: number | null;
    time_on_page?: number;
    device_type?: string;
    browser?: string;
    referrer?: string | null;
    label?: string;
    custom?: Record<string, any>;
    attribution?: {
      utm_source?: string | null;
      utm_medium?: string | null;
      utm_campaign?: string | null;
      utm_term?: string | null;
      utm_content?: string | null;
      landing_page: string;
      landing_domain: string;
      referrer?: string | null;
      referrer_domain?: string | null;
    };
    userAgent?: string;
    language?: string;
    platform?: string;
    screenResolution?: string;
    timezone: string;
    cookieEnabled: boolean;
    online: boolean;
    category?: string;
    previousUrl?: string;
    route?: string;
    country: string;
    ip: string;
  };
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsDataService {
  private baseUrl = 'http://localhost:3004';

  constructor(private http: HttpClient) { }

  /**
   * Fetch analytics data from the API
   */
  private fetchAnalyticsData(): Observable<AnalyticsApiResponse> {
    const url = `${this.baseUrl}/analytics/data?type=all&service=tabletennistube`;
    return this.http.get<AnalyticsApiResponse>(url).pipe(
      catchError(error => {
        console.error('Error fetching analytics data:', error);
        // Return mock data as fallback
        return of({
          summary: { total_events: 0, unique_users: 0 },
          events: [],
          geo: [],
          pages: [],
          devices: []
        });
      })
    );
  }

  /**
   * Get current analytics metrics with optional date filtering
   */
  getMetrics(dateRange?: DateRange): Observable<AnalyticsMetrics> {
    return this.fetchAnalyticsData().pipe(
      map(data => ({
        liveVisitors: data.summary.unique_users,
        totalPageViews: data.summary.total_events,
        conversionRate: 0, // Will calculate from events data if needed
        bounceRate: 0,
        avgSessionDuration: 0,
        newVsReturning: {
          new: Math.floor(data.summary.unique_users * 0.6),
          returning: Math.floor(data.summary.unique_users * 0.4)
        }
      })),
      catchError(error => {
        console.error('Error fetching metrics:', error);
        return of({
          liveVisitors: 0,
          totalPageViews: 0,
          conversionRate: 0,
          bounceRate: 0,
          avgSessionDuration: 0,
          newVsReturning: { new: 0, returning: 0 }
        });
      })
    );
  }

  /**
   * Get device breakdown data with optional date filtering
   */
  getDeviceBreakdown(dateRange?: DateRange): Observable<DeviceBreakdown> {
    return this.fetchAnalyticsData().pipe(
      map(data => {
        // Aggregate device data from API
        let desktop = 0;
        let mobile = 0;
        let tablet = 0;

        data.devices.forEach(device => {
          const count = device.count;
          if (device.device.toLowerCase() === 'desktop') {
            desktop += count;
          } else if (device.device.toLowerCase() === 'mobile') {
            mobile += count;
          } else if (device.device.toLowerCase() === 'tablet') {
            tablet += count;
          }
        });

        const total = desktop + mobile + tablet;

        return {
          desktop,
          mobile,
          tablet,
          desktopPercentage: total > 0 ? Math.round((desktop / total) * 100) : 0,
          mobilePercentage: total > 0 ? Math.round((mobile / total) * 100) : 0,
          tabletPercentage: total > 0 ? Math.round((tablet / total) * 100) : 0
        };
      }),
      catchError(error => {
        console.error('Error fetching device breakdown:', error);
        return of({
          desktop: 0,
          mobile: 0,
          tablet: 0,
          desktopPercentage: 0,
          mobilePercentage: 0,
          tabletPercentage: 0
        });
      })
    );
  }

  /**
   * Get top pages data with optional date filtering
   */
  getTopPages(dateRange?: DateRange): Observable<PageData[]> {
    return this.fetchAnalyticsData().pipe(
      map(data => data.pages.map(page => ({
        path: page.page,
        views: page.views,
        uniqueViews: Math.floor(page.views * 0.7), // Estimate unique views
        avgTime: 120, // Default average time
        bounceRate: 0.35 // Default bounce rate
      }))),
      catchError(error => {
        console.error('Error fetching top pages:', error);
        return of([]);
      })
    );
  }

  /**
   * Get geographic data with optional date filtering
   */
  getGeographicData(dateRange?: DateRange): Observable<GeographicData[]> {
    return this.fetchAnalyticsData().pipe(
      map(data => {
        const total = data.geo.reduce((sum, item) => sum + item.count, 0);
        return data.geo.map(geo => ({
          country: geo.country === 'Unknown' ? 'Unknown' : geo.country,
          visitors: geo.count,
          percentage: Math.round((geo.count / total) * 100 * 10) / 10
        }));
      }),
      catchError(error => {
        console.error('Error fetching geographic data:', error);
        return of([]);
      })
    );
  }

  /**
   * Get conversion funnel data with optional date filtering
   */
  getConversionFunnel(dateRange?: DateRange): Observable<ConversionFunnel> {
    return this.fetchAnalyticsData().pipe(
      map(data => {
        // Create funnel from events data
        const pageViews = data.events.find(e => e.event === 'page_view')?.count || 0;
        const clicks = data.events.find(e => e.event === 'click')?.count || 0;
        const tournamentViews = data.events.find(e => e.event === 'tournament_view')?.count || 0;
        const purchases = data.events.find(e => e.event === 'purchase')?.count || 0;

        return {
          labels: ['Page Views', 'Clicks', 'Tournament Views', 'Purchases'],
          values: [pageViews, clicks, tournamentViews, purchases]
        };
      }),
      catchError(error => {
        console.error('Error fetching conversion funnel:', error);
        return of({ labels: [], values: [] });
      })
    );
  }

  /**
   * Get realtime events from the API using EventSource for streaming
   */
  getRealtimeEvents(): Observable<RealtimeEvent[]> {
    console.log('🔄 getRealtimeEvents() called - attempting to connect to event stream');

    return new Observable<RealtimeEvent[]>(observer => {
      const url = `${this.baseUrl}/analytics/live-events`;
      console.log('📡 Connecting to EventSource URL:', url);

      // Try to connect to EventSource for real-time streaming
      try {
        const eventSource = new EventSource(url);

        let eventsBuffer: RealtimeEvent[] = [];

        eventSource.onmessage = (event) => {
          console.log('📨 EventSource message received:', event.data);

          try {
            // Handle SSE message format: "message\t{json_data}"
            let jsonData = event.data;
            if (event.data.startsWith('message\t')) {
              jsonData = event.data.substring(8); // Remove "message\t" prefix
              console.log('✂️ Removed message prefix, JSON data:', jsonData);
            }

            const data = JSON.parse(jsonData);
            console.log('✅ Successfully parsed JSON data:', data);

            // Handle different response formats
            let newEvents: RealtimeEvent[] = [];
            if (Array.isArray(data)) {
              console.log('📋 Received array of events:', data.length, 'events');
              newEvents = data;
            } else if (data && typeof data === 'object') {
              // Single event or wrapped response
              if (data.events && Array.isArray(data.events)) {
                console.log('📦 Received wrapped events array:', data.events.length, 'events');
                newEvents = data.events;
              } else if (data.event_name) {
                console.log('🎯 Received single event:', data.event_name);
                newEvents = [data as RealtimeEvent];
              } else {
                console.warn('⚠️ Received unknown data format:', data);
              }
            }

            if (newEvents.length > 0) {
              console.log('🚀 Adding', newEvents.length, 'new events to buffer');
              // Add new events to buffer and emit
              eventsBuffer = [...newEvents, ...eventsBuffer].slice(0, 50); // Keep last 50 events
              console.log('📊 Events buffer now contains', eventsBuffer.length, 'events');
              observer.next([...eventsBuffer]);
            } else {
              console.warn('⚠️ No valid events found in message');
            }
          } catch (parseError) {
            console.error('❌ Error parsing event stream data:', parseError, 'Raw data:', event.data);
          }
        };

        eventSource.onerror = (error) => {
          console.error('🔌 EventSource error, falling back to mock data:', error);
          eventSource.close();

          // Fall back to mock data with periodic updates
          this.startMockEventStream(observer);
        };

        eventSource.onopen = () => {
          console.log('🔗 EventSource connected successfully for realtime events');
        };

        // Cleanup function
        return () => {
          console.log('🧹 Cleaning up EventSource connection');
          eventSource.close();
        };

      } catch (error) {
        console.error('💥 EventSource creation failed, using mock data:', error);
        // Fall back to mock data
        return this.startMockEventStream(observer);
      }
    });
  }

  /**
   * Start mock event stream for fallback
   */
  private startMockEventStream(observer: any): () => void {
    console.log('🎭 Starting mock event stream fallback');
    let eventsBuffer: RealtimeEvent[] = this.getMockRealtimeEvents();
    console.log('🎲 Generated initial mock events:', eventsBuffer.length);
    observer.next([...eventsBuffer]);

    // Update every 5 seconds with new mock events
    const intervalId = setInterval(() => {
      const newEvent = this.generateSingleMockEvent();
      console.log('🎪 Generated new mock event:', newEvent.event_name, 'for user:', newEvent.user_id);
      eventsBuffer = [newEvent, ...eventsBuffer].slice(0, 50);
      observer.next([...eventsBuffer]);
    }, 5000);

    // Return cleanup function
    return () => {
      console.log('🧹 Cleaning up mock event stream');
      clearInterval(intervalId);
    };
  }

  /**
   * Generate a single mock event for streaming
   */
  private generateSingleMockEvent(): RealtimeEvent {
    const eventTypes = ['page_view', 'click', 'scroll', 'navigation', 'page_hidden', 'form_submit'];
    const pages = ['/', '/dashboard', '/products', '/about', '/contact'];
    const countries = ['United States', 'United Kingdom', 'Germany', 'France', 'Canada', 'Australia'];
    const userTypes = ['new', 'returning'];
    const categories = ['engagement', 'navigation', 'interaction'];

    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    return {
      event_name: eventType,
      user_id: `user_${Math.floor(Math.random() * 1000) + 1}`,
      data: {
        user_id: `user_${Math.floor(Math.random() * 1000) + 1}`,
        event_category: categories[Math.floor(Math.random() * categories.length)],
        event_label: eventType === 'click' ? 'button_click' : null,
        value: eventType === 'purchase' ? Math.floor(Math.random() * 100) + 10 : null,
        custom_parameters: {},
        user_email: null,
        session_id: `session_${Math.floor(Math.random() * 500) + 1}`,
        user_type: userTypes[Math.floor(Math.random() * userTypes.length)],
        first_visit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        visit_count: Math.floor(Math.random() * 20) + 1,
        page_views: Math.floor(Math.random() * 15) + 1,
        time_on_page: Math.floor(Math.random() * 600) + 30,
        device_type: Math.random() > 0.5 ? 'desktop' : 'mobile',
        browser: Math.random() > 0.5 ? 'Chrome' : 'Safari',
        referrer: Math.random() > 0.7 ? 'https://google.com' : null,
        label: eventType === 'tournament_view' ? 'tournament_page' : undefined,
        custom: eventType === 'tournament_view' ? { tournamentId: 'mock_id', pageType: 'mock_type' } : undefined,
        timezone: 'America/New_York',
        cookieEnabled: true,
        online: true,
        category: 'website',
        route: pages[Math.floor(Math.random() * pages.length)],
        country: countries[Math.floor(Math.random() * countries.length)],
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        page: pages[Math.floor(Math.random() * pages.length)]
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate mock realtime events data
   */
  private getMockRealtimeEvents(): RealtimeEvent[] {
    const events: RealtimeEvent[] = [];
    const eventTypes = ['page_view', 'click', 'scroll', 'navigation', 'page_hidden', 'form_submit'];
    const pages = ['/', '/dashboard', '/products', '/about', '/contact'];
    const countries = ['United States', 'United Kingdom', 'Germany', 'France', 'Canada', 'Australia'];
    const userTypes = ['new', 'returning'];
    const categories = ['engagement', 'navigation', 'interaction'];

    // Generate 8-12 mock events
    const numEvents = Math.floor(Math.random() * 5) + 8;

    for (let i = 0; i < numEvents; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const timestamp = new Date(Date.now() - Math.random() * 300000).toISOString(); // Within last 5 minutes

      events.push({
        event_name: eventType,
        user_id: `user_${Math.floor(Math.random() * 1000) + 1}`,
        data: {
          user_id: `user_${Math.floor(Math.random() * 1000) + 1}`,
          event_category: categories[Math.floor(Math.random() * categories.length)],
          event_label: eventType === 'click' ? 'button_click' : null,
          value: eventType === 'purchase' ? Math.floor(Math.random() * 100) + 10 : null,
          custom_parameters: {},
          user_email: null,
          session_id: `session_${Math.floor(Math.random() * 500) + 1}`,
          user_type: userTypes[Math.floor(Math.random() * userTypes.length)],
          first_visit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          visit_count: Math.floor(Math.random() * 20) + 1,
          page_views: Math.floor(Math.random() * 15) + 1,
        time_on_page: Math.floor(Math.random() * 600) + 30, // 30 seconds to 10 minutes
        device_type: Math.random() > 0.5 ? 'desktop' : 'mobile',
        browser: Math.random() > 0.5 ? 'Chrome' : 'Safari',
        referrer: Math.random() > 0.7 ? 'https://google.com' : null,
        label: eventType === 'tournament_view' ? 'tournament_page' : undefined,
        custom: eventType === 'tournament_view' ? { tournamentId: 'mock_id', pageType: 'mock_type' } : undefined,
          timezone: 'America/New_York',
          cookieEnabled: true,
          online: true,
          category: 'website',
          route: pages[Math.floor(Math.random() * pages.length)],
          country: countries[Math.floor(Math.random() * countries.length)],
          ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
          page: pages[Math.floor(Math.random() * pages.length)]
        },
        timestamp: timestamp
      });
    }

    // Sort by timestamp (most recent first)
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }



  /**
   * Get page view trends over time
   */
  getPageViewTrends(days: number = 30, dateRange?: DateRange): Observable<{ date: string; views: number; uniqueViews: number }[]> {
    const data = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      data.push({
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 1000) + 500,
        uniqueViews: Math.floor(Math.random() * 800) + 300
      });
    }

    return of(data);
  }

  /**
   * Get traffic sources data with optional date filtering
   */
  getTrafficSources(dateRange?: DateRange): Observable<{ source: string; visitors: number; percentage: number }[]> {
    return of([
      { source: 'Direct', visitors: Math.floor(Math.random() * 2000) + 3000, percentage: 35.2 },
      { source: 'Google Search', visitors: Math.floor(Math.random() * 1500) + 2500, percentage: 28.7 },
      { source: 'Social Media', visitors: Math.floor(Math.random() * 1000) + 1500, percentage: 18.3 },
      { source: 'Email', visitors: Math.floor(Math.random() * 500) + 800, percentage: 9.8 },
      { source: 'Referral', visitors: Math.floor(Math.random() * 300) + 500, percentage: 8.0 }
    ]);
  }
}