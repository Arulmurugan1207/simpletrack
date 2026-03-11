# Form Interactions - Real-Time Implementation

## Date: March 11, 2026

## Overview
Replaced mock data with real-time form interaction tracking using backend analytics events.

---

## What Was Implemented

### ✅ Backend API Endpoint

**Endpoint:** `GET /analytics/form-interactions`

**Purpose:** Track and analyze form engagement metrics including submissions, abandonment, completion time, and conversion rates.

**Query Parameters:**
- `apiKey` (required) - API key for authentication
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of results per page
- `startDate` (optional) - ISO date string for date range filtering
- `endDate` (optional) - ISO date string for date range filtering

**Response Format:**
```json
{
  "forms": [
    {
      "formId": "sign-in-form",
      "submissions": 145,
      "abandons": 32,
      "avgTimeToComplete": 18.5,
      "conversionRate": 81.9,
      "fieldInteractions": 890,
      "starts": 177
    },
    {
      "formId": "checkout-form",
      "submissions": 67,
      "abandons": 89,
      "avgTimeToComplete": 78.3,
      "conversionRate": 42.9,
      "fieldInteractions": 2134,
      "starts": 156
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 10,
  "pages": 1
}
```

---

## Tracked Events

The endpoint processes these form-related events:

### 1. **`form_start`**
Fired when a user begins interacting with a form.
```javascript
{
  event_name: 'form_start',
  data: {
    formId: 'sign-in-form',
    page: '/login'
  },
  user_id: 'user_123',
  timestamp: '2026-03-11T10:30:00.000Z'
}
```

### 2. **`form_submit`**
Fired when a user successfully submits a form.
```javascript
{
  event_name: 'form_submit',
  data: {
    formId: 'sign-in-form',
    page: '/login',
    success: true
  },
  user_id: 'user_123',
  timestamp: '2026-03-11T10:30:45.000Z'
}
```

### 3. **`form_abandon`**
Fired when a user leaves a form without submitting.
```javascript
{
  event_name: 'form_abandon',
  data: {
    formId: 'sign-in-form',
    page: '/login',
    fieldsCompleted: 1,
    totalFields: 2
  },
  user_id: 'user_456',
  timestamp: '2026-03-11T10:32:00.000Z'
}
```

### 4. **`form_field_interaction`**
Fired when a user interacts with form fields (focus, blur, input).
```javascript
{
  event_name: 'form_field_interaction',
  data: {
    formId: 'sign-in-form',
    fieldName: 'email',
    action: 'focus'
  },
  user_id: 'user_123',
  timestamp: '2026-03-11T10:30:15.000Z'
}
```

---

## Calculated Metrics

### 1. **Submissions**
Total number of `form_submit` events for each form.

### 2. **Starts**
Total number of `form_start` events for each form.

### 3. **Abandons**
Total number of `form_abandon` events for each form.

### 4. **Field Interactions**
Total number of `form_field_interaction` events for each form.

### 5. **Conversion Rate**
```
Conversion Rate = (Submissions / Starts) × 100
```
- **High (>70%)**: Green - Good form UX
- **Medium (40-70%)**: Orange - Needs improvement
- **Low (<40%)**: Red - Critical issues

### 6. **Average Time to Complete**
Calculated by tracking the time between `form_start` and `form_submit` events for the same user session.

```
Avg Time = Σ(Submit Time - Start Time) / Number of Completions
```

Expressed in seconds (e.g., 18.5 seconds).

---

## Backend Implementation

### Database Query Logic

**MongoDB Aggregation Pipeline:**
```javascript
// 1. Match all form-related events
{
  $match: {
    event_name: { $in: ['form_start', 'form_submit', 'form_field_interaction', 'form_abandon'] },
    'data.formId': { $exists: true, $ne: null },
    ...dateFilter
  }
}

// 2. Group events by formId
{
  $group: {
    _id: '$data.formId',
    events: { $push: { event_name, timestamp, user_id, data } }
  }
}
```

