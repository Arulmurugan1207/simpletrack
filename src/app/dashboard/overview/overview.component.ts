import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsDataService, AnalyticsMetrics, DeviceBreakdown, PageData, GeographicData, ConversionFunnel, RealtimeEvent, DateRange } from '../../services/analytics-data.service';
import { Subscription, interval, Observable } from 'rxjs';
import { ViewportScroller } from '@angular/common';
import { Chart, registerables, ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-overview',
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css'
})
export class OverviewComponent implements OnInit, OnDestroy {
  @Input() dateRange$!: Observable<DateRange | null>;

  // Live metrics
  metrics: AnalyticsMetrics = {
    liveVisitors: 0,
    totalPageViews: 0,
    conversionRate: 0,
    bounceRate: 0,
    avgSessionDuration: 0,
    newVsReturning: { new: 0, returning: 0 }
  };

  // Device breakdown
  deviceBreakdown: DeviceBreakdown = {
    desktop: 0,
    mobile: 0,
    tablet: 0,
    desktopPercentage: 0,
    mobilePercentage: 0,
    tabletPercentage: 0
  };

  // Doughnut chart configuration
  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // We'll use custom legend
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.label + ': ' + context.parsed + '%';
          }
        }
      }
    }
  };

  public doughnutChartData: ChartData<'doughnut'> = {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: [
        '#667eea', // Desktop - solid purple
        '#f093fb', // Mobile - solid pink
        '#4facfe'  // Tablet - solid blue
      ],
      hoverBackgroundColor: [
        '#5a67d8', // Darker purple for hover
        '#e83e8c', // Darker pink for hover
        '#3182ce'  // Darker blue for hover
      ]
    }]
  };

  public doughnutChartType: ChartType = 'doughnut';

  // Bar chart configuration for page views trend
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return 'Page Views: ' + context.parsed.y;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      },
      x: {
        ticks: {
          maxTicksLimit: 7
        }
      }
    }
  };

  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: '#667eea',
      hoverBackgroundColor: '#5a67d8',
      borderRadius: 4,
      borderSkipped: false
    }]
  };

  public barChartType: ChartType = 'bar';

  // Line chart configuration for page views trend
  public trendChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return 'Page Views: ' + context.parsed.y;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      },
      x: {
        ticks: {
          maxTicksLimit: 7
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  public trendChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Page Views',
      fill: true,
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      borderColor: '#667eea',
      borderWidth: 2,
      pointBackgroundColor: '#667eea',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.4
    }]
  };

  public trendChartType: ChartType = 'line';

  // Top pages
  topPages: PageData[] = [];

  // Pagination for top pages
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  // Conversion funnel
  funnelLabels: string[] = [];
  funnelSteps: number[] = [];

  // Geographic data
  geoData: GeographicData[] = [];

  // Realtime events
  realtimeEvents: RealtimeEvent[] = [];

  private subscriptions: Subscription = new Subscription();
  private updateInterval: any;
  private currentDateRange: DateRange | null = null;

  constructor(private analyticsDataService: AnalyticsDataService, private viewportScroller: ViewportScroller) { }

  ngOnInit(): void {
    // Subscribe to date range changes
    this.subscriptions.add(
      this.dateRange$.subscribe(dateRange => {
        this.currentDateRange = dateRange;
        this.loadDataWithDateFilter();
      })
    );

    this.startRealtimeEvents();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  private loadDataWithDateFilter(): void {
    // Clear existing subscriptions
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();

    // Re-subscribe to date range
    this.subscriptions.add(
      this.dateRange$.subscribe(dateRange => {
        this.currentDateRange = dateRange;
      })
    );

    // Load data with date filtering
    this.loadInitialData();
    this.startRealtimeUpdates();
    this.startRealtimeEvents();
  }

  private loadInitialData(): void {
    // Load metrics with date filter
    this.subscriptions.add(
      this.analyticsDataService.getMetrics(this.currentDateRange || undefined).subscribe(data => {
        this.metrics = data;
        this.updateTrendChartData();
        this.updateBarChartData();
      })
    );

    // Load device breakdown with date filter
    this.subscriptions.add(
      this.analyticsDataService.getDeviceBreakdown(this.currentDateRange || undefined).subscribe(data => {
        this.deviceBreakdown = data;
        this.updateDoughnutChartData();
      })
    );

    // Load top pages with date filter
    this.subscriptions.add(
      this.analyticsDataService.getTopPages(this.currentDateRange || undefined).subscribe(data => {
        this.topPages = data;
        this.updatePagination();
      })
    );

    // Load geographic data with date filter
    this.subscriptions.add(
      this.analyticsDataService.getGeographicData(this.currentDateRange || undefined).subscribe(data => {
        this.geoData = data;
      })
    );

    // Load conversion funnel with date filter
    this.subscriptions.add(
      this.analyticsDataService.getConversionFunnel(this.currentDateRange || undefined).subscribe(data => {
        this.funnelLabels = data.labels;
        this.funnelSteps = data.values;
      })
    );
  }

  private startRealtimeUpdates(): void {
    // Update metrics every 30 seconds with current date filter
    this.updateInterval = setInterval(() => {
      this.subscriptions.add(
        this.analyticsDataService.getMetrics(this.currentDateRange || undefined).subscribe(data => {
          this.metrics = data;
        })
      );
    }, 30000);
  }

  private startRealtimeEvents(): void {
    console.log('🎯 Component: Starting realtime events subscription');
    // Subscribe to realtime events stream
    this.subscriptions.add(
      this.analyticsDataService.getRealtimeEvents().subscribe(events => {
        console.log('📥 Component: Received events from service:', events.length, 'events');
        if (events.length > 0) {
          console.log('🎨 Component: First event sample:', {
            event_name: events[0].event_name,
            user_id: events[0].user_id,
            timestamp: events[0].timestamp,
            user_type: events[0].data.user_type,
            page: events[0].data.page
          });
        }
        // Keep only the latest 15 events for better visibility
        if (events.length > 0) {
          this.realtimeEvents = [...events].slice(0, 15);
          console.log('💾 Component: Updated realtimeEvents array with', this.realtimeEvents.length, 'events');
        }
      })
    );
  }

  // Helper methods for template
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getTimeAgo(timestamp: Date | string): string {
    const now = new Date();
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }

  // Update doughnut chart data when device breakdown changes
  private updateDoughnutChartData(): void {
    this.doughnutChartData = {
      ...this.doughnutChartData,
      datasets: [{
        ...this.doughnutChartData.datasets[0],
        data: [
          this.deviceBreakdown.desktopPercentage,
          this.deviceBreakdown.mobilePercentage,
          this.deviceBreakdown.tabletPercentage
        ]
      }]
    };
  }

  // Update bar chart data for page views trend
  private updateBarChartData(): void {
    const labels: string[] = [];
    const data: number[] = [];

    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

      // Generate realistic trend data based on current metrics
      const baseViews = this.metrics.totalPageViews || 100;
      const dailyVariation = 0.7 + Math.random() * 0.6; // 70-130% variation
      const trendMultiplier = 1 + (i * 0.05); // Slight upward trend
      const views = Math.round(baseViews * dailyVariation * trendMultiplier / 7);
      data.push(views);
    }

    this.barChartData = {
      ...this.barChartData,
      labels,
      datasets: [{
        ...this.barChartData.datasets[0],
        data
      }]
    };
  }

  // Generate page views trend data for the last 7 days
  private updateTrendChartData(): void {
    const labels: string[] = [];
    const data: number[] = [];

    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

      // Generate realistic trend data based on current metrics
      const baseViews = this.metrics.totalPageViews || 100;
      const dailyVariation = 0.7 + Math.random() * 0.6; // 70-130% variation
      const trendMultiplier = 1 + (i * 0.05); // Slight upward trend
      const views = Math.round(baseViews * dailyVariation * trendMultiplier / 7);
      data.push(views);
    }

    this.trendChartData = {
      ...this.trendChartData,
      labels,
      datasets: [{
        ...this.trendChartData.datasets[0],
        data
      }]
    };
  }

  // Pagination methods
  get paginatedPages(): PageData[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.topPages.slice(startIndex, endIndex);
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.scrollToTopPages();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.scrollToTopPages();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.scrollToTopPages();
    }
  }

  private scrollToTopPages(): void {
    // Scroll to the top pages section with smooth behavior
    setTimeout(() => {
      const element = document.getElementById('top-pages-section');
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100); // Small delay to ensure DOM is updated
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.topPages.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }
  }
}
