import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FunnelEventsModalComponent } from './funnel-events-modal.component';

describe('FunnelEventsModalComponent', () => {
  let component: FunnelEventsModalComponent;
  let fixture: ComponentFixture<FunnelEventsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FunnelEventsModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FunnelEventsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});