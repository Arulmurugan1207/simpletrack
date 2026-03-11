# Manual Form Tracking Guide

## For Pro & Free Plan Users

Enterprise plan users get **automatic form tracking** via the Pulzivo Analytics SDK. If you're on a Pro or Free plan, you can manually implement form tracking to see data in your Form Interactions dashboard.

---

## Overview

To track forms manually, you need to send 4 types of events:

1. **`form_start`** - When user begins filling the form
2. **`form_field_interaction`** - When user interacts with form fields
3. **`form_submit`** - When user submits the form
4. **`form_abandon`** - When user leaves without submitting

---

## Implementation Examples

### Example 1: Vanilla JavaScript / HTML

```html
<!DOCTYPE html>
<html>
<head>
  <title>Contact Form</title>
  <!-- Load Pulzivo Analytics SDK -->
  <script
    src="https://your-cdn.com/pulzivo-analytics.min.js"
    data-api-key="YOUR_API_KEY">
  </script>
</head>
<body>
  <form id="contact-form">
    <input type="text" name="name" placeholder="Your Name" required>
    <input type="email" name="email" placeholder="Your Email" required>
    <textarea name="message" placeholder="Your Message" required></textarea>
    <button type="submit">Send Message</button>
  </form>

  <script>
    const form = document.getElementById('contact-form');
    const formId = 'contact-form';
    let formStarted = false;
    let startTime = null;

    // Track form_start on first field interaction
    form.addEventListener('focus', function(e) {
      if (!formStarted && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        formStarted = true;
        startTime = Date.now();
        
        PulzivoAnalytics('event', 'form_start', {
          formId: formId,
          page: window.location.pathname
        });
      }
    }, true);

    // Track form_field_interaction
    form.querySelectorAll('input, textarea, select').forEach(field => {
      field.addEventListener('focus', function() {
        if (formStarted) {
          PulzivoAnalytics('event', 'form_field_interaction', {
            formId: formId,
            fieldName: this.name,
            action: 'focus',
            page: window.location.pathname
          });
        }
      });
    });

    // Track form_submit
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const timeToComplete = startTime ? (Date.now() - startTime) / 1000 : 0;
      
      PulzivoAnalytics('event', 'form_submit', {
        formId: formId,
        success: true,
        timeToComplete: timeToComplete,
        page: window.location.pathname
      });

      // Submit form data to your backend
      // ... your form submission logic
    });

    // Track form_abandon on page unload
    window.addEventListener('beforeunload', function() {
      if (formStarted) {
        const form = document.getElementById(formId);
        const filledFields = Array.from(form.querySelectorAll('input, textarea, select'))
          .filter(field => field.value.trim() !== '').length;
        const totalFields = form.querySelectorAll('input:not([type="hidden"]), textarea, select').length;

        PulzivoAnalytics('event', 'form_abandon', {
          formId: formId,
          fieldsCompleted: filledFields,
          totalFields: totalFields,
          page: window.location.pathname
        });
      }
    });
  </script>
</body>
</html>
```

---

### Example 2: React / Next.js

```jsx
import { useEffect, useRef, useState } from 'react';

function ContactForm() {
  const formRef = useRef(null);
  const [formStarted, setFormStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const formId = 'contact-form';

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    // Track form_start
    const handleFocus = (e) => {
      if (!formStarted && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        setFormStarted(true);
        setStartTime(Date.now());
        
        window.PulzivoAnalytics('event', 'form_start', {
          formId: formId,
          page: window.location.pathname
        });
      }

      // Track form_field_interaction
      if (formStarted) {
        window.PulzivoAnalytics('event', 'form_field_interaction', {
          formId: formId,
          fieldName: e.target.name,
          action: 'focus',
          page: window.location.pathname
        });
      }
    };

    form.addEventListener('focus', handleFocus, true);

    // Track form_abandon
    const handleBeforeUnload = () => {
      if (formStarted) {
        const fields = form.querySelectorAll('input, textarea');
        const filledFields = Array.from(fields).filter(f => f.value.trim() !== '').length;

        window.PulzivoAnalytics('event', 'form_abandon', {
          formId: formId,
          fieldsCompleted: filledFields,
          totalFields: fields.length,
          page: window.location.pathname
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      form.removeEventListener('focus', handleFocus, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formStarted]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const timeToComplete = startTime ? (Date.now() - startTime) / 1000 : 0;
    
    window.PulzivoAnalytics('event', 'form_submit', {
      formId: formId,
      success: true,
      timeToComplete: timeToComplete,
      page: window.location.pathname
    });

    // Your form submission logic
    // ...
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} id={formId}>
      <input type="text" name="name" placeholder="Your Name" required />
      <input type="email" name="email" placeholder="Your Email" required />
      <textarea name="message" placeholder="Your Message" required />
      <button type="submit">Send Message</button>
    </form>
  );
}
```

