import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillingUsageComponent } from './billing-usage.component';

describe('BillingUsageComponent', () => {
  let component: BillingUsageComponent;
  let fixture: ComponentFixture<BillingUsageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingUsageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillingUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
