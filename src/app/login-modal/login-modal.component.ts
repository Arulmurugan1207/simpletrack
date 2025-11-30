import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbActiveModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { SignupModalComponent } from '../signup-modal/signup-modal.component';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login-modal',
  imports: [CommonModule, NgbModalModule, ReactiveFormsModule],
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.scss'
})
export class LoginModalComponent {

  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;
  message: { type: 'success' | 'error', text: string } | null = null;

  constructor(
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });

    // Load saved email if remember me was checked previously
    this.loadSavedCredentials();
  }

  openSignup() {
    this.activeModal.close();
    this.modalService.open(SignupModalComponent, {
      centered: true,
      backdrop: 'static',
      size: 'md'
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  forgotPassword() {
    // For now, just show a message. In a real app, this would open a forgot password modal or redirect
    this.message = {
      type: 'error',
      text: 'Forgot password functionality coming soon. Please contact support for help.'
    };
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.message = null;

      const { rememberMe, ...loginData } = this.loginForm.value;

      // Save credentials if remember me is checked
      if (rememberMe) {
        this.saveCredentials(loginData.email);
      } else {
        this.clearSavedCredentials();
      }

      this.authService.signin(loginData).subscribe({
        next: (response) => {
          this.isLoading = false;

          // Close modal immediately without showing success message
          this.activeModal.close('login_success');
        },
        error: (error) => {
          this.isLoading = false;
          this.message = {
            type: 'error',
            text: error.message || 'Invalid email or password. Please try again.'
          };
        }
      });
    } else {
      this.message = {
        type: 'error',
        text: 'Please enter your email and password.'
      };
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  private loadSavedCredentials() {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      this.loginForm.patchValue({
        email: savedEmail,
        rememberMe: true
      });
    }
  }

  private saveCredentials(email: string) {
    localStorage.setItem('rememberedEmail', email);
  }

  private clearSavedCredentials() {
    localStorage.removeItem('rememberedEmail');
  }
}