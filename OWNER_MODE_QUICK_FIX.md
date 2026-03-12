# Owner Mode Quick Fix - Mobile Tracking Issue

## 🎯 TL;DR

**If you're still being tracked after login on mobile, your user's `role` is likely not set to `'owner'` in the database.**

---

## ✅ Quick Fix (5 minutes)

### Step 1: Check Your User Role
```bash
# Connect to your MongoDB
mongosh

# Use your database
use pulzivo_analytics  # Or your database name

# Find your user
db.users.findOne({ email: "your@email.com" })

# Look for:
{
  _id: ObjectId("..."),
  email: "your@email.com",
  firstname: "Your",
  lastname: "Name",
  role: "owner"  // ← THIS MUST BE "owner" (lowercase)
}
```

### Step 2: Set Owner Role (if missing)
```javascript
// In mongosh:
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "owner" } }
)

// Result should show:
// { acknowledged: true, modifiedCount: 1 }
```

### Step 3: Log Out & Log In
1. Log out from your mobile browser
2. Log in again
3. Open browser console (see below for mobile debugging)
4. You should see:
   ```
   🛡️ [OwnerMode] Activating owner mode...
   ✅ [OwnerMode] SDK setOwner() called
   ✅ [OwnerMode] localStorage flag set
   🔍 [OwnerMode] Verification:
     - localStorage flag: ✅ true
     - SDK loaded: ✅ yes
     - Tracking suppressed: ✅ yes
   ```

### Step 4: Verify It Works
1. You should see a green badge at the bottom-right: **🛡️ Owner Mode Active**
2. Tap any element on the page
3. Console should show: `[Analytics] Owner mode active - event suppressed: <event_name>`
4. Check your backend/dashboard - no new events from your device

---

## 📱 Mobile Browser Console Access

### **iOS Safari:**
1. iPhone Settings → Safari → Advanced → Web Inspector → **ON**
2. Connect iPhone to Mac via USB
3. Open Safari on Mac → **Develop** menu → Select your iPhone → Select your website
4. You'll see the console for your mobile browser

### **Android Chrome:**
1. Enable Developer Options on Android
2. Connect to computer via USB
3. Chrome on desktop → `chrome://inspect`
4. Click "Inspect" next to your device
5. You'll see the console for mobile Chrome

---

## 🔍 Debugging Checklist

Run these checks in order:

1. **Database Role:**
   ```javascript
   // In MongoDB
   db.users.findOne({ email: 'your@email.com' }, { email: 1, role: 1 })
   
   // MUST show: { email: "...", role: "owner" }
   ```

2. **localStorage Flag:**
   ```javascript
   // In browser console (mobile or desktop)
   localStorage.getItem('pulz_is_owner')
   
   // MUST return: "true"
   ```

3. **SDK Loaded:**
   ```javascript
   // In browser console
   typeof window.PulzivoAnalytics
   
   // MUST return: "object"
   ```

4. **Owner Mode Active:**
   ```javascript
   // In browser console
   window.PulzivoAnalytics.isOwner
   
   // MUST return: true
   ```

5. **Visual Indicator:**
   - Look for green badge at bottom-right: **🛡️ Owner Mode Active**
   - If badge is NOT showing, owner mode is NOT active

6. **Test Event:**
   ```javascript
   // Tap any element or run in console:
   window.PulzivoAnalytics.track('test_event')
   
   // Console should show:
   // [Analytics] Owner mode active - event suppressed: test_event
   ```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Role is not owner"
**Console shows:** `🔍 [OwnerMode] Role is not owner: undefined`

**Solution:** Your database role is missing or not "owner"
```javascript
// Fix in MongoDB
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "owner" } }
)
```

### Issue 2: "PulzivoAnalytics SDK not loaded yet"
**Console shows:** `⚠️ [OwnerMode] PulzivoAnalytics SDK not loaded yet`

**Solution:** SDK script is not in your HTML or loads after auth check
```html
<!-- Make sure this is in src/index.html before </body> -->
<script src="/pulzivo-analytics.min.js" data-api-key="your-key"></script>
```

### Issue 3: "Failed to set localStorage"
**Console shows:** `❌ [OwnerMode] Failed to set localStorage: ...`

**Solution:** Mobile browser is in Private/Incognito mode
- Disable Private Browsing
- Use regular browsing mode
- Check browser settings

### Issue 4: "localStorage flag: ❌ false"
**Console shows verification failed after 500ms**

**Solution:** Manually set the flag and refresh
```javascript
// In browser console
localStorage.setItem('pulz_is_owner', 'true');
location.reload();
```

### Issue 5: No Green Badge Showing
**Owner mode badge not visible at bottom-right**

**Solution:** Owner mode is NOT active. Check steps 1-4 in debugging checklist above.

