# Form Interaction Tracking Guide

## Overview
Form interaction tracking allows you to monitor how users interact with forms on your website, including submissions, abandonments, field interactions, and completion times.

## ✅ What's Been Implemented

### 1. **Dashboard Form Interactions Section**
A new "Form Interactions" table has been added to the Dashboard Overview that displays:
- **Form ID** - Unique identifier for each form
- **Submissions** - Total successful form submissions (green badge)
- **Abandons** - Number of times users started but didn't complete the form (orange badge)
- **Conversion Rate** - Percentage of users who complete the form
  - 🟢 Green (≥70%) = Good
  - 🟠 Orange (50-69%) = OK  
  - 🔴 Red (<50%) = Poor
- **Average Time** - Average time to complete the form

### 2. **Analytics SDK Form Tracking**
The Pulzivo Analytics SDK (`pulzivo-analytics.js`) includes built-in form tracking for:
- Form focus events (when users start interacting with form fields)
- Form submissions
- Form abandonment (when users leave without submitting)
- Field-level interactions
- Time to complete

## 🎯 How to Enable Form Tracking

### Step 1: Add Form ID to Your HTML Forms

Add a unique `id` attribute to your form element:

```html
<form id="sign-in-form" (ngSubmit)="onSubmit()">
  <input type="email" name="email" placeholder="Email" />
  <input type="password" name="password" placeholder="Password" />
  <button type="submit">Sign In</button>
</form>
```

### Step 2: Add Name Attributes to Form Fields

Ensure all form fields have `name` or `id` attributes:

```html
<input type="text" name="fullName" placeholder="Full Name" />
<input type="email" name="email" placeholder="Email" />
<input type="tel" name="phone" placeholder="Phone" />
<textarea name="message" placeholder="Message"></textarea>
```

### Step 3: Enable Form Tracking in Analytics Config

Form tracking is available for **Pro and Enterprise** plans by default. To enable it:

```javascript
PulzivoAnalytics.init({
  apiKey: 'your-api-key',
  plan: 'pro' // or 'enterprise'
});
```

Or in the script tag:

```html
<script
  src="https://pulzivo.com/pulzivo-analytics.min.js"
  data-api-key="your-api-key"
  data-plan="pro">
</script>
```

## 📊 Events Tracked Automatically

### 1. **Form Start** (`form_start`)
Triggered when a user focuses on the first field in a form:
```javascript
{
  event_name: 'form_start',
  form_id: 'sign-in-form',
  timestamp: '2026-03-11T10:30:00Z'
}
```

### 2. **Form Submit** (`form_submit`)
Triggered when a form is successfully submitted:
```javascript
{
  event_name: 'form_submit',
  form_id: 'sign-in-form',
  fields_interacted: ['email', 'password', 'rememberMe'],
  time_to_complete: 18500, // milliseconds
  form_action: '/api/auth/signin'
}
```

### 3. **Form Abandon** (`form_abandon`)
Triggered when a user leaves the page without submitting:
```javascript
{
  event_name: 'form_abandon',
  form_id: 'sign-in-form',
  fields_interacted: ['email'],
  time_spent: 5200 // milliseconds
}
```

## 🔧 Manual Form Event Tracking

You can also manually track form events:

### Track Form Start
```typescript
onFormStart() {
  if (typeof (window as any).PulzivoAnalytics !== 'undefined') {
    (window as any).PulzivoAnalytics('event', 'form_start', {
      form_id: 'contact-form',
      form_type: 'contact',
      location: window.location.pathname
    });
  }
}
```

### Track Form Field Validation Errors
```typescript
onValidationError(fieldName: string, errorType: string) {
  if (typeof (window as any).PulzivoAnalytics !== 'undefined') {
    (window as any).PulzivoAnalytics('event', 'form_validation_error', {
      form_id: 'sign-up-form',
      field_name: fieldName,
      error_type: errorType
    });
  }
}
```

### Track Form Step Completion (Multi-step Forms)
```typescript
onStepComplete(stepNumber: number) {
  if (typeof (window as any).PulzivoAnalytics !== 'undefined') {
    (window as any).PulzivoAnalytics('event', 'form_step_complete', {
      form_id: 'checkout-form',
      step: stepNumber,
      total_steps: 3
    });
  }
}
```

## 📈 Best Practices

### 1. **Use Descriptive Form IDs**
```html
<!-- ❌ Bad -->
<form id="form1">

<!-- ✅ Good -->
<form id="checkout-form">
<form id="newsletter-subscription">
<form id="contact-support-form">
```

