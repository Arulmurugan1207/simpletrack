/**
 * Test Script: Send Form Interaction Events
 * 
 * This script sends sample form tracking events to your analytics API
 * to populate the Form Interactions dashboard with test data.
 * 
 * Usage:
 *   node test-form-events.js YOUR_API_KEY
 */

const https = require('https');

// Configuration
const API_URL = 'localhost:3004';
const API_KEY = process.argv[2] || 'YOUR_API_KEY_HERE';

if (API_KEY === 'YOUR_API_KEY_HERE') {
  console.error('❌ Error: Please provide your API key as an argument');
  console.error('Usage: node test-form-events.js YOUR_API_KEY');
  process.exit(1);
}

// Sample user IDs for testing
const users = ['user_001', 'user_002', 'user_003', 'user_004', 'user_005'];

// Sample forms to track
const forms = [
  { id: 'sign-in-form', fields: ['email', 'password'] },
  { id: 'sign-up-form', fields: ['name', 'email', 'password', 'confirmPassword'] },
  { id: 'contact-form', fields: ['name', 'email', 'message'] },
  { id: 'checkout-form', fields: ['cardNumber', 'expiry', 'cvv', 'billingAddress'] }
];

// Helper function to send event
function sendEvent(eventData) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      apiKey: API_KEY,
      ...eventData
    });

    const options = {
      hostname: 'localhost',
      port: 3004,
      path: '/analytics/events',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Helper to generate random timestamp within last 7 days
function randomTimestamp() {
  const now = Date.now();
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  return new Date(sevenDaysAgo + Math.random() * (now - sevenDaysAgo));
}

// Generate form interaction scenarios
async function generateFormInteractions() {
  console.log('🚀 Starting to generate form interaction events...\n');
  let eventCount = 0;

  for (const form of forms) {
    console.log(`📝 Generating events for: ${form.id}`);
    
    // Generate different user scenarios
    for (let i = 0; i < 20; i++) {
      const userId = users[Math.floor(Math.random() * users.length)];
      const startTime = randomTimestamp();
      
      try {
        // Scenario 1: Completed form (70% of users)
        if (Math.random() < 0.7) {
          // Form start
          await sendEvent({
            event_name: 'form_start',
            user_id: userId,
            timestamp: startTime.toISOString(),
            data: {
              formId: form.id,
              page: `/app/${form.id.replace('-form', '')}`
            }
          });
          eventCount++;

          // Field interactions
          for (const field of form.fields) {
            await sendEvent({
              event_name: 'form_field_interaction',
              user_id: userId,
              timestamp: new Date(startTime.getTime() + Math.random() * 30000).toISOString(),
              data: {
                formId: form.id,
                fieldName: field,
                action: 'focus'
              }
            });
            eventCount++;
          }

          // Form submit (after 15-60 seconds)
          const submitTime = new Date(startTime.getTime() + 15000 + Math.random() * 45000);
          await sendEvent({
            event_name: 'form_submit',
            user_id: userId,
            timestamp: submitTime.toISOString(),
            data: {
              formId: form.id,
              page: `/app/${form.id.replace('-form', '')}`,
              success: true
            }
          });
          eventCount++;

          process.stdout.write('✅ ');
        }
        // Scenario 2: Abandoned form (30% of users)
        else {
          // Form start
          await sendEvent({
            event_name: 'form_start',
            user_id: userId,
            timestamp: startTime.toISOString(),
            data: {
              formId: form.id,
              page: `/app/${form.id.replace('-form', '')}`
            }
          });
          eventCount++;

          // Some field interactions (user didn't complete all fields)
          const fieldsInteracted = Math.floor(Math.random() * form.fields.length);
          for (let j = 0; j < fieldsInteracted; j++) {
            await sendEvent({
              event_name: 'form_field_interaction',
              user_id: userId,
              timestamp: new Date(startTime.getTime() + Math.random() * 20000).toISOString(),
              data: {
                formId: form.id,
                fieldName: form.fields[j],
                action: 'focus'
              }
            });
            eventCount++;
          }

          // Form abandon
          const abandonTime = new Date(startTime.getTime() + 10000 + Math.random() * 30000);
          await sendEvent({
            event_name: 'form_abandon',
            user_id: userId,
            timestamp: abandonTime.toISOString(),
            data: {
              formId: form.id,
              page: `/app/${form.id.replace('-form', '')}`,
              fieldsCompleted: fieldsInteracted,
              totalFields: form.fields.length
            }
          });
          eventCount++;

          process.stdout.write('❌ ');
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (error) {
        console.error(`\n⚠️  Error sending event: ${error.message}`);
      }
    }
    
    console.log(`\n   ✓ Completed ${form.id}\n`);
  }

  console.log(`\n🎉 Successfully sent ${eventCount} form tracking events!`);
  console.log(`\n📊 Your Form Interactions dashboard should now show data.`);
  console.log(`   Refresh your dashboard to see the results.\n`);
}

// Run the script
generateFormInteractions().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
