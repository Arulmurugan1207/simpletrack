import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface Plan {
  type: string;
  name: string;
  price: number;
  apiKeyLimit: number | 'unlimited';
  eventLimit: number | 'unlimited';
  features: string[];
  popular?: boolean;
  description: string;
}

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss']
})
export class PlansComponent implements OnInit {
  currentPlan: Plan = {
    type: 'free',
    name: 'Free',
    price: 0,
    apiKeyLimit: 3,
    eventLimit: 10000,
    features: ['Up to 3 API keys', '10,000 events/month', 'Basic analytics dashboard'],
    description: 'Perfect for personal projects and testing'
  };

  plans: Plan[] = [
    {
      type: 'free',
      name: 'Free',
      price: 0,
      apiKeyLimit: 3,
      eventLimit: 10000,
      features: [
        'Up to 3 API keys',
        '10,000 events/month',
        'Basic analytics dashboard',
        'Page views & clicks tracking',
        'Real-time data',
        'Community support'
      ],
      description: 'Perfect for personal projects and testing'
    },
    {
      type: 'pro',
      name: 'Professional',
      price: 29,
      apiKeyLimit: 25,
      eventLimit: 500000,
      features: [
        'Up to 25 API keys',
        '500,000 events/month',
        'Advanced analytics dashboard',
        'Custom events & conversions',
        'Real-time alerts',
        'Data export (CSV/JSON)',
        'API access',
        'Custom integrations',
        'Email & chat support',
        '99.9% uptime SLA'
      ],
      description: 'Ideal for growing businesses and teams',
      popular: true
    },
    {
      type: 'enterprise',
      name: 'Enterprise',
      price: 99,
      apiKeyLimit: 'unlimited',
      eventLimit: 'unlimited',
      features: [
        'Unlimited API keys',
        'Unlimited events',
        'Everything in Professional',
        'Advanced user management',
        'Custom dashboards',
        'Priority phone support',
        'Dedicated account manager',
        'Custom contracts & billing',
        'White-label options',
        '99.99% uptime SLA',
        'On-premise deployment'
      ],
      description: 'For large organizations with custom needs'
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCurrentPlan();
  }

  loadCurrentPlan(): void {
    // Get current plan from user data
    const userData = this.authService.getUserData();
    if (userData && userData.plan) {
      this.currentPlan = {
        type: userData.plan.type,
        name: userData.plan.type.charAt(0).toUpperCase() + userData.plan.type.slice(1),
        price: userData.plan.price,
        apiKeyLimit: userData.plan.apiKeyLimit,
        eventLimit: userData.plan.apiKeyLimit === 'unlimited' ? 'unlimited' : (userData.plan.apiKeyLimit as number) * 1000,
        features: userData.plan.features,
        description: `Your current ${userData.plan.type} plan`
      };
    }
  }

  selectPlan(plan: Plan): void {
    // In a real app, this would call the backend to update the user's plan
    // For now, we'll simulate the upgrade and redirect back to API keys
    this.upgradePlan(plan);
  }

  upgradePlan(selectedPlan: Plan): void {
    // Update user plan data
    const userData = this.authService.getUserData();
    if (userData) {
      userData.plan = {
        type: selectedPlan.type,
        apiKeyLimit: selectedPlan.apiKeyLimit,
        price: selectedPlan.price,
        features: selectedPlan.features
      };

      // Save updated user data
      localStorage.setItem('userData', JSON.stringify({
        user: userData,
        expiresAt: userData.expiresAt || (Date.now() + (24 * 60 * 60 * 1000))
      }));

      // Show success message and redirect
      alert(`🎉 Successfully upgraded to ${selectedPlan.name} plan!\n\nNew limits:\n• API Keys: ${selectedPlan.apiKeyLimit === 'unlimited' ? 'Unlimited' : selectedPlan.apiKeyLimit}\n• Events: ${selectedPlan.eventLimit === 'unlimited' ? 'Unlimited' : selectedPlan.eventLimit}\n\nPrice: $${selectedPlan.price}/month`);

      // Navigate back to API keys tab
      this.router.navigate(['/dashboard'], { queryParams: { tab: 'api-keys' } });
    }
  }

  isCurrentPlan(plan: Plan): boolean {
    return plan.type === this.currentPlan.type;
  }

  getPlanLimitDisplay(limit: number | 'unlimited'): string {
    return limit === 'unlimited' ? '∞' : limit.toString();
  }

  getSavingsText(plan: Plan): string {
    if (plan.type === 'free') return '';
    const monthlySavings = (this.currentPlan.price - plan.price) * -1;
    return monthlySavings > 0 ? `Save $${monthlySavings}/month` : '';
  }

  goBack(): void {
    this.router.navigate(['/dashboard'], { queryParams: { tab: 'api-keys' } });
  }
}
