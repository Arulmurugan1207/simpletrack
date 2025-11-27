import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsAPIService {
  private apiUrl = 'https://analytics-dot-node-server-apis.ue.r.appspot.com';

  constructor(private http: HttpClient) { }

  /**
   * Fetch real analytics data from your backend
   * Replace these endpoints with your actual API endpoints
   */
  getRealtimeMetrics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/live-events`).pipe(
      catchError(() => {
        console.warn('Using mock data - API endpoint not available');
        return of(this.getMockRealtimeData());
      })
    );
  }

  getPageViewsData(timeRange: string = '7d'): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/page-views?range=${timeRange}`).pipe(
      catchError(() => {
        console.warn('Using mock data - API endpoint not available');
        return of(this.getMockPageViewsData());
      })
    );
  }

  getUserEvents(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/users/${userId}/events`).pipe(
      catchError(() => {
        console.warn('Using mock data - API endpoint not available');
        return of(this.getMockUserEvents());
      })
    );
  }

  getConversionFunnel(): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/conversion-funnel`).pipe(
      catchError(() => {
        console.warn('Using mock data - API endpoint not available');
        return of(this.getMockConversionFunnel());
      })
    );
  }

  getGeographicData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/geographic`).pipe(
      catchError(() => {
        console.warn('Using mock data - API endpoint not available');
        return of(this.getMockGeographicData());
      })
    );
  }

  /**
   * Send analytics event to backend
   */
  sendAnalyticsEvent(eventData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/analytics/log`, eventData).pipe(
      catchError((error) => {
        console.warn('Failed to send analytics event:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

  // Mock data methods (fallback when API is not available)
  private getMockRealtimeData() {
    return {
      liveVisitors: Math.floor(Math.random() * 500) + 100,
      activePages: Math.floor(Math.random() * 50) + 20,
      eventsPerMinute: Math.floor(Math.random() * 100) + 50,
      topPages: [
        { path: '/', visitors: Math.floor(Math.random() * 100) + 50 },
        { path: '/dashboard', visitors: Math.floor(Math.random() * 80) + 30 },
        { path: '/products', visitors: Math.floor(Math.random() * 60) + 20 }
      ]
    };
  }

  private getMockPageViewsData() {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        pageViews: Math.floor(Math.random() * 1000) + 500,
        uniqueVisitors: Math.floor(Math.random() * 800) + 300,
        bounceRate: Math.round((Math.random() * 30 + 40) * 100) / 100
      });
    }
    return data;
  }

  private getMockUserEvents() {
    return [
      {
        event: 'page_view',
        page: '/dashboard',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        event: 'click',
        page: '/dashboard',
        element: 'nav-tab',
        timestamp: new Date(Date.now() - 240000).toISOString(),
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      {
        event: 'scroll',
        page: '/dashboard',
        depth: 75,
        timestamp: new Date(Date.now() - 180000).toISOString(),
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
      }
    ];
  }

  private getMockConversionFunnel() {
    return {
      steps: [
        { name: 'Landing Page', visitors: 10000, conversion: 100 },
        { name: 'Product View', visitors: 7500, conversion: 75 },
        { name: 'Add to Cart', visitors: 3200, conversion: 32 },
        { name: 'Purchase', visitors: 1200, conversion: 12 }
      ]
    };
  }

  private getMockGeographicData() {
    return [
      { country: 'United States', visitors: 8920, percentage: 45.2, flag: '🇺🇸' },
      { country: 'United Kingdom', visitors: 5430, percentage: 27.5, flag: '🇬🇧' },
      { country: 'Germany', visitors: 3210, percentage: 16.3, flag: '🇩🇪' },
      { country: 'Canada', visitors: 2100, percentage: 10.6, flag: '🇨🇦' },
      { country: 'Australia', visitors: 1200, percentage: 6.1, flag: '🇦🇺' }
    ];
  }
}