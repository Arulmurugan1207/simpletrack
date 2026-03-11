# Sign-In/Sign-Up Event Tracking Implementation

## Overview
User authentication events (sign-in, sign-up, sign-out) are now automatically tracked and displayed in the dashboard overview's **Custom Events** section.

## What's Been Implemented

### 1. **Sign-In Event Tracking** (`sign-in.ts`)
When users successfully sign in:
```typescript
PulzivoAnalytics('event', 'user_sign_in', {
  method: 'email',
  remember_me: true/false,
  timestamp: new Date().toISOString()
});
```

### 2. **Sign-In Failed Event Tracking** (`sign-in.ts`)
When sign-in attempts fail:
```typescript
PulzivoAnalytics('event', 'user_sign_in_failed', {
  method: 'email',
  error_type: 'invalid_credentials' | 'server_error',
  timestamp: new Date().toISOString()
});
```

### 3. **Sign-Up Event Tracking** (`sign-up.ts`)
When users successfully sign up:
```typescript
PulzivoAnalytics('event', 'user_sign_up', {
  method: 'email',
  has_name: true/false,
  timestamp: new Date().toISOString()
});
```

## Dashboard Display

### Custom Events Section
All authentication events are displayed in the **Dashboard Overview** > **Custom Events** table with:
- ✨ **Purple highlight** background for auth events
- 🎨 **Custom icons**:
  - `user_sign_in` → Sign-in icon (pi-sign-in)
  - `user_sign_up` → User plus icon (pi-user-plus)
  - `user_sign_in_failed` → Error icon (pi-times-circle)
  - `user_sign_out` → Sign-out icon (pi-sign-out)
- 📊 **Event count** - Total number of times the event occurred
- ⏰ **Last seen** - Time ago when the event last fired

### Visual Features
- Authentication events have a **light purple background** (#faf5ff)
- Hover state with **darker purple** (#f3e8ff)
- Event names are **bold and purple** (#8b5cf6)
- Icons displayed next to event names

## How to Test

1. **Start the application** (already running on http://localhost:4200/)
2. **Try signing in** - Click "Sign In" in the header
3. **Enter credentials** and submit
4. **Go to Dashboard** → Overview
5. **Scroll down** to the **Custom Events** section
6. You should see:
   - `user_sign_in` event with count and timestamp
   - Purple highlight on the row
   - Sign-in icon next to the event name

## Supported Authentication Events

The system recognizes and highlights these event names:
- `user_sign_in` / `user_login`
- `user_sign_up` / `user_register`
- `user_sign_in_failed` / `user_login_failed`
- `user_sign_out` / `user_logout`

## Additional Custom Events

You can track any custom event using the Pulzivo Analytics SDK:

```javascript
// Track custom event
PulzivoAnalytics('event', 'button_clicked', {
  button_id: 'pricing-cta',
  location: 'homepage'
});

// Track conversion
PulzivoAnalytics('event', 'purchase_completed', {
  amount: 99.99,
  currency: 'USD',
  plan: 'pro'
});
```

## Files Modified

1. `/src/app/components/modals/sign-in/sign-in.ts` - Added sign-in event tracking
2. `/src/app/components/modals/sign-up/sign-up.ts` - Added sign-up event tracking
3. `/src/app/pages/dashboard/overview/overview.ts` - Added `isAuthEvent()` helper and updated `getEventIcon()`
4. `/src/app/pages/dashboard/overview/overview.html` - Added visual highlighting for auth events
5. `/src/app/pages/dashboard/overview/overview.scss` - Added purple styling for auth events

## Benefits

✅ **Security Monitoring** - Track failed login attempts  
✅ **User Engagement** - See how many users sign up/in  
✅ **Analytics Insights** - Understand authentication patterns  
✅ **Visual Clarity** - Easy to spot auth events in the dashboard  
✅ **Extensible** - Easy to add more authentication events (password reset, email verification, etc.)

## Next Steps

Consider adding tracking for:
- Password reset requests
- Email verification
- Account deletions
- Profile updates
- Session timeouts
- Two-factor authentication events
