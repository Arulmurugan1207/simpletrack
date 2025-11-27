# Analytics Data Integration Guide

This guide explains how to display the analytics data captured by your tracking script in the dashboard.

## 📊 What Data is Being Captured

Your analytics script automatically tracks:

- **Page Views**: Every page visit with URL, referrer, and attribution data
- **User Interactions**: Clicks, scrolls, form submissions
- **Performance Metrics**: Page load times, DOM ready times
- **User Context**: Device info, location, session data
- **Conversion Events**: Custom events you define
- **Error Tracking**: JavaScript errors and failed requests

## 🔄 How Data Flows to Your Dashboard

```
User Activity → Analytics Script → API Backend → Dashboard Service → UI Display
```

## 🚀 Quick Start - Display Analytics Data

### 1. Current Implementation (Mock Data)

Your dashboard currently shows **simulated analytics data** that updates every 30 seconds. This demonstrates the UI without requiring a backend.

**Files involved:**
- `src/app/services/analytics-data.service.ts` - Mock data service
- `src/app/dashboard/overview/overview.component.ts` - Component using the data
- `src/app/dashboard/overview/overview.component.html` - UI displaying the data

### 2. Connect to Real Analytics API

To display **real data** from your analytics script:

#### Step 1: Set up your backend API endpoints

Create these endpoints in your backend:

```javascript
// GET /api/analytics/realtime
{
  "liveVisitors": 247,
  "totalPageViews": 15420,
  "conversionRate": 3.2,
  "bounceRate": 42.5,
  "avgSessionDuration": 185,
  "newVsReturning": { "new": 65, "returning": 182 }
}

// GET /api/analytics/events/realtime
[
  {
    "id": "evt_123",
    "event": "page_view",
    "userId": "user_456",
    "timestamp": "2025-11-26T10:30:00Z",
    "page": "/dashboard",
    "location": { "country": "United States", "city": "New York" }
  }
]
```

#### Step 2: Update the API service

Modify `src/app/services/analytics-api.service.ts`:

```typescript
// Change the API URL to your backend
private apiUrl = 'https://your-backend-api.com/api';

// Update endpoints to match your API
getRealtimeMetrics(): Observable<any> {
  return this.http.get(`${this.apiUrl}/analytics/realtime`);
}
```

#### Step 3: Replace mock data with real API calls

In `src/app/dashboard/overview/overview.component.ts`:

```typescript
// Replace AnalyticsDataService with AnalyticsAPIService
import { AnalyticsAPIService } from '../../services/analytics-api.service';

constructor(private analyticsAPI: AnalyticsAPIService) { }

// Update data loading methods
private loadInitialData(): void {
  this.subscriptions.add(
    this.analyticsAPI.getRealtimeMetrics().subscribe(data => {
      this.metrics = data;
    })
  );
}
```

## 📈 Data Categories Displayed

### 1. **Live Metrics Cards**
- Live Visitors (real-time count)
- Total Page Views (cumulative)
- Conversion Rate (percentage)
- Average Session Duration

### 2. **Charts & Visualizations**
- Page Views Trend (bar chart)
- Device Breakdown (pie chart)
- Conversion Funnel (step-by-step)

### 3. **Data Tables**
- Top Pages (by view count)
- Geographic Distribution (by country)
- Traffic Sources (referrers)

### 4. **Realtime Events Feed**
- Live activity stream
- Event types: page views, clicks, scrolls, purchases
- User locations and timestamps

## 🔧 Customization Options

### Add New Metrics

1. **Extend the data service:**
```typescript
// Add new metric to AnalyticsDataService
getCustomMetrics(): Observable<any> {
  return of({
    customMetric1: value,
    customMetric2: value
  });
}
```

2. **Update component:**
```typescript
customMetrics: any = {};

private loadInitialData(): void {
  // Add to existing method
  this.subscriptions.add(
    this.analyticsDataService.getCustomMetrics().subscribe(data => {
      this.customMetrics = data;
    })
  );
}
```

3. **Update template:**
```html
<div class="stat-card">
  <div class="stat-value">{{ customMetrics.customMetric1 }}</div>
  <div class="stat-label">Custom Metric</div>
</div>
```

### Custom Event Tracking

Use the analytics script to track custom events:

```javascript
// In your components
import { AnalyticsService } from '../services/analytics.service';

constructor(private analytics: AnalyticsService) {}

onButtonClick() {
  this.analytics.trackEvent('button_click', {
    button_name: 'signup',
    page: '/landing'
  });
}
```

## 🎯 Real-world Implementation

### Backend Integration Example

```javascript
// Express.js example
app.get('/api/analytics/realtime', async (req, res) => {
  try {
    const metrics = await AnalyticsModel.getRealtimeMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

app.post('/analytics/log', async (req, res) => {
  try {
    await AnalyticsModel.storeEvent(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to store event' });
  }
});
```

### Database Schema Example

```sql
-- Analytics events table
CREATE TABLE analytics_events (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  page VARCHAR(500),
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Real-time metrics view
CREATE VIEW realtime_metrics AS
SELECT
  COUNT(DISTINCT user_id) as live_visitors,
  COUNT(*) as total_events,
  AVG(EXTRACT(EPOCH FROM (data->>'time_on_page')::interval)) as avg_session
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '5 minutes';
```

## 🚀 Next Steps

1. **Set up your backend API** with the endpoints above
2. **Update the API service** with your backend URLs
3. **Replace mock data calls** with real API calls
4. **Add data persistence** (database storage)
5. **Implement data aggregation** for historical trends
6. **Add user segmentation** and filtering
7. **Create custom dashboards** for different user roles

## 📊 Analytics Script Integration

The analytics script (`STKAnalytics`) automatically sends data to your API. Make sure your backend can handle the data format:

```javascript
// Data sent by analytics script
{
  event_name: "page_view",
  user_id: "uuid-string",
  user_email: "user@example.com", // if authenticated
  data: {
    page: "/dashboard",
    userAgent: "Mozilla/5.0...",
    attribution: { utm_source: "google", ... },
    time_on_page: 0,
    scroll_depth: 0,
    // ... more data
  }
}
```

This data is now being captured and can be displayed in your dashboard using the services and components provided!