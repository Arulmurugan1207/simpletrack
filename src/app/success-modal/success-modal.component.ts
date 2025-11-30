import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbActiveModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-success-modal',
  imports: [CommonModule, NgbModalModule],
  template: `
    <div class="modal-header border-0">
      <h4 class="modal-title text-success">
        <i class="fas fa-check-circle me-2"></i>
        Success!
      </h4>
      <button type="button" class="btn-close" aria-label="Close" (click)="activeModal.close()"></button>
    </div>
    <div class="modal-body text-center">
      <div class="mb-4">
        <i class="fas fa-check-circle text-success" style="font-size: 4rem;"></i>
      </div>
      <h5 class="mb-3">{{ title }}</h5>
      <p class="text-muted mb-0">{{ message }}</p>
    </div>
    <div class="modal-footer border-0 justify-content-center">
      <button type="button" class="btn btn-success px-4" (click)="activeModal.close()">
        Continue
      </button>
    </div>
  `,
  styles: [`
    .modal-content {
      border-radius: 15px;
      border: none;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .modal-header {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: white;
      border-radius: 15px 15px 0 0;
    }
    .btn-close {
      filter: invert(1);
    }
  `]
})
export class SuccessModalComponent {
  @Input() title: string = 'Success!';
  @Input() message: string = 'Operation completed successfully.';

  constructor(public activeModal: NgbActiveModal) {}
}