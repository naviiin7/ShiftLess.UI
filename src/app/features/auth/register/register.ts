import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/requests/register-request';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {

  submitting = false;

  errorMessage = '';

  successMessage = '';

  registerForm;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {

    this.registerForm = this.fb.group({

      fullName: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.maxLength(100)
      ]),

      email: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.email
      ]),

      phone: this.fb.nonNullable.control('', [
        Validators.required
      ]),

      password: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.minLength(6)
      ]),

      confirmPassword: this.fb.nonNullable.control('', [
        Validators.required
      ]),

      isBusinessOwner: this.fb.nonNullable.control(false)

    });

  }

  register(): void {

    this.errorMessage = '';

    this.successMessage = '';

    if (this.registerForm.invalid) {

      this.registerForm.markAllAsTouched();

      return;

    }

    const { confirmPassword, ...formValue } =
      this.registerForm.getRawValue();

    if (formValue.password !== confirmPassword) {

      this.errorMessage = 'Passwords do not match.';

      return;

    }

    const request: RegisterRequest = {
      fullName: formValue.fullName,
      email: formValue.email,
      phone: formValue.phone,
      password: formValue.password,
      isBusinessOwner: formValue.isBusinessOwner
    };

    this.submitting = true;

    this.authService.register(request).subscribe({

      next: () => {

        this.submitting = false;

        this.successMessage =
          'Account created successfully. Redirecting to login...';

        setTimeout(() => {

          this.router.navigate(['/login']);

        }, 1200);

      },

      error: err => {

        this.submitting = false;

        this.errorMessage =
          err.error?.message ??
          'Unable to register. Please try again.';

      }

    });

  }

}