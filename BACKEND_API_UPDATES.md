# Backend API Updates - Entry & Exit Pages

## Date: March 11, 2026

## Overview
Added two new endpoints to the backend analytics API to support Entry and Exit Pages tracking in the dashboard.

---

## New Endpoints

### 1. GET `/analytics/entry-pages`

**Purpose:** Returns pages where users first land (entry points to the website)

**Query Parameters:**
- `apiKey` (required) - API key for authentication
- `limit` (optional, default: 10) - Maximum number of results
- `startDate` (optional) - ISO date string for date range filtering
- `endDate` (optional) - ISO date string for date range filtering

**Response Format:**
```json
{
  "pages": [
    {
      "path": "/home",
      "entrances": 1250,
      "percentage": 45.5,
      "isEntry": true
    },
    {
      "path": "/blog",
      "entrances": 680,
      "percentage": 24.7,
      "isEntry": true
    }
  ],
  "total": 2
}
```

**Logic:**
- Groups page views by user_id
- Takes the FIRST page view per user (sorted by timestamp ascending)
- Counts how many times each page was the entry point
- Calculates percentage of total entrances

---

### 2. GET `/analytics/exit-pages`

**Purpose:** Returns pages where users exit the website (last page viewed before leaving)

**Query Parameters:**
- `apiKey` (required) - API key for authentication
- `limit` (optional, default: 10) - Maximum number of results
- `startDate` (optional) - ISO date string for date range filtering
- `endDate` (optional) - ISO date string for date range filtering

**Response Format:**
```json
{
  "pages": [
    {
      "path": "/checkout",
      "exits": 320,
      "percentage": 28.5,
      "exitRate": 65.3,
      "isExit": true
    },
    {
      "path": "/contact",
      "exits": 245,
      "percentage": 21.8,
      "exitRate": 42.1,
      "isExit": true
    }
  ],
  "total": 2
}
```

**Logic:**
- Groups page views by user_id
- Takes the LAST page view per user (sorted by timestamp descending)
- Counts how many times each page was the exit point
- Calculates percentage of total exits
- Calculates exit rate: (exits / total page views) * 100

**Exit Rate Interpretation:**
- **Low (<40%)**: Green - Good retention on this page
- **Medium (40-70%)**: Orange - Moderate exit rate
- **High (>70%)**: Red - High exit rate, may need optimization

---

## Implementation Details

### Files Modified:

1. **`/controllers/analyticsController.js`**
   - Added `getEntryPages()` function
   - Added `getExitPages()` function
   - Exported both functions in module.exports

2. **`/routes/analytics.js`**
   - Added route: `GET /entry-pages`
   - Added route: `GET /exit-pages`
   - Both routes use `verifyDashboardAuth` and `apiKeyLimiter` middleware

### Database Queries:

Both endpoints use MongoDB aggregation pipelines:

**Entry Pages Pipeline:**
```javascript
[
  { $match: { event_name: 'page_view', 'data.page': { $exists: true }, ...dateFilter } },
  { $sort: { user_id: 1, timestamp: 1 } },
  { $group: { _id: '$user_id', firstPage: { $first: '$data.page' } } },
  { $group: { _id: '$firstPage', entrances: { $sum: 1 } } },
  { $sort: { entrances: -1 } },
  { $limit: limit }
]
```

**Exit Pages Pipeline:**
```javascript
[
  { $match: { event_name: 'page_view', 'data.page': { $exists: true }, ...dateFilter } },
  { $sort: { user_id: 1, timestamp: -1 } },
  { $group: { _id: '$user_id', lastPage: { $first: '$data.page' } } },
  { $group: { _id: '$lastPage', exits: { $sum: 1 } } },
  { $sort: { exits: -1 } },
  { $limit: limit }
]
```

---

## Date Range Filtering

Both endpoints support date range filtering using the existing `buildDateFilter(req)` utility:

```javascript
// Accepts startDate and endDate as query parameters
// Example: ?startDate=2026-03-01T00:00:00.000Z&endDate=2026-03-11T23:59:59.999Z

const dateFilter = buildDateFilter(req);
// Returns: { timestamp: { $gte: Date, $lte: Date } }
```

---

## Authentication & Security

- **JWT Authentication**: Both endpoints require valid JWT token via `verifyDashboardAuth` middleware
- **API Key Validation**: Ensures user owns the API key they're querying
- **Rate Limiting**: Protected by `apiKeyLimiter` middleware to prevent abuse
- **Error Handling**: Try-catch blocks with 500 status code on errors

---

## Frontend Integration

The frontend already has the API service methods configured:

```typescript
// src/app/services/analytics-api.service.ts

getEntryPages(dateRange?: DateRange, limit: number = 10): Observable<any>
getExitPages(dateRange?: DateRange, limit: number = 10): Observable<any>
```

Used in:
- `src/app/pages/dashboard/overview/overview.ts`
- Displays in "Entry & Exit Pages" section with color-coded exit rates

---

## Testing

To test the new endpoints:

```bash
# Entry Pages
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3004/analytics/entry-pages?apiKey=YOUR_API_KEY&limit=10"

# Exit Pages
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3004/analytics/exit-pages?apiKey=YOUR_API_KEY&limit=10"

# With date range
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3004/analytics/entry-pages?apiKey=YOUR_API_KEY&limit=10&startDate=2026-03-01T00:00:00.000Z&endDate=2026-03-11T23:59:59.999Z"
```

---

## Server Status

✅ Backend server restarted successfully
✅ Running on port 3004
✅ All endpoints active and ready

---

## Summary

**What Changed:**
- ✅ Added 2 new API endpoints (entry-pages, exit-pages)
- ✅ Both support date range filtering
- ✅ Both use existing authentication middleware
- ✅ Frontend already integrated and ready
- ✅ Server restarted with new endpoints

**Ready for Production:**
All mock data has been removed from the frontend. The dashboard now uses real-time data from these new endpoints.

**Next Steps:**
- Test with real user traffic data
- Monitor performance of aggregation queries
- Consider adding indexes on `user_id` and `timestamp` for better performance
