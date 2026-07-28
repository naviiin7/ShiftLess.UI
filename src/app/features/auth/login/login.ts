import { Component, ChangeDetectorRef } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/requests/login-request';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  submitting = false;

  errorMessage = '';

  loginForm;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {

    this.loginForm = this.fb.group({

      email: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.email
      ]),

      password: this.fb.nonNullable.control('', [
        Validators.required
      ])

    });

  }

  login(): void {

    this.errorMessage = '';

    if (this.loginForm.invalid) {

      this.loginForm.markAllAsTouched();

      return;

    }

    const request: LoginRequest = {
      email: this.loginForm.controls.email.value,
      password: this.loginForm.controls.password.value
    };

    this.submitting = true;

    this.authService.login(request).subscribe({

      next: (response) => {

        this.authService.saveUser(response);

        this.submitting = false;

        switch (response.role) {

          case 'Admin':
            this.router.navigate(['/admin']);
            break;

          case 'Manager':
            this.router.navigate(['/manager/dashboard']);
            break;

          default:
            this.router.navigate(['/worker/dashboard']);
            break;
        }

      },

      error: (err) => {

        // Always reset submitting state and force a render —
        // this is what was leaving the form stuck after a
        // failed login attempt.
        this.submitting = false;

        this.errorMessage =
          err.error?.message ??
          'Invalid email or password.';

        this.cdr.detectChanges();

      }

    });

  }

}