**Processing:**
1. Count event types per form
2. Group events by user to track sessions
3. Calculate time between start and submit
4. Compute averages and rates
5. Sort by submissions (most active first)
6. Apply pagination

---

## Frontend Integration

### API Service Method

**File:** `src/app/services/analytics-api.service.ts`

```typescript
getFormInteractions(dateRange?: DateRange, page: number = 1, limit: number = 10): Observable<any> {
  const selectedApiKey = this.apiKeysService.getSelectedApiKey();
  if (!selectedApiKey) return of({ forms: [], total: 0, page: 1, limit: 10, pages: 0 });
  
  return this.http.get(`${this.apiUrl}/analytics/form-interactions?apiKey=${selectedApiKey}&page=${page}&limit=${limit}${this.buildDateParams(dateRange)}`).pipe(
    catchError(() => of({ forms: [], total: 0, page: 1, limit: 10, pages: 0 }))
  );
}
```

### Component Usage

**File:** `src/app/pages/dashboard/overview/overview.ts`

```typescript
private async loadFormInteractionsWithDelay(): Promise<void> {
  this.analyticsAPIService.getFormInteractions(
    this.currentDateRange || undefined,
    this.formInteractionsPage,
    this.formInteractionsRows
  ).subscribe({
    next: (response) => {
      this.formInteractions = response.forms || [];
      this.formInteractionsTotal = response.total || 0;
      // ...
    }
  });
}
```

**Pagination Handler:**
```typescript
onFormInteractionsChange(event: any): void {
  const page = Math.floor(event.first / event.rows) + 1;
  this.formInteractionsPage = page;
  this.formInteractionsRows = event.rows;
  
  this.analyticsAPIService.getFormInteractions(
    this.currentDateRange || undefined,
    page,
    event.rows
  ).subscribe({ /* ... */ });
}
```

---

## How to Track Forms in Your Application

To track forms in your application, you need to send the appropriate events to the analytics backend:

### Example: React/Angular Form Tracking

```typescript
class FormTracker {
  private formStartTime: number | null = null;
  
  // Call when user starts interacting with form
  trackFormStart(formId: string) {
    this.formStartTime = Date.now();
    
    window.pulzivoAnalytics?.track('form_start', {
      formId: formId,
      page: window.location.pathname
    });
  }
  
  // Call on successful form submission
  trackFormSubmit(formId: string, success: boolean = true) {
    window.pulzivoAnalytics?.track('form_submit', {
      formId: formId,
      page: window.location.pathname,
      success: success,
      timeToComplete: this.formStartTime 
        ? (Date.now() - this.formStartTime) / 1000 
        : null
    });
    
    this.formStartTime = null;
  }
  
  // Call when user leaves form without submitting
  trackFormAbandon(formId: string, fieldsCompleted: number, totalFields: number) {
    window.pulzivoAnalytics?.track('form_abandon', {
      formId: formId,
      page: window.location.pathname,
      fieldsCompleted: fieldsCompleted,
      totalFields: totalFields
    });
    
    this.formStartTime = null;
  }
  
  // Call on field interactions (focus, blur, input)
  trackFieldInteraction(formId: string, fieldName: string, action: 'focus' | 'blur' | 'input') {
    window.pulzivoAnalytics?.track('form_field_interaction', {
      formId: formId,
      fieldName: fieldName,
      action: action
    });
  }
}

// Usage Example
const tracker = new FormTracker();

// On form mount/load
document.querySelector('form').addEventListener('focus', () => {
  tracker.trackFormStart('sign-in-form');
}, { once: true, capture: true });

// On form submit
document.querySelector('form').addEventListener('submit', (e) => {
  e.preventDefault();
  // ... your form submission logic
  tracker.trackFormSubmit('sign-in-form', true);
});

// On page unload (abandon detection)
window.addEventListener('beforeunload', () => {
  if (formStartTime !== null) {
    const completed = document.querySelectorAll('input:valid').length;
    const total = document.querySelectorAll('input').length;
    tracker.trackFormAbandon('sign-in-form', completed, total);
  }
});

// On field interactions
document.querySelectorAll('input, select, textarea').forEach(field => {
  field.addEventListener('focus', () => {
    tracker.trackFieldInteraction('sign-in-form', field.name, 'focus');
  });
  
  field.addEventListener('blur', () => {
    tracker.trackFieldInteraction('sign-in-form', field.name, 'blur');
  });
});
```