### 2. **Track Important Interactions**
```typescript
// Track when user switches between sign-in and sign-up
switchToSignUp() {
  PulzivoAnalytics('event', 'form_switch', {
    from: 'sign-in',
    to: 'sign-up'
  });
}

// Track password visibility toggle
togglePasswordVisibility() {
  PulzivoAnalytics('event', 'form_password_toggle', {
    form_id: 'sign-in-form',
    action: this.showPassword ? 'hide' : 'show'
  });
}
```

### 3. **Monitor Form Errors**
```typescript
onSubmitError(error: any) {
  PulzivoAnalytics('event', 'form_submit_error', {
    form_id: 'payment-form',
    error_type: error.type,
    error_message: error.message
  });
}
```

## 🎨 Dashboard Visualization

The form interactions data is displayed in the **Dashboard Overview** with:

- **Color-coded metrics** for quick status identification
- **Sortable columns** to analyze form performance
- **Pagination** for viewing all tracked forms
- **Real-time updates** as new data comes in

### Example Output:

| Form ID | Submissions | Abandons | Conv. Rate | Avg Time |
|---------|-------------|----------|------------|----------|
| sign-in-form | 145 | 32 | 81.9% ✅ | 18.5s |
| sign-up-form | 89 | 67 | 57.1% ⚠️ | 45.2s |
| contact-form | 234 | 45 | 83.9% ✅ | 32.8s |
| checkout-form | 67 | 89 | 42.9% ❌ | 78.3s |

## 🔍 Analyzing Form Performance

### High Abandonment Rate?
- Form might be too long
- Required fields causing friction
- Validation errors confusing users
- Mobile experience issues

### Long Completion Time?
- Too many fields
- Unclear instructions
- Technical issues (slow loading)
- Complex validation requirements

### Low Conversion Rate?
- Missing trust signals
- Unclear value proposition
- Technical errors preventing submission
- Poor mobile optimization

## 🚀 Advanced Use Cases

### Track Autofill Usage
```typescript
detectAutofill(fieldName: string) {
  PulzivoAnalytics('event', 'form_autofill_used', {
    form_id: 'sign-in-form',
    field: fieldName
  });
}
```

### Track Password Strength Selection
```typescript
onPasswordStrengthChange(strength: string) {
  PulzivoAnalytics('event', 'password_strength_selected', {
    form_id: 'sign-up-form',
    strength: strength // 'weak', 'medium', 'strong'
  });
}
```

### Track Social Login Choices
```typescript
onSocialLogin(provider: string) {
  PulzivoAnalytics('event', 'social_login_clicked', {
    provider: provider, // 'google', 'github', 'facebook'
    context: 'sign-up-form'
  });
}
```

## 📝 Implementation Checklist

- [x] Form interactions section added to Dashboard Overview
- [x] Mock data displaying in the table
- [x] Color-coded conversion rates
- [x] Submission and abandonment metrics
- [x] Average completion time tracking
- [x] CSS styling for form metrics
- [ ] Connect to real API endpoint
- [ ] Add form IDs to all forms in the application
- [ ] Enable form tracking in production
- [ ] Set up alerts for high abandonment rates

## 🎯 Next Steps

1. **Add Form IDs to Your Forms**
   - Sign-in form: ✅ `id="sign-in-form"` (already done)
   - Sign-up form: Add `<form>` wrapper with ID
   - Contact form: Add form element with ID
   - Other forms: Review and add IDs

2. **Test Form Tracking**
   - Fill out forms and verify events are captured
   - Check dashboard for form interaction data
   - Monitor console for tracking events (debug mode)

3. **API Integration**
   - Create backend endpoint: `GET /api/analytics/form-interactions`
   - Update `AnalyticsAPIService` with `getFormInteractions()` method
   - Replace mock data with real API calls

4. **Optimization**
   - Analyze which forms have high abandonment
   - Simplify forms with poor conversion rates
   - A/B test form improvements

## 📚 Related Documentation

- [SIGN_IN_TRACKING.md](./SIGN_IN_TRACKING.md) - Authentication event tracking
- [public/pulzivo-analytics.js](./public/pulzivo-analytics.js) - Analytics SDK source code
- [Dashboard Overview](./src/app/pages/dashboard/overview/) - Dashboard component

## 🆘 Troubleshooting

### Form events not tracking?
1. Check if form has an `id` attribute
2. Verify fields have `name` or `id` attributes
3. Ensure analytics SDK is initialized
4. Check plan includes form tracking feature
5. Open browser console and look for tracking logs (debug mode)

### Completion time seems wrong?
- Time is measured from first field focus to form submission
- Users navigating away and returning will have longer times
- Consider time limits for realistic completion times

### Missing form interactions in dashboard?
- Data may take a few minutes to appear
- Check API key is correctly configured
- Verify date range includes recent submissions
- Check browser console for errors