---

### Example 3: Angular (Reactive Forms)

```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact-form',
  template: `
    <form [formGroup]="contactForm" (ngSubmit)="onSubmit()" id="contact-form">
      <input formControlName="name" placeholder="Your Name">
      <input formControlName="email" placeholder="Your Email">
      <textarea formControlName="message" placeholder="Your Message"></textarea>
      <button type="submit">Send Message</button>
    </form>
  `
})
export class ContactFormComponent implements OnInit {
  contactForm!: FormGroup;
  formId = 'contact-form';
  formStarted = false;
  startTime: number | null = null;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      message: ['', Validators.required]
    });

    this.setupFormTracking();
  }

  private setupFormTracking() {
    // Track form_start on first value change
    this.contactForm.valueChanges.subscribe(() => {
      if (!this.formStarted) {
        this.formStarted = true;
        this.startTime = Date.now();
        
        this.trackEvent('form_start', {
          formId: this.formId,
          page: window.location.pathname
        });
      }
    });

    // Track form_field_interaction
    Object.keys(this.contactForm.controls).forEach(fieldName => {
      const control = this.contactForm.get(fieldName);
      control?.valueChanges.subscribe(() => {
        if (this.formStarted) {
          this.trackEvent('form_field_interaction', {
            formId: this.formId,
            fieldName: fieldName,
            action: 'input',
            page: window.location.pathname
          });
        }
      });
    });

    // Track form_abandon
    window.addEventListener('beforeunload', () => {
      if (this.formStarted && this.contactForm.dirty) {
        const filledFields = Object.keys(this.contactForm.controls)
          .filter(key => this.contactForm.get(key)?.value).length;
        
        this.trackEvent('form_abandon', {
          formId: this.formId,
          fieldsCompleted: filledFields,
          totalFields: Object.keys(this.contactForm.controls).length,
          page: window.location.pathname
        });
      }
    });
  }

  onSubmit() {
    if (this.contactForm.valid) {
      const timeToComplete = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
      
      this.trackEvent('form_submit', {
        formId: this.formId,
        success: true,
        timeToComplete: timeToComplete,
        page: window.location.pathname
      });

      // Your form submission logic
      // ...
    }
  }

  private trackEvent(eventName: string, data: any) {
    if (typeof (window as any).PulzivoAnalytics !== 'undefined') {
      (window as any).PulzivoAnalytics('event', eventName, data);
    }
  }
}
```

---

### Example 4: Vue.js

