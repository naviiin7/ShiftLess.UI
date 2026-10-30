import { Component, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { OtpService } from '../../../core/services/otp.service';
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
export class Register implements OnDestroy {

  submitting = false;

  sendingOtp = false;

  otpSent = false;

  resendIn = 0;

  errorMessage = '';

  infoMessage = '';

  successMessage = '';

  private timer: ReturnType<typeof setInterval> | null = null;

  registerForm;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private otpService: OtpService,
    private router: Router,
    private cdr: ChangeDetectorRef
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

      otpCode: this.fb.nonNullable.control('', [
        Validators.pattern(/^\d{6}$/)
      ]),

      phone: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.pattern(/^\+?[0-9]{10,15}$/)
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

    // Changing the email after a code was sent invalidates that code.
    this.registerForm.controls.email.valueChanges.subscribe(() => {

      if (!this.otpSent) {
        return;
      }

      this.otpSent = false;
      this.infoMessage = '';
      this.registerForm.controls.otpCode.reset('');
      this.stopCooldown();
      this.cdr.detectChanges();

    });

  }

  ngOnDestroy(): void {

    this.stopCooldown();

  }

  sendOtp(): void {

    this.errorMessage = '';
    this.infoMessage = '';

    const emailControl = this.registerForm.controls.email;

    if (emailControl.invalid) {

      emailControl.markAsTouched();

      return;

    }

    const email = emailControl.value.trim();

    this.sendingOtp = true;

    this.otpService.sendRegistrationOtp(email).subscribe({

      next: response => {

        this.sendingOtp = false;

        this.otpSent = true;

        this.infoMessage = response.debugCode
          ? `Demo mode: no email is actually sent. Your code is ${response.debugCode}.`
          : `We emailed a 6-digit code to ${email}. It expires in ` +
            `${Math.round(response.expiresInSeconds / 60)} minutes. ` +
            `Check your spam folder if you don't see it.`;

        this.startCooldown(response.resendAfterSeconds);

        this.cdr.detectChanges();

      },

      error: err => {

        this.sendingOtp = false;

        this.errorMessage =
          err.error?.message ??
          'Unable to send the verification code.';

        this.cdr.detectChanges();

      }

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

    if (!this.otpSent) {

      this.errorMessage = 'Verify your email first: click "Send code".';

      return;

    }

    if (!/^\d{6}$/.test(formValue.otpCode)) {

      this.errorMessage = 'Enter the 6-digit verification code.';

      return;

    }

    if (formValue.password !== confirmPassword) {

      this.errorMessage = 'Passwords do not match.';

      return;

    }

    const request: RegisterRequest = {
      fullName: formValue.fullName,
      email: formValue.email.trim(),
      phone: formValue.phone,
      password: formValue.password,
      isBusinessOwner: formValue.isBusinessOwner,
      otpCode: formValue.otpCode
    };

    this.submitting = true;

    this.authService.register(request).subscribe({

      next: () => {

        this.submitting = false;

        this.successMessage =
          'Account created successfully. Redirecting to login...';

        this.cdr.detectChanges();

        setTimeout(() => {

          this.router.navigate(['/login']);

        }, 1200);

      },

      error: err => {

        this.submitting = false;

        this.errorMessage =
          err.error?.message ??
          'Unable to register. Please try again.';

        this.cdr.detectChanges();

      }

    });

  }

  private startCooldown(seconds: number): void {

    this.stopCooldown();

    this.resendIn = seconds;

    this.timer = setInterval(() => {

      this.resendIn = Math.max(0, this.resendIn - 1);

      if (this.resendIn === 0) {
        this.stopCooldown();
      }

      this.cdr.detectChanges();

    }, 1000);

  }

  private stopCooldown(): void {

    if (this.timer) {

      clearInterval(this.timer);

      this.timer = null;

    }

    this.resendIn = 0;

  }

}