import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LoginModalComponent } from '../login-modal/login-modal.component';
import { SignupModalComponent } from '../signup-modal/signup-modal.component';

@Component({
  selector: 'app-home',
  imports: [LoginModalComponent, SignupModalComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  constructor(private modalService: NgbModal) {}

  openLoginModal() {
    this.modalService.open(LoginModalComponent, { centered: true });
  }

  openSignupModal() {
    this.modalService.open(SignupModalComponent, { centered: true });
  }
}