```vue
<template>
  <form ref="contactForm" @submit.prevent="handleSubmit" id="contact-form">
    <input v-model="form.name" @focus="handleFieldFocus('name')" placeholder="Your Name" required>
    <input v-model="form.email" @focus="handleFieldFocus('email')" type="email" placeholder="Your Email" required>
    <textarea v-model="form.message" @focus="handleFieldFocus('message')" placeholder="Your Message" required></textarea>
    <button type="submit">Send Message</button>
  </form>
</template>

<script>
export default {
  data() {
    return {
      form: {
        name: '',
        email: '',
        message: ''
      },
      formId: 'contact-form',
      formStarted: false,
      startTime: null
    };
  },
  mounted() {
    // Track form_abandon
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  },
  beforeUnmount() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  },
  methods: {
    handleFieldFocus(fieldName) {
      // Track form_start
      if (!this.formStarted) {
        this.formStarted = true;
        this.startTime = Date.now();
        
        window.PulzivoAnalytics('event', 'form_start', {
          formId: this.formId,
          page: window.location.pathname
        });
      }

      // Track form_field_interaction
      window.PulzivoAnalytics('event', 'form_field_interaction', {
        formId: this.formId,
        fieldName: fieldName,
        action: 'focus',
        page: window.location.pathname
      });
    },
    handleSubmit() {
      const timeToComplete = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
      
      window.PulzivoAnalytics('event', 'form_submit', {
        formId: this.formId,
        success: true,
        timeToComplete: timeToComplete,
        page: window.location.pathname
      });

      // Your form submission logic
      // ...
    },
    handleBeforeUnload() {
      if (this.formStarted) {
        const filledFields = Object.values(this.form).filter(v => v !== '').length;
        
        window.PulzivoAnalytics('event', 'form_abandon', {
          formId: this.formId,
          fieldsCompleted: filledFields,
          totalFields: Object.keys(this.form).length,
          page: window.location.pathname
        });
      }
    }
  }
};
</script>
```

---

## Event Data Structure

### form_start
```javascript
{
  formId: 'contact-form',  // Required: Unique form identifier
  page: '/contact'          // Required: Current page path
}
```

### form_field_interaction
```javascript
{
  formId: 'contact-form',  // Required: Unique form identifier
  fieldName: 'email',       // Required: Field name/id
  action: 'focus',          // Required: 'focus', 'blur', or 'input'
  page: '/contact'          // Required: Current page path
}
```

### form_submit
```javascript
{
  formId: 'contact-form',   // Required: Unique form identifier
  success: true,             // Required: Whether submission was successful
  timeToComplete: 15.3,      // Optional: Time in seconds from start to submit
  page: '/contact'           // Required: Current page path
}
```

### form_abandon
```javascript
{
  formId: 'contact-form',   // Required: Unique form identifier
  fieldsCompleted: 2,        // Required: Number of filled fields
  totalFields: 4,            // Required: Total number of fields
  page: '/contact'           // Required: Current page path
}
```

---

## Best Practices

### 1. **Use Unique Form IDs**
```html
<!-- ✅ Good -->
<form id="sign-in-form">

<!-- ❌ Bad -->
<form id="form">
```

### 2. **Track Time to Complete**
```javascript
const startTime = Date.now();
// ... later
const timeToComplete = (Date.now() - startTime) / 1000;
```

### 3. **Don't Track Hidden Fields**
```javascript
const fields = form.querySelectorAll('input:not([type="hidden"]), textarea, select');
```

### 4. **Handle Multi-Step Forms**
```javascript
// Track each step as a separate form
PulzivoAnalytics('event', 'form_start', {
  formId: 'checkout-form-step-1'
});

PulzivoAnalytics('event', 'form_submit', {
  formId: 'checkout-form-step-1',
  success: true
});

PulzivoAnalytics('event', 'form_start', {
  formId: 'checkout-form-step-2'
});
```

### 5. **Track Failed Submissions**
```javascript
fetch('/api/submit', { /* ... */ })
  .then(response => {
    PulzivoAnalytics('event', 'form_submit', {
      formId: 'contact-form',
      success: response.ok
    });
  })
  .catch(error => {
    PulzivoAnalytics('event', 'form_submit', {
      formId: 'contact-form',
      success: false
    });
  });
```

---

## Dashboard Metrics

After implementing form tracking, you'll see these metrics in your dashboard:

| Metric | Description |
|--------|-------------|
| **Submissions** | Total number of successful form submits |
| **Abandons** | Number of forms started but not submitted |
| **Conversion Rate** | (Submissions / Starts) × 100 |
| **Avg Time to Complete** | Average time from start to submit (seconds) |
| **Field Interactions** | Total number of field focus events |

---

## Upgrade to Enterprise

Want automatic form tracking without writing code?

