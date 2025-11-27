import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbActiveModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { LoginModalComponent } from '../login-modal/login-modal.component';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-signup-modal',
  imports: [CommonModule, NgbModalModule, ReactiveFormsModule],
  templateUrl: './signup-modal.component.html',
  styleUrl: './signup-modal.component.scss'
})
export class SignupModalComponent {

  signupForm: FormGroup;

  constructor(private modalService: NgbModal, public activeModal: NgbActiveModal, private fb: FormBuilder) {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  openLogin() {
    this.activeModal.close();
    this.modalService.open(LoginModalComponent);
  }

  onSubmit() {
    if (this.signupForm.valid) {
      // For demo, just close
      this.activeModal.close();
    }
  }

}
