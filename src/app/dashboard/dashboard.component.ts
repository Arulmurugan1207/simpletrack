import { Component, OnInit, InjectionToken } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverviewComponent } from './overview/overview.component';
import { AccountSettingsComponent } from './account-settings/account-settings.component';
import { ReportsComponent } from './reports/reports.component';
import { BillingUsageComponent } from './billing-usage/billing-usage.component';
import { HelpSupportComponent } from './help-support/help-support.component';
import { PlansComponent } from './plans/plans.component';
import { ApiKeysComponent } from './api-keys/api-keys.component';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, ActivatedRoute } from '@angular/router';
import { NgxDaterangepickerBootstrapModule } from 'ngx-daterangepicker-bootstrap';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { DateRange } from '../services/analytics-data.service';
import { AuthService } from '../services/auth.service';

const DATERANGEPICKER_CONFIG = new InjectionToken('daterangepicker.config');

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    FormsModule,
    NgxDaterangepickerBootstrapModule,
    OverviewComponent,
    AccountSettingsComponent,
    ReportsComponent,
    BillingUsageComponent,
    HelpSupportComponent,
    PlansComponent,
    ApiKeysComponent,
    NgbDropdownModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  activeTab: string = 'overview';
  user: any = null;
  sidebarOpen: boolean = false;

  // Date range picker properties
  selectedDateRange: any;
  dateRanges: any = {
    'Today': [new Date(), new Date()],
    'Yesterday': [new Date(Date.now() - 24 * 60 * 60 * 1000), new Date(Date.now() - 24 * 60 * 60 * 1000)],
    'Last 7 Days': [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()],
    'Last 30 Days': [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()],
    'This Month': [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()],
    'Last Month': [new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), new Date(new Date().getFullYear(), new Date().getMonth(), 0)]
  };

  // Date range subject for child components
  private dateRangeSubject = new BehaviorSubject<DateRange | null>(null);
  public dateRange$ = this.dateRangeSubject.asObservable();

  constructor(private router: Router, private route: ActivatedRoute, private authService: AuthService) {}

  ngOnInit() {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      console.log('User not authenticated, redirecting to home');
      this.router.navigate(['/']);
      return;
    }

    // Get user data from AuthService
    this.user = this.authService.getUserData();

    // Check for tab query parameter
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'];
      }
    });

    // Set default date range to last 7 days
    const defaultRange: DateRange = {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date()
    };

    this.selectedDateRange = defaultRange;
    this.dateRangeSubject.next(defaultRange);
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    // Close sidebar on mobile after selecting a tab
    if (window.innerWidth < 768) {
      this.sidebarOpen = false;
    }
  }

  goHome() {
    this.router.navigate(['/']);
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  onDateRangeSelected(event: any) {
    console.log('Date range selected:', event);

    if (event && event.startDate && event.endDate) {
      const dateRange: DateRange = {
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate)
      };

      this.dateRangeSubject.next(dateRange);
      console.log('Date range updated:', dateRange);
    }
  }

  logout() {
    // Use AuthService signout method to properly clear authentication data
    this.authService.signout();

    // Clear session storage user data
    sessionStorage.removeItem('user');

    // Clear analytics user email
    if ((window as any).STKAnalytics) {
      (window as any).STKAnalytics.clearUserEmail();
    }

    this.router.navigate(['/']);
  }

  getTodayInfo(): string {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return today.toLocaleDateString('en-US', options);
  }
}
