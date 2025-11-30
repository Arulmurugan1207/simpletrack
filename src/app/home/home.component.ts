import { Component, OnInit, ViewChild, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgbModal, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbAccordionDirective, NgbAccordionItem, NgbAccordionHeader, NgbAccordionButton, NgbAccordionCollapse, NgbAccordionBody } from '@ng-bootstrap/ng-bootstrap';
import { LoginModalComponent } from '../login-modal/login-modal.component';
import { SignupModalComponent } from '../signup-modal/signup-modal.component';
import { DashboardModalComponent } from '../dashboard-modal/dashboard-modal.component';
import { SuccessModalComponent } from '../success-modal/success-modal.component';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, NgbDropdownModule, NgbAccordionDirective, NgbAccordionItem, NgbAccordionHeader, NgbAccordionButton, NgbAccordionCollapse, NgbAccordionBody],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomeComponent implements OnInit {

  @ViewChild('panel0', { read: NgbAccordionItem }) panel0!: NgbAccordionItem;
  @ViewChild('panel0', { read: ElementRef }) panel0Element!: ElementRef;
  @ViewChild('panel1', { read: NgbAccordionItem }) panel1!: NgbAccordionItem;
  @ViewChild('panel1', { read: ElementRef }) panel1Element!: ElementRef;
  @ViewChild('panel2', { read: NgbAccordionItem }) panel2!: NgbAccordionItem;
  @ViewChild('panel2', { read: ElementRef }) panel2Element!: ElementRef;
  @ViewChild('panel3', { read: NgbAccordionItem }) panel3!: NgbAccordionItem;
  @ViewChild('panel3', { read: ElementRef }) panel3Element!: ElementRef;
  @ViewChild('panel4', { read: NgbAccordionItem }) panel4!: NgbAccordionItem;
  @ViewChild('panel4', { read: ElementRef }) panel4Element!: ElementRef;
  @ViewChild('panel5', { read: NgbAccordionItem }) panel5!: NgbAccordionItem;
  @ViewChild('panel5', { read: ElementRef }) panel5Element!: ElementRef;
  @ViewChild('panel6', { read: NgbAccordionItem }) panel6!: NgbAccordionItem;
  @ViewChild('panel6', { read: ElementRef }) panel6Element!: ElementRef;
  @ViewChild('panel7', { read: NgbAccordionItem }) panel7!: NgbAccordionItem;
  @ViewChild('panel7', { read: ElementRef }) panel7Element!: ElementRef;
  @ViewChild('panel8', { read: NgbAccordionItem }) panel8!: NgbAccordionItem;
  @ViewChild('panel8', { read: ElementRef }) panel8Element!: ElementRef;

  user: any = null;

  // Code snippet mapping for `<pre><code [innerText]>` rendering
  codeBlocks: { [key: string]: string } = {
    'script-tag': `<script src="https://simpletrack.dev/stk-analytics.min.js" data-api-key="YOUR_API_KEY"></script>`,
    'complete-html': `<!DOCTYPE html>\n<html>\n<head>\n  <title>My Website</title>\n  <script src="https://simpletrack.dev/stk-analytics.min.js" data-api-key="YOUR_API_KEY"></script>\n</head>\n<body>\n  <!-- Your website content -->\n</body>\n</html>`,
    'component-integration': `// In any component - no wrapper code needed!\nwindow.STKAnalytics.trackEvent('button_click', { button: 'signup' });\nwindow.STKAnalytics.trackPromoImpression('promo_123');\nwindow.STKAnalytics.trackPromoClick('promo_123', 'learn_more');\nwindow.STKAnalytics.trackError('API Error', { code: 500 });`,
    'vanilla-js-events': `// After script loads and initializes\ndocument.getElementById('signup-btn').addEventListener('click', function() {\n    window.STKAnalytics.trackEvent('signup_click', {\n        source: 'hero_section',\n        plan: 'free'\n    });\n});\n\n// Track form submissions\ndocument.getElementById('contact-form').addEventListener('submit', function(e) {\n    window.STKAnalytics.trackEvent('form_submit', {\n        form: 'contact',\n        category: 'engagement'\n    });\n});\n\n// Track custom interactions\nfunction trackCustomAction(action, data) {\n    window.STKAnalytics.trackEvent(action, data);\n}`,
    'config-options-example': `<script src="https://simpletrack.dev/stk-analytics.min.js" data-api-key="my-ecommerce-site" data-batch-interval="10000" data-debug="true" data-disable-scroll></script>`,
    'data-click-attributes': `<!-- Examples -->\n<button data-click="signup">Sign Up</button>\n<a href="/pricing" data-click="pricing_link">View Pricing</a>\n<div data-click="promo_banner" class="promo">Special Offer!</div>`,
    'spa-navigation-tracking': `// Angular example\nimport { Router, NavigationEnd } from '@angular/router';\n\nconstructor(private router: Router) {\n    this.router.events.subscribe(event => {\n        if (event instanceof NavigationEnd) {\n            window.STKAnalytics.trackNavigation(event.url, {\n                previousUrl: this.router.url\n            });\n        }\n    });\n};`,
    'custom-event-example': `STKAnalytics.trackEvent('signup_complete', {\n  category: 'conversion',\n  label: 'email-signup',\n  value: 1,\n  custom: { plan: 'premium' }\n});`,
    'ecommerce-tracking': `// E-commerce events\nwindow.STKAnalytics.trackEvent('product_view', {\n  category: 'ecommerce',\n  custom: { productId: '123', productName: 'Widget' }\n});\n\nwindow.STKAnalytics.trackEvent('add_to_cart', {\n  category: 'ecommerce',\n  custom: { productId: '123', quantity: 1, price: 29.99 }\n});\n\nwindow.STKAnalytics.trackEvent('purchase', {\n  category: 'conversion',\n  value: 89.97,\n  custom: { orderId: 'ORD-12345', items: 3 }\n});`,
    'immediate-send': `// Example: Send immediately on form submit\ndocument.getElementById('contact-form').onsubmit = async function() {\n    window.STKAnalytics.trackEvent('form_submit', { form: 'contact' });\n    await STKAnalytics.sendBatch(); // Send immediately\n};`,
    'user-email-basic': `// After login\nSTKAnalytics.setUserEmail('user@example.com');\n\n// Clear on logout\nSTKAnalytics.clearUserEmail();`,
    'react-login-integration': `// React login component\nconst handleLogin = async (email, password) => {\n    const response = await loginAPI(email, password);\n    if (response.success) {\n        window.STKAnalytics.setUserEmail(email);\n        // Redirect to dashboard\n    }\n};\n\n// Angular auth service\n@Injectable({ providedIn: 'root' })\nexport class AuthService {\n    login(credentials: any) {\n        return this.http.post('/api/login', credentials).pipe(\n            tap(response => {\n                if (response.token) {\n                    window.STKAnalytics.setUserEmail(credentials.email);\n                    localStorage.setItem('token', response.token);\n                }\n            })\n        );\n    }\n\n    logout() {\n        window.STKAnalytics.clearUserEmail();\n        localStorage.removeItem('token');\n        // Redirect to login\n    }\n}`,
    'promo-impression-basic': `// Impression (e.g., banner view)\nSTKAnalytics.trackPromoImpression('promo_2024_black_friday', {\n    position: 'homepage_top'\n});\n\n// Click\nSTKAnalytics.trackPromoClick('promo_2024_black_friday', 'view_details');`,
    'intersection-observer': `// Banner component with intersection observer\nclass PromoBanner extends Component {\n    componentDidMount() {\n        const observer = new IntersectionObserver((entries) => {\n            entries.forEach((entry) => {\n                if (entry.isIntersecting) {\n                    window.STKAnalytics.trackPromoImpression('summer_sale_2024', {\n                        position: 'sidebar',\n                        bannerSize: '300x250'\n                    });\n                    observer.disconnect(); // Track only once\n                }\n            });\n        });\n        observer.observe(this.bannerRef.current);\n    }\n\n    handleClick = () => {\n        window.STKAnalytics.trackPromoClick('summer_sale_2024', 'shop_now');\n        // Navigate to product page\n    };\n\n    render() {\n        return (\n            <div ref={this.bannerRef} onClick={this.handleClick}>\n                Summer Sale - 50% Off!\n            </div>\n        );\n    }\n}`,
    'email-utm-tracking': `// Track email opens (UTM parameters)\nSTKAnalytics.trackPromoImpression('newsletter_dec_2024', {\n  campaign: 'monthly_newsletter',\n  source: 'email',\n  medium: 'newsletter',\n  term: 'holiday_specials'\n});\n\n// Track email link clicks\nSTKAnalytics.trackPromoClick('newsletter_dec_2024', 'read_more', {\n  campaign: 'monthly_newsletter',\n  source: 'email',\n  medium: 'newsletter'\n});`,
    'debug-configuration': `// Enable debug for development\nSTKAnalytics.init({\n  serviceName: 'my-app',\n  debug: window.location.hostname === 'localhost'  // Auto-enable on localhost\n});\n\n// Or via data attribute\n<script src="https://simpletrack.dev/stk-analytics.min.js" data-api-key="my-app" data-debug="true"></script>`
  };

  constructor(private modalService: NgbModal, private router: Router, private sanitizer: DomSanitizer, private authService: AuthService) {}



  getSafeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  ngOnInit() {
    this.user = this.authService.getUserData();
   // this.initAnalytics();
    this.initCopyButtons();
    this.initBackToTopButton();
    this.initEventTracking();

    // Make the copy function globally available for innerHTML buttons
    (window as any).copyCodeBlock = (button: HTMLElement) => {
      const container = button.closest('.code-block-container');
      if (container) {
        const codeElement = container.querySelector('code') as HTMLElement;
        if (codeElement) {
          navigator.clipboard.writeText(codeElement.textContent || '').then(() => {
            // Extract identifying information
            const accordionId = container.getAttribute('data-accordion') || 'unknown';
            const codeBlockId = container.getAttribute('data-code-block') || 'unknown';
            const codeSnippet = codeElement.textContent?.substring(0, 50) + '...' || '';

            (window as any).STKAnalytics?.trackEvent('code_copy', {
              accordionSection: accordionId,
              codeBlockId: codeBlockId,
              codeLength: codeElement.textContent?.length || 0,
              codeSnippet: codeSnippet
            });

            // Show visual feedback
            const originalText = button.innerHTML;
            button.innerHTML = '✅ Copied!';
            button.style.backgroundColor = '#007bff';
            button.style.borderColor = '#007bff';

            // Revert back after 2 seconds
            setTimeout(() => {
              button.innerHTML = originalText;
              button.style.backgroundColor = '';
              button.style.borderColor = '';
            }, 2000);
          });
        }
      }
    };

    // Initialize demo analytics tracking
    this.initDemoTracking();

    // Make trackCustomAction globally available for demo purposes
    (window as any).trackCustomAction = (action: string, data: any) => {
      (window as any).STKAnalytics?.trackEvent(action, data);
      console.log('📊 Custom event tracked:', action, data);
    };
  }

  copyToClipboard(text: string, buttonElement?: HTMLElement) {
    navigator.clipboard.writeText(text).then(() => {
      if (buttonElement) {
        const originalText = buttonElement.textContent || '';
        buttonElement.textContent = '✅ Copied!';
        buttonElement.classList.remove('btn-success');
        buttonElement.classList.add('btn-primary');
        setTimeout(() => {
          buttonElement.textContent = originalText;
          buttonElement.classList.remove('btn-primary');
          buttonElement.classList.add('btn-success');
        }, 2000);
      } else {
        // No button element provided, just log success
        console.log('Text copied successfully');
      }
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        if (buttonElement) {
          const originalText = buttonElement.textContent || '';
          buttonElement.textContent = '✅ Copied!';
          buttonElement.classList.remove('btn-success');
          buttonElement.classList.add('btn-primary');
          setTimeout(() => {
            buttonElement.textContent = originalText;
            buttonElement.classList.remove('btn-primary');
            buttonElement.classList.add('btn-success');
          }, 2000);
        } else {
          // No button element provided, just log success
          console.log('Text copied successfully (fallback)');
        }
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr);
        if (buttonElement) {
          buttonElement.textContent = '❌ Failed';
          buttonElement.classList.remove('btn-success');
          buttonElement.classList.add('btn-danger');
          setTimeout(() => {
            buttonElement.textContent = '📋 Copy';
            buttonElement.classList.remove('btn-danger');
            buttonElement.classList.add('btn-success');
          }, 2000);
        } else {
          console.error('Copy failed');
        }
      }
      document.body.removeChild(textArea);
    });
  }

  scrollToTop() {
    (window as any).STKAnalytics?.trackEvent('scroll_to_top');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToContact() {
    (window as any).STKAnalytics?.trackEvent('scroll_to_contact');
    const el = document.getElementById('contact-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }



  sendContactMessage() {
    const email = (document.getElementById('contactEmail') as HTMLInputElement)?.value;
    const subject = (document.getElementById('contactSubject') as HTMLInputElement)?.value;
    const message = (document.getElementById('contactMessage') as HTMLTextAreaElement)?.value;

    if (email && subject && message) {
      (window as any).STKAnalytics?.trackEvent('contact_form_submit', {
        hasEmail: !!email,
        subjectLength: subject.length,
        messageLength: message.length
      });

      // Create mailto link with the form data
      const mailtoLink = `mailto:support@simpletrack.dev?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`From: ${email}\n\n${message}`)}`;
      window.location.href = mailtoLink;

      // Close the modal
      const modal = document.getElementById('contactModal');
      if (modal && (window as any).bootstrap && (window as any).bootstrap.Modal) {
        const bsModal = (window as any).bootstrap.Modal.getInstance(modal);
        bsModal?.hide();
      }

      // Clear form
      (document.getElementById('contactEmail') as HTMLInputElement).value = '';
      (document.getElementById('contactSubject') as HTMLInputElement).value = '';
      (document.getElementById('contactMessage') as HTMLTextAreaElement).value = '';
    } else {
      (window as any).STKAnalytics?.trackEvent('contact_form_error', { reason: 'missing_fields' });
      alert('Please fill in all fields');
    }
  }

  openPrivacyPolicy() {
    (window as any).STKAnalytics?.trackEvent('navigation', { type: 'privacy_policy' });
    const el = document.getElementById('privacy-policy');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  openTermsOfService() {
    (window as any).STKAnalytics?.trackEvent('navigation', { type: 'terms_of_service' });
    const el = document.getElementById('terms-of-service');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  toggleAccordion(panelId: string) {
    if (!panelId) return;

    // Track navigation to the given panel
    (window as any).STKAnalytics?.trackEvent('navigation', { type: 'accordion', panel: panelId });

    // Find the accordion item and open it if closed
    const panels: { [key: string]: NgbAccordionItem } = {
      'panel-0': this.panel0,
      'panel-1': this.panel1,
      'panel-2': this.panel2,
      'panel-3': this.panel3,
      'panel-4': this.panel4,
      'panel-5': this.panel5,
      'panel-6': this.panel6,
      'panel-7': this.panel7,
      'panel-8': this.panel8
    };
    const elements: { [key: string]: Element } = {
      'panel-0': this.panel0Element.nativeElement,
      'panel-1': this.panel1Element.nativeElement,
      'panel-2': this.panel2Element.nativeElement,
      'panel-3': this.panel3Element.nativeElement,
      'panel-4': this.panel4Element.nativeElement,
      'panel-5': this.panel5Element.nativeElement,
      'panel-6': this.panel6Element.nativeElement,
      'panel-7': this.panel7Element.nativeElement,
      'panel-8': this.panel8Element.nativeElement
    };
    const item = panels[panelId];
    if (item && item.collapsed) {
      item.toggle();
    }

    // Smooth-scroll the panel into view (allow a short delay so it can expand first)
    const el = elements[panelId];
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 1000);
    }
  }

  private initBackToTopButton() {
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
      // Show/hide button based on scroll position
      window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
          backToTopBtn.classList.remove('d-none');
          backToTopBtn.classList.add('d-block');
        } else {
          backToTopBtn.classList.remove('d-block');
          backToTopBtn.classList.add('d-none');
        }
      });
    }
  }

  private initAnalytics() {
    // Initialize SimpleTrack Analytics
    if ((window as any).STKAnalytics) {
      (window as any).STKAnalytics.init({
        serviceName: 'simpletrack',
        debug: false
      });

      // Track page view
      (window as any).STKAnalytics.trackEvent('page_view', {
        category: 'navigation',
        label: document.title,
        custom: { url: window.location.pathname }
      });

      // Track button clicks
      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON') {
          (window as any).STKAnalytics.trackEvent('button_click', {
            category: 'interaction',
            label: target.textContent || target.innerText,
            custom: { id: target.id, class: target.className }
          });
        }
      });

      // Track link clicks
      document.addEventListener('click', (e) => {
        const link = (e.target as HTMLElement).closest('a');
        if (link) {
          (window as any).STKAnalytics.trackEvent('link_click', {
            category: 'navigation',
            label: link.textContent || link.innerText,
            custom: { href: link.href }
          });
        }
      });

      // Track form submissions
      document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', () => {
          (window as any).STKAnalytics.trackEvent('form_submit', {
            category: 'engagement',
            label: (form as HTMLFormElement).id || (form as HTMLFormElement).name || 'form',
            custom: { action: (form as HTMLFormElement).action }
          });
          (window as any).STKAnalytics.sendBatch();
        });
      });

      // Track page exit
      window.addEventListener('beforeunload', () => {
        (window as any).STKAnalytics.trackEvent('page_exit', {
          category: 'navigation',
          label: document.title,
          custom: { url: window.location.pathname }
        });
        (window as any).STKAnalytics.sendBatch();
      });
    }
  }

  private initCopyButtons() {
    // Copy buttons are handled by inline onclick handlers in the HTML content
    // No additional event listeners needed
  }

  private initEventTracking() {
    // Track page view
    (window as any).STKAnalytics?.trackEvent('page_view', {
      referrer: document.referrer,
      url: window.location.href,
      title: document.title
    });

    // Track session start
    (window as any).STKAnalytics?.trackEvent('session_start');

    // Track clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const eventData: any = {
        element: target.tagName.toLowerCase(),
        text: target.textContent?.substring(0, 50) || '',
        x: e.clientX,
        y: e.clientY
      };

      // Check for specific element types
      if (target.classList.contains('copy-btn')) {
        eventData.type = 'copy_button';
      } else if (target.tagName === 'BUTTON') {
        eventData.type = 'button';
      } else if (target.tagName === 'A') {
        eventData.type = 'link';
        eventData.href = (target as HTMLAnchorElement).href;
      } else if (target.closest('.accordion-header')) {
        eventData.type = 'accordion_toggle';
      }

      (window as any).STKAnalytics?.trackEvent('click', eventData);
    });

    // Note: Scroll depth, time on page, and page visibility are handled by the analytics SDK automatically

    // Track performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (perfData) {
          (window as any).STKAnalytics?.trackEvent('page_load_performance', {
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
            totalTime: perfData.loadEventEnd - perfData.fetchStart
          });
        }
      }, 0);
    });
  }



  openLogin() {
    (window as any).STKAnalytics?.trackEvent('modal_open', { modal: 'login' });
    const modalRef = this.modalService.open(LoginModalComponent);
    modalRef.result.then(
      (result) => {
        // Modal closed successfully (login completed)
        this.refreshUserState();

        // Show success modal after login
        if (this.user) {
          const successModal = this.modalService.open(SuccessModalComponent, {
            centered: true,
            backdrop: 'static',
            size: 'sm'
          });
          const successComponent = successModal.componentInstance as SuccessModalComponent;
          successComponent.title = 'Login Successful!';
          successComponent.message = `Welcome back, ${this.user.firstname}! You have been successfully logged in.`;
        }
      },
      (reason) => {
        // Modal dismissed
        // No need to refresh user state
      }
    );
  }

  openSignup() {
    (window as any).STKAnalytics?.trackEvent('modal_open', { modal: 'signup' });
    const modalRef = this.modalService.open(SignupModalComponent);
    modalRef.result.then(
      (result) => {
        // Modal closed successfully (signup completed)
        this.refreshUserState();

        // Show success modal after signup
        if (this.user) {
          const successModal = this.modalService.open(SuccessModalComponent, {
            centered: true,
            backdrop: 'static',
            size: 'sm'
          });
          const successComponent = successModal.componentInstance as SuccessModalComponent;
          successComponent.title = 'Account Created!';
          successComponent.message = `Welcome to SimpleTrack, ${this.user.firstname}! Your account has been created successfully.`;
        }
      },
      (reason) => {
        // Modal dismissed
        // No need to refresh user state
      }
    );
  }

  openDashboardModal() {
    (window as any).STKAnalytics?.trackEvent('modal_open', { modal: 'dashboard' });
    this.modalService.open(DashboardModalComponent, { size: 'lg' });
  }

  navigateToDashboard() {
    (window as any).STKAnalytics?.trackEvent('navigation', { destination: 'dashboard' });
    this.router.navigate(['/dashboard']);
  }

  logout() {
    (window as any).STKAnalytics?.trackEvent('user_logout');
    this.authService.signout();
    this.user = null;
  }

  refreshUserState() {
    this.user = this.authService.getUserData();
  }

  trackDownload() {
    (window as any).STKAnalytics?.trackEvent('sdk_download', { version: 'minified', action: 'view_in_tab' });
  }

  private initDemoTracking() {
    // Track signup button clicks
    const signupBtn = document.getElementById('signup-btn');
    if (signupBtn) {
      signupBtn.addEventListener('click', () => {
        (window as any).STKAnalytics?.trackEvent('signup_click', {
          source: 'hero_section',
          plan: 'free'
        });
        alert('Signup tracked! Check console for event details.');
      });
    }

    // Track contact form submissions
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', (e: Event) => {
        e.preventDefault();
        const formData = new FormData(contactForm as HTMLFormElement);
        (window as any).STKAnalytics?.trackEvent('form_submit', {
          form: 'contact',
          category: 'engagement',
          hasName: !!formData.get('name'),
          hasEmail: !!formData.get('email'),
          subjectLength: (formData.get('subject') as string)?.length || 0,
          messageLength: (formData.get('message') as string)?.length || 0
        });
        alert('Form submission tracked! Check console for event details.');
        (contactForm as HTMLFormElement).reset();
      });
    }
  }
}





