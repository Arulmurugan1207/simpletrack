# Owner Mode Troubleshooting - Mobile Tracking Issue

## Problem
When you log in on mobile, it's still tracking your events instead of suppressing them (owner mode not activating).

---

## How Owner Mode Works

### 1. **What is Owner Mode?**
Owner mode tells the analytics SDK "Don't track this browser/device - it's the site owner." This prevents you from polluting your own analytics data.

### 2. **How It's Activated:**
When you sign in with a user that has `role: 'owner'`, the system:
1. Checks `user.role === 'owner'`
2. Calls `PulzivoAnalytics.setOwner(true, true)` (with persist=true)
3. Sets `localStorage.setItem('pulz_is_owner', 'true')`
4. All future tracking is suppressed

---

## Why It Might Not Be Working

### ❌ **Issue 1: Your User Role is Not 'owner'**

**Check your database:**
```javascript
// MongoDB
db.users.findOne({ email: 'your@email.com' })

// Should show:
{
  email: "your@email.com",
  role: "owner"  // ← Must be exactly "owner" (lowercase)
}
```

**If role is missing or different:**
```javascript
// Fix in MongoDB
db.users.updateOne(
  { email: 'your@email.com' },
  { $set: { role: 'owner' } }
)
```

**Or fix in backend when creating user:**
```javascript
// backend signup
const newUser = new User({
  email: req.body.email,
  password: hashedPassword,
  role: 'owner'  // ← Add this for your account
});
```

---

### ❌ **Issue 2: Mobile Browser Blocking localStorage**

**Safari Private Mode or Incognito blocks localStorage**

**Check in mobile browser console:**
```javascript
// Test if localStorage works
try {
  localStorage.setItem('test', '123');
  console.log('localStorage WORKS:', localStorage.getItem('test'));
  localStorage.removeItem('test');
} catch(e) {
  console.error('localStorage BLOCKED:', e);
}
```

**If blocked:**
- Disable Private Browsing mode
- Use regular browsing mode
- Check browser settings

---

### ❌ **Issue 3: SDK Loads Before Auth Check**

**Timing issue:** SDK starts tracking before `applyOwnerTracking()` is called.

**Current flow:**
```
1. Page loads
2. SDK initializes and starts tracking ❌
3. Auth check happens
4. applyOwnerTracking() called (too late!)
```

**Fix:** SDK should wait for auth check before starting auto-tracking.

---

## 🔧 Fixes

### **Fix 1: Check Browser Console (Mobile)**

On your mobile device:

**iOS Safari:**
1. Settings → Safari → Advanced → Web Inspector → ON
2. Connect iPhone to Mac
3. Safari on Mac → Develop → [Your iPhone] → [Your Site]
4. Check console for:
   ```
   [Analytics] Owner mode: ON (tracking suppressed)
   ```

**Android Chrome:**
1. Chrome → Settings → Developer Options → Enable
2. Connect to computer
3. Chrome desktop → `chrome://inspect`
4. Check console

---

### **Fix 2: Manual Override (Quick Test)**

**On mobile browser, open console and run:**
```javascript
// Disable tracking immediately
PulzivoAnalytics.disableTracking();

// Verify
console.log(localStorage.getItem('pulz_is_owner')); // Should be 'true'

// Refresh page - tracking should be suppressed now
```

---

### **Fix 3: Debug Your User Role**

Add this to your sign-in success handler:

```typescript
// src/app/components/modals/sign-in/sign-in.ts
this.authService.signin(credentials).subscribe({
  next: (response) => {
    // ADD THIS DEBUG
    console.log('🔍 User role:', response.user.role);
    console.log('🔍 Is owner?', response.user.role === 'owner');
    console.log('🔍 pulz_is_owner:', localStorage.getItem('pulz_is_owner'));
    console.log('🔍 PulzivoAnalytics:', (window as any).PulzivoAnalytics);
    
    this.authService.storeUserData(response);
    this.hide();
    this.router.navigate(['/dashboard']);
  }
});
```

---

### **Fix 4: Force Owner Mode on App Init**

Update `app.ts` to ensure owner mode is applied even after page refresh:

```typescript
// src/app/app.ts
ngOnInit() {
  const userData = this.authService.getUserData();
  
  // Apply owner tracking
  this.authService.applyOwnerTracking(userData?.role);
  
  // ADD THIS: Double-check it worked
  if (userData?.role === 'owner') {
    const isOwnerSet = localStorage.getItem('pulz_is_owner') === 'true';
    console.log('🛡️ Owner mode active:', isOwnerSet);
    
    if (!isOwnerSet) {
      console.warn('⚠️ Owner mode failed to activate! Forcing...');
      (window as any).PulzivoAnalytics?.setOwner(true, true);
    }
  }
}
```

---

### **Fix 5: Add Owner Badge in UI**

Let users see if owner mode is active:

```typescript
// src/app/layout/header/header.ts
isOwnerModeActive(): boolean {
  try {
    return localStorage.getItem('pulz_is_owner') === 'true';
  } catch {
    return false;
  }
}
```

```html
<!-- src/app/layout/header/header.html -->
@if (isOwnerModeActive()) {
  <div class="owner-badge" style="
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
  ">
    🛡️ Owner Mode Active
  </div>
}
```

---

## 🧪 Testing Checklist