---

## 🎨 Visual Indicator

When owner mode is active, you'll see a **green badge** at the bottom-right corner of every page:

```
┌─────────────────────────────┐
│                             │
│                             │
│                             │
│                             │
│               ┌──────────────┐
│               │ 🛡️ Owner    │
│               │ Mode Active │
│               └──────────────┘
└─────────────────────────────┘
```

**If you DON'T see this badge, tracking is NOT suppressed!**

---

## 🧪 Manual Testing

### Test 1: Page View
```javascript
// 1. Open any page
// 2. Check console
// Expected: [Analytics] Owner mode active - event suppressed: page_view
```

### Test 2: Button Click
```javascript
// 1. Click any button
// 2. Check console
// Expected: [Analytics] Owner mode active - event suppressed: button_click
```

### Test 3: Tooltip
```javascript
// 1. Hover/tap any tooltip
// 2. Check console
// Expected: [Analytics] Owner mode active - event suppressed: tooltip_view
```

### Test 4: Form Interaction
```javascript
// 1. Type in any form field
// 2. Check console
// Expected: [Analytics] Owner mode active - event suppressed: form_field_focus
```

### Test 5: Backend Verification
```javascript
// 1. Check your backend logs or dashboard
// 2. Should show NO new events from your device
// 3. "Live visitors" should be 0 when you're the only one on the site
```

---

## 💡 Best Practice

**For your main account (the one you use to manage the site):**

1. Set `role: 'owner'` in database
2. Log in once on each device/browser you use
3. Verify green badge shows on each device
4. Never clear browser data (or you'll need to log in again)

**For test accounts:**
- Use regular user accounts (no `role: 'owner'`)
- These WILL be tracked (as expected)
- Use for testing analytics features

---

## 📊 Production Checklist

Before launch, verify owner mode on:

- ✅ Desktop Chrome
- ✅ Desktop Safari
- ✅ Desktop Firefox
- ✅ Mobile Safari (iPhone)
- ✅ Mobile Chrome (Android)
- ✅ Tablet Safari (iPad)
- ✅ Tablet Chrome (Android tablet)

On EACH device:
1. Log in with owner account
2. Verify green badge shows
3. Tap/click elements
4. Confirm "event suppressed" in console
5. Check backend - no events from that device

---

## 🔐 Security Note

**Owner mode is browser-based, not account-based:**

- Setting `role: 'owner'` in database doesn't automatically prevent tracking
- You must **log in** on each device/browser to activate owner mode
- `localStorage.setItem('pulz_is_owner', 'true')` is what prevents tracking
- This flag persists until you clear browser data

**To stop being tracked on a specific device:**
1. Log in with your owner account on that device
2. Verify green badge appears
3. Done - that device will never track you (unless you clear data)

**To start being tracked again (for testing):**
```javascript
// Run in console:
localStorage.removeItem('pulz_is_owner');
window.PulzivoAnalytics.enableTracking();
location.reload();
```

---

## 🎯 Success Criteria

**You've successfully fixed the issue when ALL of these are true:**

1. ✅ Database shows `role: "owner"` for your account
2. ✅ Console shows `🛡️ [OwnerMode] Activating owner mode...`
3. ✅ Console shows `✅ [OwnerMode] Verification: ... Tracking suppressed: ✅ yes`
4. ✅ Green badge **🛡️ Owner Mode Active** visible at bottom-right
5. ✅ Tapping/clicking shows `event suppressed` in console
6. ✅ Backend logs show NO events from your device
7. ✅ Dashboard shows 0 live visitors when you're alone on site
8. ✅ After page refresh, owner mode STILL active (badge still shows)

---

## 📞 Still Not Working?

If you've tried everything and it's still not working:

1. **Export debug logs:**
   ```javascript
   // In console
   console.log('=== DEBUG INFO ===');
   console.log('Role:', JSON.parse(localStorage.getItem('userData') || '{}').role);
   console.log('Owner flag:', localStorage.getItem('pulz_is_owner'));
   console.log('SDK loaded:', typeof window.PulzivoAnalytics);
   console.log('User agent:', navigator.userAgent);
   ```

2. **Check browser compatibility:**
   - Some browsers block localStorage
   - Private/Incognito mode won't persist
   - Content blockers may interfere

3. **Try manual override:**
   ```javascript
   // Force disable all tracking
   window.PulzivoAnalytics.disableTracking();
   localStorage.setItem('pulz_is_owner', 'true');
   location.reload();
   ```

4. **Verify backend integration:**
   - Make sure backend signup sets `role: 'owner'` for your account
   - Check if backend is returning user role in signin response

---

**That's it! The issue is almost always the database role not being set to 'owner'. Fix that and you're good to go! 🚀**