✅ **Upgrade to Enterprise Plan** to get:
- Automatic form tracking for all forms
- No manual code required
- Works on any framework
- Rage click detection
- Error tracking
- And more...

[Upgrade Now →](https://pulzivo.com/pricing)

---

## Troubleshooting

### Forms not appearing in dashboard?
1. Check that `formId` is unique and consistent
2. Verify all 4 events are being sent
3. Check browser console for SDK errors
4. Ensure API key is correct

### Incorrect conversion rates?
1. Make sure `form_start` is tracked before `form_submit`
2. Don't track `form_start` multiple times for same session
3. Reset `formStarted` flag after submit

### Missing field interactions?
1. Ensure focus event listeners are attached to all fields
2. Check that `formStarted` is true before tracking interactions
3. Verify field names are being passed correctly

---

## Tooltip/Help Tracking (Enterprise Auto-Tracking)

### For Enterprise Users: Automatic Tooltip Tracking

Enterprise users get **automatic tooltip tracking** out of the box! Just add `data-tooltip` attributes:

```html
<!-- Automatic tracking -->
<button data-tooltip="Click to submit your form" 
        data-tooltip-id="submit-button"
        data-section="checkout">
  Submit
</button>

<!-- Or use pTooltip (PrimeNG) -->
<i class="pi pi-info-circle" 
   pTooltip="This shows your bounce rate"
   data-section="metrics"></i>
```

### For Pro/Free Users: Manual Tooltip Tracking

Track when users view help content to understand which sections need improvement:

```javascript
// Track tooltip views
document.querySelectorAll('[data-tooltip], [title]').forEach(element => {
  element.addEventListener('mouseenter', function() {
    const tooltipText = this.getAttribute('data-tooltip') || this.getAttribute('title');
    const section = this.getAttribute('data-section') || 'unknown';
    
    PulzivoAnalytics('event', 'tooltip_view', {
      tooltip_id: this.id || tooltipText.substring(0, 50),
      tooltip_text: tooltipText,
      section: section,
      page: window.location.pathname
    });
  });
});

// Track info icon clicks
document.querySelectorAll('.info-icon, .help-icon').forEach(icon => {
  icon.addEventListener('click', function() {
    const section = this.closest('[data-section]')?.getAttribute('data-section') || 'unknown';
    const tooltipText = this.getAttribute('title') || this.getAttribute('data-tooltip');
    
    PulzivoAnalytics('event', 'help_icon_click', {
      section: section,
      tooltip_text: tooltipText,
      page: window.location.pathname
    });
  });
});
```

### React Example

```jsx
function HelpIcon({ section, tooltip }) {
  const trackTooltipView = () => {
    window.PulzivoAnalytics('event', 'tooltip_view', {
      tooltip_id: section,
      tooltip_text: tooltip,
      section: section,
      page: window.location.pathname
    });
  };

  return (
    <i 
      className="info-icon" 
      title={tooltip}
      onMouseEnter={trackTooltipView}
      onClick={trackTooltipView}
    >
      ℹ️
    </i>
  );
}
```

### Vue Example

```vue
<template>
  <i 
    class="info-icon" 
    :title="tooltip"
    @mouseenter="trackTooltipView"
    @click="trackTooltipView">
    ℹ️
  </i>
</template>

<script>
export default {
  props: ['section', 'tooltip'],
  methods: {
    trackTooltipView() {
      window.PulzivoAnalytics('event', 'tooltip_view', {
        tooltip_id: this.section,
        tooltip_text: this.tooltip,
        section: this.section,
        page: window.location.pathname
      });
    }
  }
};
</script>
```

### Why Track Tooltips?

- **Identify confusion**: Which sections do users need help with?
- **Improve UX**: If a tooltip is viewed frequently, the UI might be unclear
- **Content optimization**: Rewrite confusing labels or add inline help
- **Feature discovery**: Track which features users are exploring

---

## Need Help?

- 📚 [View Full Documentation](https://pulzivo.com/docs)
- 💬 [Join our Discord](https://discord.gg/pulzivo)
- 📧 [Contact Support](mailto:support@pulzivo.com)