### **Step 1: Verify Database**
```javascript
// In MongoDB
db.users.find({ email: 'your@email.com' }, { email: 1, role: 1 })

// Expected:
{ email: "your@email.com", role: "owner" }
```

### **Step 2: Test on Desktop First**
1. Open your site in desktop browser
2. Sign in
3. Open console: `localStorage.getItem('pulz_is_owner')`
4. Should return `"true"`
5. Hover over dashboard elements
6. Console should show: `[Analytics] Owner mode active - event suppressed: tooltip_view`

### **Step 3: Test on Mobile**
1. Open mobile browser
2. Sign in
3. Open remote debugging console (see Fix 1)
4. Check `localStorage.getItem('pulz_is_owner')`
5. Should return `"true"`
6. Tap elements - no tracking should happen

### **Step 4: Verify Backend**
Check your backend logs - you should see NO events from your mobile device after signing in.

---

## 📱 Mobile-Specific Issues

### **Safari Intelligent Tracking Prevention (ITP)**
Safari may block cross-site tracking and limit localStorage.

**Solution:**
- Use your site in normal (non-private) mode
- Don't use content blockers
- Check Settings → Safari → "Prevent Cross-Site Tracking" (can interfere)

### **Chrome Incognito Mode**
Incognito mode may not persist localStorage between sessions.

**Solution:**
- Use normal browsing mode
- Or manually run `PulzivoAnalytics.disableTracking()` in each incognito session

---

## 🎯 Expected Behavior

### **When Owner Mode is Active:**

**Desktop:**
```javascript
// Hover over tooltip
[Analytics] Owner mode active - event suppressed: tooltip_view

// Click button
[Analytics] Owner mode active - event suppressed: button_click

// Page view
[Analytics] Owner mode active - event suppressed: page_view
```

**Mobile:**
```javascript
// Tap tooltip
[Analytics] Owner mode active - event suppressed: tooltip_view

// Tap button
[Analytics] Owner mode active - event suppressed: button_click
```

**Backend logs:**
- No events from your IP/device
- Your dashboard shows "0 live visitors" when you're the only one

---

## 🚨 Quick Fix Commands

### **If Nothing Works:**

**Option 1: Force Disable Tracking (Mobile Console)**
```javascript
// Run this once on mobile
localStorage.setItem('pulz_is_owner', 'true');
location.reload();
```

**Option 2: Set in Backend**
```javascript
// MongoDB - Update your user
db.users.updateOne(
  { email: 'your@email.com' },
  { $set: { role: 'owner' } }
)
```

**Option 3: Add Manual Override**
```typescript
// In app.ts ngOnInit()
if (window.location.hostname === 'localhost' || 
    window.location.hostname === 'your-domain.com') {
  (window as any).PulzivoAnalytics?.setOwner(true, true);
}
```

---

## 🔍 Debug Checklist

Run these checks in order:

1. **Database:** `db.users.findOne({ email: 'yours' })` → role should be "owner"
2. **Sign in:** Watch console for role log
3. **localStorage:** `localStorage.getItem('pulz_is_owner')` → should be "true"
4. **SDK:** `window.PulzivoAnalytics` → should be defined
5. **Events:** Tap/click something → console should show "event suppressed"
6. **Backend:** Check logs → no events from you
7. **Dashboard:** Live visitors should be 0 when only you're on site

---

## 💡 Recommended Solution

**Add this to your auth.service.ts for guaranteed owner mode:**

```typescript
applyOwnerTracking(role: string | undefined): void {
  if (role !== 'owner') return;
  
  const win = window as any;
  
  // Method 1: Via SDK (preferred)
  if (win.PulzivoAnalytics?.setOwner) {
    win.PulzivoAnalytics.setOwner(true, true);
    console.log('✅ Owner mode activated via SDK');
  }
  
  // Method 2: Direct localStorage (fallback)
  try {
    localStorage.setItem('pulz_is_owner', 'true');
    console.log('✅ Owner flag set in localStorage');
  } catch (e) {
    console.error('❌ Failed to set owner flag:', e);
  }
  
  // Method 3: Verify it worked
  setTimeout(() => {
    const isSet = localStorage.getItem('pulz_is_owner') === 'true';
    console.log('🔍 Owner mode verification:', isSet ? 'SUCCESS' : 'FAILED');
    if (!isSet) {
      alert('Warning: Owner mode failed to activate. Your activity may be tracked.');
    }
  }, 1000);
}
```

---

## ✅ Success Criteria

**You'll know it's working when:**

1. ✅ Sign in on mobile
2. ✅ Console shows: `[Analytics] Owner mode: ON (tracking suppressed)`
3. ✅ localStorage has: `pulz_is_owner: "true"`
4. ✅ Tapping elements shows: `event suppressed` in console
5. ✅ Backend logs show NO events from your device
6. ✅ Dashboard shows 0 live visitors when you're alone
7. ✅ After page refresh, owner mode still active

---

## 🎯 TL;DR - Quick Fix

**Most likely issue:** Your user's `role` is not set to `'owner'` in the database.

**Quick fix:**
```bash
# 1. Check database
mongosh
use your_database
db.users.find({ email: 'your@email.com' })

# 2. If role is missing, set it
db.users.updateOne(
  { email: 'your@email.com' },
  { $set: { role: 'owner' } }
)

# 3. Log out and log back in
# 4. Check: localStorage.getItem('pulz_is_owner') should be 'true'
```

**That's it!** 🎉
