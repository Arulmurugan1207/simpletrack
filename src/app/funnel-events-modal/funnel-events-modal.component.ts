import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { RealtimeEvent } from '../services/analytics-data.service';

@Component({
  selector: 'app-funnel-events-modal',
  imports: [CommonModule, NgbModalModule],
  template: `
    <div class="modal-header">
      <h4 class="modal-title">{{ stepName }} Events</h4>
      <button type="button" class="btn-close" aria-label="Close" (click)="activeModal.close()"></button>
    </div>
    <div class="modal-body">
      <div class="events-table-container" *ngIf="events.length > 0; else noEvents">
        <div class="table-responsive">
          <table class="table table-striped table-hover">
            <thead class="table-dark">
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>User ID</th>
                <th>Page</th>
                <th>User Type</th>
                <th>Visit Count</th>
                <th>Country</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let event of events">
                <td class="timestamp-cell">
                  <div class="timestamp">{{ getFormattedTime(event.timestamp) }}</div>
                  <small class="text-muted">{{ getTimeAgo(event.timestamp) }}</small>
                </td>
                <td>
                  <div class="event-info">
                    <i [class]="getEventIcon(event.event_name)" class="event-icon"></i>
                    <strong>{{ event.event_name }}</strong>
                    <br>
                    <small class="text-muted">{{ event.data.event_category }}</small>
                  </div>
                </td>
                <td>
                  <code class="user-id">{{ event.user_id.substring(0, 8) }}...</code>
                </td>
                <td>
                  <div class="page-info">
                    <div class="page-path">{{ event.data.page }}</div>
                    <small class="text-muted page-title" *ngIf="event.data['page_title']">{{ event.data['page_title'] }}</small>
                  </div>
                </td>
                <td>
                  <span class="badge" [ngClass]="getUserTypeBadgeClass(event.data.user_type)">
                    {{ event.data.user_type }}
                  </span>
                </td>
                <td class="text-center">
                  <span class="visit-count">{{ event.data.visit_count }}</span>
                </td>
                <td>
                  <span class="country-info">
                    <span class="flag" *ngIf="event.data.country && getCountryFlag(event.data.country)">🇺🇸</span>
                    {{ event.data.country || 'Unknown' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <ng-template #noEvents>
        <div class="text-center text-muted py-4">
          <i class="fas fa-inbox fa-3x mb-3"></i>
          <p>No events found for this funnel step.</p>
        </div>
      </ng-template>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" (click)="activeModal.close()">Close</button>
    </div>
  `,
  styles: [`
    .events-table-container {
      max-height: 70vh;
      overflow-y: auto;
    }

    .table {
      margin-bottom: 0;
      font-size: 0.9rem;
    }

    .table th {
      position: sticky;
      top: 0;
      background-color: #343a40;
      border-top: none;
      font-weight: 600;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 12px 8px;
    }

    .table td {
      padding: 10px 8px;
      vertical-align: middle;
    }

    .timestamp-cell {
      min-width: 120px;
    }

    .timestamp {
      font-weight: 600;
      color: #495057;
      font-size: 0.85rem;
    }

    .user-id {
      font-family: 'Courier New', monospace;
      background-color: #f8f9fa;
      padding: 2px 4px;
      border-radius: 3px;
      font-size: 0.8rem;
    }

    .page-info {
      max-width: 200px;
    }

    .page-path {
      font-weight: 500;
      color: #007bff;
      word-break: break-all;
    }

    .page-title {
      display: block;
      color: #6c757d;
      font-size: 0.75rem;
      margin-top: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badge {
      font-size: 0.75rem;
      padding: 4px 8px;
    }

    .visit-count {
      font-weight: 600;
      color: #28a745;
    }

    .country-info {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .flag {
      font-size: 1.1rem;
    }

    .event-info {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .event-icon {
      margin-top: 2px;
      font-size: 0.9rem;
    }

    .table-hover tbody tr:hover {
      background-color: #f8f9fa;
    }

    .table-responsive {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  `]
})
export class FunnelEventsModalComponent {
  @Input() stepName: string = '';
  @Input() events: RealtimeEvent[] = [];

  constructor(public activeModal: NgbActiveModal) {}

  getTimeAgo(timestamp: Date | string): string {
    const now = new Date();
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }

  getFormattedTime(timestamp: Date | string): string {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getUserTypeBadgeClass(userType: string): string {
    switch (userType?.toLowerCase()) {
      case 'new':
        return 'bg-success';
      case 'returning':
        return 'bg-primary';
      default:
        return 'bg-secondary';
    }
  }

  getCountryFlag(country: string): boolean {
    // Simple check for countries that commonly have flags
    const countriesWithFlags = ['United States', 'Unknown', 'Canada', 'United Kingdom', 'Germany', 'France', 'Japan', 'Australia'];
    return countriesWithFlags.includes(country);
  }

  getEventIcon(eventName: string): string {
    switch (eventName) {
      case 'page_view':
        return 'fas fa-eye text-primary';
      case 'page_hidden':
        return 'fas fa-eye-slash text-warning';
      case 'click':
        return 'fas fa-mouse-pointer text-success';
      case 'scroll':
        return 'fas fa-arrow-down text-info';
      case 'form_submit':
        return 'fas fa-paper-plane text-success';
      case 'add_to_cart':
        return 'fas fa-cart-plus text-success';
      case 'purchase':
        return 'fas fa-shopping-cart text-success';
      default:
        return 'fas fa-circle text-secondary';
    }
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}