import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbActiveModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { SignupModalComponent } from '../signup-modal/signup-modal.component';

@Component({
  selector: 'app-login-modal',
  imports: [CommonModule, NgbModalModule],
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.scss'
})
export class LoginModalComponent {

  constructor(private modalService: NgbModal, public activeModal: NgbActiveModal) {}

  openSignup() {
    this.activeModal.close();
    this.modalService.open(SignupModalComponent);
  }

}
