import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { APIKeyManagementService } from '../../services/api-key-management.service';
import { AuthService } from '../../services/auth.service';
import { APIKey } from '../../services/api-key.model';

interface UserPlan {
  type: string;
  apiKeyLimit: number | 'unlimited';
  price: number;
  features: string[];
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss']
})
export class ServicesComponent implements OnInit {
  services: APIKey[] = [];
  archivedServices: APIKey[] = []; // Store archived (soft-deleted) keys
  serviceForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  selectedService: APIKey | null = null;
  private modalRef: NgbModalRef | null = null;
  copiedApiKey: string | null = null;

  // Show archived keys toggle
  showArchivedKeys = false;

  // Plan-related properties
  userPlan: UserPlan = {
    type: 'free',
    apiKeyLimit: 3,
    price: 0,
    features: ['basic_analytics']
  };
  currentUsage: number = 0;
  totalKeysCreated: number = 0; // Track total keys created (including deleted ones)
  deletedKeysCount: number = 0; // Track deleted keys count
  keysCreatedThisMonth: number = 0; // Track keys created this month

  constructor(
    private fb: FormBuilder,
    private apiKeyManagement: APIKeyManagementService,
    private authService: AuthService,
    private modalService: NgbModal,
    private router: Router
  ) {
    this.serviceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void {
    this.loadUserPlan();
    this.loadServices();
  }

  loadUserPlan(): void {
    // For now, we'll simulate getting plan data from user profile
    // In a real app, this would come from the backend
    const userData = this.authService.getUserData();
    if (userData && userData.plan) {
      this.userPlan = userData.plan;
    } else {
      // Default to free plan if no plan data
      this.userPlan = {
        type: 'free',
        apiKeyLimit: 3,
        price: 0,
        features: ['basic_analytics']
      };
    }

    // Load tracking data from localStorage
    this.loadTrackingData();
  }

  loadTrackingData(): void {
    const trackingData = localStorage.getItem('apiKeyTracking');
    if (trackingData) {
      const data = JSON.parse(trackingData);
      this.totalKeysCreated = data.totalKeysCreated || 0;
      this.deletedKeysCount = data.deletedKeysCount || 0;
      this.keysCreatedThisMonth = data.keysCreatedThisMonth || 0;

      // Reset monthly count if it's a new month
      const currentMonth = new Date().getMonth();
      const lastTrackedMonth = data.lastTrackedMonth || currentMonth;
      if (currentMonth !== lastTrackedMonth) {
        this.keysCreatedThisMonth = 0;
        this.saveTrackingData();
      }
    }
  }

  saveTrackingData(): void {
    const trackingData = {
      totalKeysCreated: this.totalKeysCreated,
      deletedKeysCount: this.deletedKeysCount,
      keysCreatedThisMonth: this.keysCreatedThisMonth,
      lastTrackedMonth: new Date().getMonth()
    };
    localStorage.setItem('apiKeyTracking', JSON.stringify(trackingData));
  }

  loadServices(): void {
    this.isLoading = true;

    // Load active API keys
    this.apiKeyManagement.getUserAPIKeys().subscribe({
      next: (response) => {
        this.services = response.apiKeys.filter(key => !key.isDeleted);
        this.currentUsage = this.services.length;

        // Initialize total keys created if not already set
        if (this.totalKeysCreated === 0) {
          this.totalKeysCreated = this.services.length;
          this.saveTrackingData();
        }

        // Load archived keys if toggle is enabled
        if (this.showArchivedKeys) {
          this.loadArchivedServices();
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Failed to load services:', error);
        this.isLoading = false;
      }
    });
  }

  loadArchivedServices(): void {
    this.apiKeyManagement.getArchivedAPIKeys().subscribe({
      next: (response) => {
        this.archivedServices = response.apiKeys;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load archived services:', error);
        this.isLoading = false;
      }
    });
  }

  toggleArchivedKeys(): void {
    this.showArchivedKeys = !this.showArchivedKeys;
    if (this.showArchivedKeys) {
      this.loadArchivedServices();
    } else {
      this.archivedServices = [];
    }
  }

  // Plan-related methods
  canCreateMoreKeys(): boolean {
    // Check multiple restrictions based on plan
    return this.checkActiveKeysLimit() && this.checkMonthlyCreationLimit() && this.checkTotalCreationLimit();
  }

  checkActiveKeysLimit(): boolean {
    return this.userPlan.apiKeyLimit === 'unlimited' || this.currentUsage < this.userPlan.apiKeyLimit;
  }

  checkMonthlyCreationLimit(): boolean {
    // Different plans have different monthly creation limits
    const monthlyLimits: { [key: string]: number | 'unlimited' } = {
      'free': 5,
      'starter': 20,
      'professional': 100,
      'enterprise': 'unlimited'
    };

    const limit = monthlyLimits[this.userPlan.type] || 5;
    return limit === 'unlimited' || (typeof limit === 'number' && this.keysCreatedThisMonth < limit);
  }

  checkTotalCreationLimit(): boolean {
    // Prevent abuse by limiting total keys created (including deleted ones)
    const totalLimits: { [key: string]: number | 'unlimited' } = {
      'free': 10,
      'starter': 50,
      'professional': 500,
      'enterprise': 'unlimited'
    };

    const limit = totalLimits[this.userPlan.type] || 10;
    return limit === 'unlimited' || (typeof limit === 'number' && this.totalKeysCreated < limit);
  }

  getRemainingKeys(): number | 'unlimited' {
    if (this.userPlan.apiKeyLimit === 'unlimited') return 'unlimited';
    return Math.max(0, this.userPlan.apiKeyLimit - this.currentUsage);
  }

  getMonthlyRemainingCreations(): number | 'unlimited' {
    const monthlyLimits: { [key: string]: number | 'unlimited' } = {
      'free': 5,
      'starter': 20,
      'professional': 100,
      'enterprise': 'unlimited'
    };

    const limit = monthlyLimits[this.userPlan.type] || 5;
    if (limit === 'unlimited') return 'unlimited';
    return Math.max(0, (limit as number) - this.keysCreatedThisMonth);
  }

  getTotalRemainingCreations(): number | 'unlimited' {
    const totalLimits: { [key: string]: number | 'unlimited' } = {
      'free': 10,
      'starter': 50,
      'professional': 500,
      'enterprise': 'unlimited'
    };

    const limit = totalLimits[this.userPlan.type] || 10;
    if (limit === 'unlimited') return 'unlimited';
    return Math.max(0, (limit as number) - this.totalKeysCreated);
  }

  // Helper methods for template
  getRemainingKeysCount(): number {
    const remaining = this.getRemainingKeys();
    return typeof remaining === 'number' ? remaining : 0;
  }

  isPlanUnlimited(): boolean {
    return this.userPlan.apiKeyLimit === 'unlimited';
  }

  getPlanLimitDisplay(): string | number {
    return this.userPlan.apiKeyLimit === 'unlimited' ? '∞' : this.userPlan.apiKeyLimit;
  }

  getPlanAlertClass(): string {
    if (!this.canCreateMoreKeys()) {
      return 'alert alert-warning';
    }
    if (this.currentUsage >= (this.userPlan.apiKeyLimit as number) * 0.8) {
      return 'alert alert-info';
    }
    return 'alert alert-success';
  }

  showUpgradeModal(): void {
    // Navigate to plans tab instead of opening modal
    this.router.navigate(['/dashboard'], { queryParams: { tab: 'plans' } });
  }

  upgradePlan(selectedPlan: any): void {
    // In a real app, this would call the backend to update the user's plan
    // For now, we'll simulate the upgrade
    this.userPlan = {
      type: selectedPlan.type,
      apiKeyLimit: selectedPlan.apiKeyLimit,
      price: selectedPlan.price,
      features: selectedPlan.features
    };

    // Show success message
    alert(`🎉 Successfully upgraded to ${selectedPlan.name} plan!\n\nNew limits:\n• API Keys: ${selectedPlan.apiKeyLimit === 'unlimited' ? 'Unlimited' : selectedPlan.apiKeyLimit}\n• Events: ${selectedPlan.eventLimit === 'unlimited' ? 'Unlimited' : selectedPlan.eventLimit}\n\nPrice: $${selectedPlan.price}/month`);

    // In a real app, you would also update the user data in localStorage or refresh from backend
    const userData = this.authService.getUserData();
    if (userData) {
      userData.plan = this.userPlan;
      localStorage.setItem('userData', JSON.stringify({
        user: userData,
        expiresAt: userData.expiresAt || (Date.now() + (24 * 60 * 60 * 1000))
      }));
    }
  }

  openCreateModal(content: any): void {
    if (!this.canCreateMoreKeys()) {
      this.showUpgradeModal();
      return;
    }
    
    this.selectedService = null;
    this.serviceForm.reset();
    this.modalRef = this.modalService.open(content, { centered: true });
  }

  openEditModal(content: any, service: APIKey): void {
    this.selectedService = service;
    this.serviceForm.patchValue({
      name: service.name,
      description: service.description || ''
    });
    this.modalRef = this.modalService.open(content, { centered: true });
  }

  openDeleteModal(content: any, service: APIKey): void {
    this.selectedService = service;
    this.modalRef = this.modalService.open(content, { centered: true });
  }

  createService(): void {
    if (this.serviceForm.valid) {
      this.isSubmitting = true;
      const serviceData = this.serviceForm.value;

      this.apiKeyManagement.createAPIKey(serviceData).subscribe({
        next: (response) => {
          this.services.push(response.apiKey);
          this.currentUsage = this.services.length; // Update usage counter
          this.totalKeysCreated++; // Track total created
          this.keysCreatedThisMonth++; // Track monthly created
          this.saveTrackingData(); // Save tracking data
          this.isSubmitting = false;
          this.modalRef?.close();
          this.serviceForm.reset();
        },
        error: (error) => {
          console.error('Failed to create service:', error);
          this.isSubmitting = false;
        }
      });
    } else {
      this.serviceForm.markAllAsTouched();
    }
  }

  updateService(): void {
    if (this.serviceForm.valid && this.selectedService) {
      this.isSubmitting = true;
      const updateData = this.serviceForm.value;

      this.apiKeyManagement.updateAPIKey(this.selectedService.apiKey, updateData).subscribe({
        next: (response) => {
          const index = this.services.findIndex(s => s.apiKey === this.selectedService!.apiKey);
          if (index !== -1) {
            this.services[index] = response.apiKey;
          }
          this.isSubmitting = false;
          this.modalRef?.close();
          this.selectedService = null;
        },
        error: (error) => {
          console.error('Failed to update service:', error);
          this.isSubmitting = false;
        }
      });
    } else {
      this.serviceForm.markAllAsTouched();
    }
  }

  deleteService(): void {
    if (this.selectedService) {
      this.isSubmitting = true;
      this.apiKeyManagement.deleteAPIKey(this.selectedService.apiKey).subscribe({
        next: (response) => {
          // Move the key to archived services
          if (response.apiKey) {
            this.archivedServices.unshift(response.apiKey);
            this.services = this.services.filter(s => s.apiKey !== this.selectedService!.apiKey);
            this.currentUsage = this.services.length; // Update usage counter
            this.deletedKeysCount++; // Track deletion
            this.saveTrackingData(); // Save tracking data
          }
          this.isSubmitting = false;
          this.modalRef?.close();
          this.selectedService = null;
        },
        error: (error) => {
          console.error('Failed to delete service:', error);
          this.isSubmitting = false;
        }
      });
    }
  }

  restoreService(service: APIKey): void {
    this.apiKeyManagement.restoreAPIKey(service.apiKey).subscribe({
      next: (response) => {
        if (response.apiKey) {
          // Move from archived to active
          this.services.unshift(response.apiKey);
          this.archivedServices = this.archivedServices.filter(s => s.apiKey !== service.apiKey);
          this.currentUsage = this.services.length;
          this.deletedKeysCount--; // Reduce deleted count
          this.saveTrackingData();
        }
      },
      error: (error) => {
        console.error('Failed to restore service:', error);
      }
    });
  }

  permanentlyDeleteService(service: APIKey): void {
    if (confirm('Are you sure you want to permanently delete this API key? This action cannot be undone and all associated data will be lost.')) {
      this.apiKeyManagement.permanentlyDeleteAPIKey(service.apiKey).subscribe({
        next: () => {
          this.archivedServices = this.archivedServices.filter(s => s.apiKey !== service.apiKey);
        },
        error: (error) => {
          console.error('Failed to permanently delete service:', error);
        }
      });
    }
  }

  viewReports(service: APIKey): void {
    // Navigate to reports tab with the selected API key
    this.router.navigate(['/dashboard'], {
      queryParams: {
        tab: 'reports',
        apiKey: service.apiKey,
        keyName: service.name
      }
    });
  }

  getRetentionDaysLeft(service: APIKey): number {
    if (!service.retentionExpiresAt) return 30; // Default 30 days
    const expiryDate = new Date(service.retentionExpiresAt);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  isRetentionExpired(service: APIKey): boolean {
    return this.getRetentionDaysLeft(service) <= 0;
  }

  copyApiKey(apiKey: string): void {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey).then(() => {
        this.copiedApiKey = apiKey;
        // Clear the copied state after 2 seconds
        setTimeout(() => {
          this.copiedApiKey = null;
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy API key:', err);
      });
    }
  }

  getActiveServices(): APIKey[] {
    return this.services.filter(service => service.isActive);
  }

  getRestrictionMessage(): string {
    if (this.canCreateMoreKeys()) {
      return '';
    }

    if (!this.checkActiveKeysLimit()) {
      return `Active API key limit reached (${this.currentUsage}/${this.userPlan.apiKeyLimit}).`;
    }

    if (!this.checkMonthlyCreationLimit()) {
      const monthlyLimit = this.getMonthlyLimit();
      return `Monthly creation limit reached (${this.keysCreatedThisMonth}/${monthlyLimit}).`;
    }

    if (!this.checkTotalCreationLimit()) {
      const totalLimit = this.getTotalLimit();
      return `Total lifetime creation limit reached (${this.totalKeysCreated}/${totalLimit}).`;
    }

    return 'Plan limit reached.';
  }

  private getMonthlyLimit(): number {
    const monthlyLimits: { [key: string]: number | 'unlimited' } = {
      'free': 5,
      'starter': 20,
      'professional': 100,
      'enterprise': 'unlimited'
    };
    const limit = monthlyLimits[this.userPlan.type] || 5;
    return typeof limit === 'number' ? limit : 0;
  }

  private getTotalLimit(): number {
    const totalLimits: { [key: string]: number | 'unlimited' } = {
      'free': 10,
      'starter': 50,
      'professional': 500,
      'enterprise': 'unlimited'
    };
    const limit = totalLimits[this.userPlan.type] || 10;
    return typeof limit === 'number' ? limit : 0;
  }

  getFormFieldError(fieldName: string): string {
    const field = this.serviceForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName === 'name' ? 'Name' : fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['minlength']) {
        return `${fieldName === 'name' ? 'Name' : fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['maxlength']) {
        return `${fieldName === 'name' ? 'Name' : fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be no more than ${field.errors['maxlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  // Helper methods for template to avoid type issues
  getMonthlyLimitForDisplay(): number {
    const limit = this.getMonthlyRemainingCreations();
    return typeof limit === 'number' ? this.keysCreatedThisMonth + limit : this.keysCreatedThisMonth;
  }

  getTotalLimitForDisplay(): number {
    const limit = this.getTotalRemainingCreations();
    return typeof limit === 'number' ? this.totalKeysCreated + limit : this.totalKeysCreated;
  }

  hasRemainingKeys(): boolean {
    const remaining = this.getRemainingKeys();
    return typeof remaining === 'number' && remaining > 0;
  }
}