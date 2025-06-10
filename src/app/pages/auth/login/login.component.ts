import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { NotificationMessage } from '../../../models/layout/notificationmessage';
import { MessageModule } from '@syncfusion/ej2-angular-notifications';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MessageModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginForm: FormGroup;
  resetPasswordForm: FormGroup;

  isForgotPasswordMode: boolean = false;

  notifications: NotificationMessage[] = [];
  message!: NotificationMessage;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    this.resetPasswordForm = this.fb.group({
      resetEmail: ['', [Validators.required, Validators.email]],
    });
  }
  onSubmit(): void {
    const { email, password } = this.loginForm.value;
    const { resetEmail } = this.resetPasswordForm.value;

    if (!this.isForgotPasswordMode) {
      this.authService.login(email, password).subscribe((result) => {
        if (result) {
          this.message = {
            id: 'msg_success',
            severity: 'Success',
            message: 'Login Successful',
          };
          this.notifications.push(this.message);
          this.router.navigate(['/dashboard']);
        } else {
          this.message = {
            id: 'msg_error',
            severity: 'Error',
            message: 'Login Failed. Invalid Credentials!!!',
          };
          this.notifications.push(this.message);
        }
      });
    }

    if (this.isForgotPasswordMode) {
      this.authService.resetPassword(resetEmail).subscribe((result) => {
        if (result) {
          this.message = {
            id: 'msg_success',
            severity: 'Success',
            message: 'Reset Email Successful',
          };
          this.notifications.push(this.message);
        } else {
          this.message = {
            id: 'msg_error',
            severity: 'Error',
            message:
              'Could not send reset email. Please make sure your email is correct!!!',
          };
          this.notifications.push(this.message);
        }
      });
    }
  }
}