---

## UI Display

The overview dashboard displays form interactions in a table format:

| Form ID | Submissions | Abandons | Avg. Time | Conversion | Interactions |
|---------|-------------|----------|-----------|------------|--------------|
| sign-in-form | 145 | 32 | 18.5s | **81.9%** 🟢 | 890 |
| checkout-form | 67 | 89 | 78.3s | **42.9%** 🟠 | 2134 |
| contact-form | 234 | 45 | 32.8s | **83.9%** 🟢 | 1567 |

**Color Coding:**
- 🟢 Green: Conversion rate > 70%
- 🟠 Orange: Conversion rate 40-70%
- 🔴 Red: Conversion rate < 40%

---

## Testing

### Test the Endpoint:

```bash
# Get form interactions
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3004/analytics/form-interactions?apiKey=YOUR_API_KEY&limit=10"

# With date range
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3004/analytics/form-interactions?apiKey=YOUR_API_KEY&limit=10&startDate=2026-03-01T00:00:00.000Z&endDate=2026-03-11T23:59:59.999Z"

# With pagination
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3004/analytics/form-interactions?apiKey=YOUR_API_KEY&page=2&limit=5"
```

### Send Test Events:

```bash
# Form start event
curl -X POST http://localhost:3004/analytics/events \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "YOUR_API_KEY",
    "event_name": "form_start",
    "data": {
      "formId": "test-form",
      "page": "/test"
    }
  }'

# Form submit event
curl -X POST http://localhost:3004/analytics/events \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "YOUR_API_KEY",
    "event_name": "form_submit",
    "data": {
      "formId": "test-form",
      "page": "/test",
      "success": true
    }
  }'
```

---

## Performance Considerations

### Indexing Recommendations

For optimal query performance, add these indexes:

```javascript
// MongoDB indexes
db.collection('YOUR_API_KEY_events').createIndex({ 
  event_name: 1, 
  'data.formId': 1, 
  timestamp: -1 
});

db.collection('YOUR_API_KEY_events').createIndex({ 
  user_id: 1, 
  timestamp: 1 
});
```

### Query Optimization

- Groups events by formId first (reduces data size)
- Processes calculations in memory (faster than multiple DB queries)
- Uses date filters early in pipeline (reduces documents processed)
- Limits results before calculating expensive metrics

---

## Files Modified

### Backend
1. **`/controllers/analyticsController.js`**
   - Added `getFormInteractions()` function (95 lines)
   - Exported in module.exports

2. **`/routes/analytics.js`**
   - Added route: `GET /form-interactions`

### Frontend
1. **`src/app/services/analytics-api.service.ts`**
   - Added `getFormInteractions()` method

2. **`src/app/pages/dashboard/overview/overview.ts`**
   - Replaced mock data with real API call in `loadFormInteractionsWithDelay()`
   - Updated `onFormInteractionsChange()` to call API on pagination

---

## Server Status

✅ Backend server restarted successfully
✅ Running on port 3004
✅ Form interactions endpoint active

---

## Summary

**Before:**
- ❌ Mock data with hardcoded forms
- ❌ No real form tracking

**After:**
- ✅ Real-time form interaction tracking
- ✅ Tracks 4 event types (start, submit, abandon, field_interaction)
- ✅ Calculates 6 key metrics
- ✅ Supports date range filtering
- ✅ Paginated results
- ✅ Per-user session tracking
- ✅ Production-ready with error handling

**Form Analytics is now LIVE! 🎉**
