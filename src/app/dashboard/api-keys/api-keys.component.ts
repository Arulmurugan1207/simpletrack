import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { ApiKeysService, ApiKey, ApiKeyUsage } from '../../services/api-keys.service';
import { AuthService } from '../../services/auth.service';

interface UserPlan {
  type: string;
  apiKeyLimit: number | 'unlimited';
  price: number;
  features: string[];
}

@Component({
  selector: 'app-api-keys',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './api-keys.component.html',
  styleUrl: './api-keys.component.css',
})
export class ApiKeysComponent implements OnInit {
  apiKeys: ApiKey[] = [];
  archivedKeys: ApiKey[] = [];
  apiKeyForm: FormGroup;
  editForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  selectedKey: ApiKey | null = null;
  private modalRef: NgbModalRef | null = null;
  copiedApiKey: string | null = null;
  usage: ApiKeyUsage | null = null;

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
  totalKeysCreated: number = 0;
  archivedKeysCount: number = 0;
  keysCreatedThisMonth: number = 0;

  // Plan-based usage limits per API key
  planUsageLimits: { [key: string]: { daily: number; monthly: number } } = {
    'free': { daily: 1000, monthly: 10000 },
    'starter': { daily: 10000, monthly: 100000 },
    'professional': { daily: 50000, monthly: 500000 },
    'enterprise': { daily: 100000, monthly: 1000000 }
  };

  constructor(
    private fb: FormBuilder,
    private apiKeysService: ApiKeysService,
    private modalService: NgbModal,
    private router: Router,
    private authService: AuthService
  ) {
    this.apiKeyForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]]
    });

    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      console.log('API Keys: User not authenticated, redirecting to home');
      this.router.navigate(['/']);
      return;
    }

    this.loadUserPlan();
    this.loadApiKeys();
  }

  loadUserPlan(): void {
    // For now, we'll simulate getting plan data
    // In a real app, this would come from the backend
    // Note: loadTrackingData() removed - statistics now come from API
  }

  loadApiKeys(): void {
    this.isLoading = true;
    this.apiKeysService.getApiKeys().subscribe({
      next: (response) => {
        this.apiKeys = response.apiKeys.filter(key => key.isActive !== false);
        this.archivedKeys = response.apiKeys.filter(key => key.isActive === false);

        // Update statistics from API summary
        if (response.summary) {
          this.currentUsage = response.summary.activeKeys;
          this.totalKeysCreated = response.summary.totalKeysCreated;
          this.archivedKeysCount = response.summary.archivedKeys;
          this.keysCreatedThisMonth = response.summary.keysCreatedThisMonth;
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load API keys:', error);
        this.isLoading = false;
      }
    });
  }

  toggleArchivedKeys(): void {
    this.showArchivedKeys = !this.showArchivedKeys;
    // Archived keys are already loaded in loadApiKeys
  }

  // Plan-related methods
  canCreateMoreKeys(): boolean {
    return this.checkActiveKeysLimit() && this.checkMonthlyCreationLimit() && this.checkTotalCreationLimit();
  }

  checkActiveKeysLimit(): boolean {
    return this.userPlan.apiKeyLimit === 'unlimited' || this.currentUsage < this.userPlan.apiKeyLimit;
  }

  checkMonthlyCreationLimit(): boolean {
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

  getRemainingKeysCount(): number {
    const remaining = this.getRemainingKeys();
    return typeof remaining === 'number' ? remaining : 0;
  }

  hasRemainingKeys(): boolean {
    const remaining = this.getRemainingKeys();
    return remaining === 'unlimited' || remaining > 0;
  }

  isPlanUnlimited(): boolean {
    return this.userPlan.apiKeyLimit === 'unlimited';
  }

  getPlanLimitDisplay(): string | number {
    return this.userPlan.apiKeyLimit === 'unlimited' ? '∞' : this.userPlan.apiKeyLimit;
  }

  getPlanAlertClass(): string {
    if (!this.canCreateMoreKeys()) {
      return 'alert-warning';
    }
    if (this.currentUsage >= (this.userPlan.apiKeyLimit as number) * 0.8) {
      return 'alert-info';
    }
    return 'alert-success';
  }

  showUpgradeModal(): void {
    // Navigate to plans tab
    this.router.navigate(['/dashboard'], { queryParams: { tab: 'plans' } });
  }

  openCreateModal(content: any): void {
    if (!this.canCreateMoreKeys()) {
      this.showUpgradeModal();
      return;
    }

    this.selectedKey = null;
    this.apiKeyForm.reset();
    this.modalRef = this.modalService.open(content, { centered: true });
  }

  openEditModal(content: any, key: ApiKey): void {
    this.selectedKey = key;
    this.editForm.patchValue({
      name: key.name,
      description: key.description
    });
    this.modalRef = this.modalService.open(content, { centered: true });
  }

  createApiKey(): void {
    if (this.apiKeyForm.valid) {
      this.isSubmitting = true;
      const { name, description } = this.apiKeyForm.value;

      // Get limits based on user's plan
      const planLimits = this.planUsageLimits[this.userPlan.type] || this.planUsageLimits['free'];

      this.apiKeysService.createApiKey(name, description, planLimits).subscribe({
        next: (key) => {
          this.apiKeys.push(key);
          // Statistics will be updated when loadApiKeys is called
          this.modalRef?.close();
          this.apiKeyForm.reset();
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Failed to create API key:', error);
          this.isSubmitting = false;
        }
      });
    }
  }

  updateApiKey(): void {
    if (this.editForm.valid && this.selectedKey) {
      this.isSubmitting = true;
      const { name, description } = this.editForm.value;

      this.apiKeysService.updateApiKey(this.selectedKey.apiKey, {
        name,
        description
      }).subscribe({
        next: () => {
          this.loadApiKeys();
          this.modalRef?.close();
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Failed to update API key:', error);
          this.isSubmitting = false;
        }
      });
    }
  }

  archiveApiKey(apiKey: string): void {
    if (confirm('Are you sure you want to archive this API key?')) {
      this.apiKeysService.archiveApiKey(apiKey).subscribe({
        next: () => {
          this.loadApiKeys();
        },
        error: (err) => console.error('Error archiving API key', err)
      });
    }
  }

  restoreKey(key: ApiKey): void {
    // For now, we'll just reload - in a real app, you'd have a restore endpoint
    this.loadApiKeys();
  }

  viewUsage(apiKey: string): void {
    this.apiKeysService.getApiKeyUsage(apiKey).subscribe({
      next: (usage) => this.usage = usage,
      error: (err) => console.error('Error fetching usage', err)
    });
  }

  copyApiKey(apiKey: string): void {
    navigator.clipboard.writeText(apiKey).then(() => {
      this.copiedApiKey = apiKey;
      setTimeout(() => this.copiedApiKey = null, 2000);
    });
  }

  getActiveKeys(): ApiKey[] {
    return this.apiKeys.filter(key => key.isActive);
  }

  getDisplayedKeys(): ApiKey[] {
    if (this.showArchivedKeys) {
      return [...this.apiKeys, ...this.archivedKeys];
    }
    return this.apiKeys;
  }

  // Form validation helpers
  getFormFieldError(fieldName: string): string {
    const field = this.apiKeyForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['minlength']) return `Minimum length is ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['maxlength']) return `Maximum length is ${field.errors['maxlength'].requiredLength} characters`;
    }
    return '';
  }

  getEditFormFieldError(fieldName: string): string {
    const field = this.editForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['minlength']) return `Minimum length is ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['maxlength']) return `Maximum length is ${field.errors['maxlength'].requiredLength} characters`;
    }
    return '';
  }
}
