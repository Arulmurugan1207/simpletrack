import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

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
  selector: 'app-upgrade-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upgrade-modal.component.html',
  styleUrls: ['./upgrade-modal.component.scss']
})
export class UpgradeModalComponent {
  @Input() currentPlan: Plan = {
    type: 'free',
    name: 'Free',
    price: 0,
    apiKeyLimit: 3,
    eventLimit: 1000,
    features: ['Basic analytics', 'Page views', 'Clicks'],
    description: 'Perfect for getting started'
  };

  @Output() planSelected = new EventEmitter<Plan>();

  plans: Plan[] = [
    {
      type: 'free',
      name: 'Free',
      price: 0,
      apiKeyLimit: 3,
      eventLimit: 1000,
      features: ['Basic analytics', 'Page views', 'Clicks', 'Basic reports'],
      description: 'Perfect for getting started'
    },
    {
      type: 'starter',
      name: 'Starter',
      price: 9.99,
      apiKeyLimit: 10,
      eventLimit: 10000,
      features: ['Everything in Free', 'Custom events', 'Real-time dashboard', 'Email support'],
      description: 'Great for small businesses',
      popular: false
    },
    {
      type: 'pro',
      name: 'Professional',
      price: 29.99,
      apiKeyLimit: 50,
      eventLimit: 100000,
      features: ['Everything in Pro', 'Advanced analytics', 'Export data', 'API access', 'Priority support'],
      description: 'For growing companies',
      popular: true
    },
    {
      type: 'enterprise',
      name: 'Enterprise',
      price: 99.99,
      apiKeyLimit: 'unlimited',
      eventLimit: 'unlimited',
      features: ['Everything in Pro', 'Custom integrations', 'Dedicated support', 'SLA guarantee', 'White-label options'],
      description: 'For large organizations'
    }
  ];

  constructor(public activeModal: NgbActiveModal) {}

  selectPlan(plan: Plan): void {
    this.planSelected.emit(plan);
    this.activeModal.close(plan);
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
}
