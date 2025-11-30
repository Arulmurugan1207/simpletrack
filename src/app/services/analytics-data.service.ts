import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, interval } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AnalyticsAPIService } from './analytics-api.service';
import { environment } from '../../environments/environment';

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
  desktopPercentage?: number;
  mobilePercentage?: number;
  tabletPercentage?: number;
}

export interface PageData {
  path: string;
  views: number;
  percentage: number;
}

export interface GeographicData {
  country: string;
  visitors: number;
  percentage: number;
  flag: string;
}

export interface ConversionFunnel {
  steps: {
    name: string;
    visitors: number;
    conversion: number;
  }[];
  labels?: string[];
  values?: number[];
}

export interface RealtimeEvent {
  id: string;
  event_name: string;
  user_id: string;
  timestamp: string;
  data: {
    event_category?: string;
    page: string;
    user_type: string;
    country?: string;
    visit_count?: number;
    time_on_page?: number;
    [key: string]: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsDataService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private analyticsAPI: AnalyticsAPIService
  ) { }

  /**
   * Send analytics event with API key validation
   */
  sendAnalyticsEvent(eventData: any, apiKey?: string): Observable<any> {
    return this.analyticsAPI.sendAnalyticsEvent(eventData, apiKey);
  }

  /**
   * Get analytics metrics
   */
  getMetrics(dateRange?: DateRange): Observable<AnalyticsMetrics> {
    return this.analyticsAPI.getRealtimeMetrics().pipe(
      map((data: any) => ({
        liveVisitors: data.liveVisitors || 0,
        totalPageViews: data.totalPageViews || 0,
        conversionRate: data.conversionRate || 0,
        bounceRate: data.bounceRate || 0,
        avgSessionDuration: data.avgSessionDuration || 0,
        newVsReturning: data.newVsReturning || { new: 0, returning: 0 }
      })),
      catchError(() => of({
        liveVisitors: 0,
        totalPageViews: 0,
        conversionRate: 0,
        bounceRate: 0,
        avgSessionDuration: 0,
        newVsReturning: { new: 0, returning: 0 }
      }))
    );
  }

  /**
   * Get device breakdown data
   */
  getDeviceBreakdown(dateRange?: DateRange): Observable<DeviceBreakdown> {
    return this.analyticsAPI.getDeviceBreakdown().pipe(
      map((data: any) => data || {
        desktop: 0,
        mobile: 0,
        tablet: 0,
        desktopPercentage: 0,
        mobilePercentage: 0,
        tabletPercentage: 0
      }),
      catchError(() => of({
        desktop: 0,
        mobile: 0,
        tablet: 0,
        desktopPercentage: 0,
        mobilePercentage: 0,
        tabletPercentage: 0
      }))
    );
  }

  /**
   * Get top pages data
   */
  getTopPages(dateRange?: DateRange): Observable<PageData[]> {
    return of([]);
  }

  /**
   * Get geographic data
   */
  getGeographicData(dateRange?: DateRange): Observable<GeographicData[]> {
    return this.analyticsAPI.getGeographicData().pipe(
      map((data: any) => Array.isArray(data) ? data : []),
      catchError(() => of([]))
    );
  }

  /**
   * Get conversion funnel data
   */
  getConversionFunnel(dateRange?: DateRange): Observable<ConversionFunnel> {
    return this.analyticsAPI.getConversionFunnel().pipe(
      map((data: any) => data || {
        steps: [],
        labels: [],
        values: []
      }),
      catchError(() => of({
        steps: [],
        labels: [],
        values: []
      }))
    );
  }

  /**
   * Get realtime events stream
   */
  getRealtimeEvents(): Observable<RealtimeEvent[]> {
    return interval(5000).pipe(
      switchMap(() => of([]))
    );
  }


}
