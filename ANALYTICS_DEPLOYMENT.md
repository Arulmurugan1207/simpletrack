# STK Analytics Integration

This project includes a custom analytics tracking system that can be used both locally for development and deployed as a third-party script for other websites.

## Development Setup

### Local Analytics Script
- **File**: `src/stk-analytics.js`
- **URL**: `http://localhost:3004/stk-analytics.js` (served by Angular dev server)
- **Features**:
  - Full debugging logs
  - Event tracking (page views, clicks, visibility changes)
  - Local storage for user/session management
  - Batch processing every 5 seconds

### Automatic Loading
The `index.html` automatically loads the appropriate script:
- **Development**: Loads `sty-analytics.js` from local server
- **Production**: Loads `stk-analytics.min.js` from `https://simpletrack.dev`

## Production Deployment

### Creating Minified Version
Run the minification script to create the production version:

```bash
npm run minify-analytics
```

This creates `public/stk-analytics.min.js` from `public/sty-analytics.js` using Terser.

### Hosting the Script
Upload `stk-analytics.min.js` to your CDN or hosting service at:
```
https://simpletrack.dev/stk-analytics.min.js
```

### Third-Party Integration
Other websites can integrate your analytics by adding this script to their HTML:

```html
<script
  src="https://simpletrack.dev/stk-analytics.min.js"
  data-api-key="YourWebsiteName"
  data-batch-interval="5000">
</script>
```

### Configuration Options
- `data-api-key`: Your website/app name (required)
- `data-batch-interval`: Batch sending interval in ms (optional, default 5000)
- `data-debug`: Enable debug logging (optional, default false)
- `data-disable-page-views`: Disable automatic page view tracking
- `data-disable-clicks`: Disable automatic click tracking
- `data-disable-scroll`: Disable automatic scroll tracking

## Development Workflow

1. **Develop locally** with `sty-analytics.js`
2. **Test functionality** with full logging enabled
3. **Minify for production**: `npm run minify-analytics`
4. **Deploy** `stk-analytics.min.js` to CDN
5. **Update websites** to use the new minified version

## File Structure

```
src/
├── stk-analytics.js          # Development version (readable)
└── index.html                # Auto-loads appropriate script

public/
├── stk-analytics.min.js      # Production version (minified, generated)
└── ...
```</content>
<parameter name="filePath">c:\Users\arul0\OneDrive\Documents\MyProjects\simpletrack\ANALYTICS_DEPLOYMENT.md