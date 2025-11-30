import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbActiveModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { LoginModalComponent } from '../login-modal/login-modal.component';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';

// Custom validator for password confirmation
export function passwordMatchValidator(form: FormGroup) {
  const password = form.get('password');
  const confirmPassword = form.get('confirmPassword');

  if (password && confirmPassword && password.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-signup-modal',
  imports: [CommonModule, NgbModalModule, ReactiveFormsModule],
  templateUrl: './signup-modal.component.html',
  styleUrl: './signup-modal.component.scss'
})
export class SignupModalComponent {

  signupForm: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  message: { type: 'success' | 'error', text: string } | null = null;

  constructor(
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.signupForm = this.fb.group({
      firstname: ['', [Validators.required, Validators.minLength(2)]],
      lastname: ['', Validators.minLength(2)],
      email: ['', [Validators.required, Validators.email]],
      mobileno: ['', Validators.pattern(/^\+?[1-9]\d{1,14}$/)],
      password: ['', Validators.minLength(6)],
      confirmPassword: [''],
      acceptTerms: [false, Validators.requiredTrue]
    }, { validators: passwordMatchValidator });
  }

  openLogin() {
    this.activeModal.close();
    this.modalService.open(LoginModalComponent, {
      centered: true,
      backdrop: 'static',
      size: 'md'
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit() {
    if (this.signupForm.valid) {
      this.isLoading = true;
      this.message = null;

      const { acceptTerms, confirmPassword, ...signupData } = this.signupForm.value;

      this.authService.signup(signupData).subscribe({
        next: (response) => {
          this.isLoading = false;

          // Close modal immediately without showing success message
          this.activeModal.close('signup_success');
        },
        error: (error) => {
          this.isLoading = false;
          this.message = {
            type: 'error',
            text: error.message || 'Failed to create account. Please try again.'
          };
        }
      });
    } else {
      this.message = {
        type: 'error',
        text: 'Please fill in your first name, email address, and accept the terms.'
      };
      // Mark all fields as touched to show validation errors
      Object.keys(this.signupForm.controls).forEach(key => {
        this.signupForm.get(key)?.markAsTouched();
      });
    }
  }

}
