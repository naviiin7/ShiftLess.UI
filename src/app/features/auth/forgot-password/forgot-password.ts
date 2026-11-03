import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { PasswordResetService } from '../../../core/services/password-reset.service';
import {
  apiErrorMessage,
  strongPassword,
  trimmedEmail
} from '../../../core/validators/auth-validators';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html'
})
export class ForgotPassword implements OnDestroy {

  /** 1 = enter email, 2 = enter code + new password */
  step: 1 | 2 = 1;

  sending = false;

  submitting = false;

  resendIn = 0;

  errorMessage = '';

  infoMessage = '';

  successMessage = '';

  private timer: ReturnType<typeof setInterval> | null = null;

  form;

  constructor(
    private fb: FormBuilder,
    private passwordReset: PasswordResetService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {

    this.form = this.fb.group({

      email: this.fb.nonNullable.control('', [
        Validators.required,
        trimmedEmail
      ]),

      otpCode: this.fb.nonNullable.control('', [
        Validators.pattern(/^\d{6}$/)
      ]),

      newPassword: this.fb.nonNullable.control('', [
        Validators.required,
        strongPassword
      ]),

      confirmPassword: this.fb.nonNullable.control('', [
        Validators.required
      ])

    });

  }

  ngOnDestroy(): void {

    this.stopCooldown();

  }

  sendCode(): void {

    this.errorMessage = '';
    this.infoMessage = '';

    const emailControl = this.form.controls.email;

    if (emailControl.invalid) {

      emailControl.markAsTouched();

      return;

    }

    const email = emailControl.value.trim().toLowerCase();

    this.sending = true;

    this.passwordReset.sendCode(email).subscribe({

      next: response => {

        this.sending = false;

        this.step = 2;

        this.infoMessage = response.debugCode
          ? `Demo mode: no email is actually sent. Your code is ${response.debugCode}.`
          : `If an account exists for ${email}, we've emailed a 6-digit code. ` +
            `It expires in ${Math.round(response.expiresInSeconds / 60)} minutes. ` +
            `Check your spam folder if you don't see it.`;

        this.startCooldown(response.resendAfterSeconds);

        this.cdr.detectChanges();

      },

      error: err => {

        this.sending = false;

        this.errorMessage =
          apiErrorMessage(err, 'Unable to send the reset code.');

        this.cdr.detectChanges();

      }

    });

  }

  changeEmail(): void {

    this.step = 1;
    this.errorMessage = '';
    this.infoMessage = '';
    this.form.controls.otpCode.reset('');
    this.stopCooldown();

  }

  reset(): void {

    this.errorMessage = '';

    const { email, otpCode, newPassword, confirmPassword } =
      this.form.getRawValue();

    if (!/^\d{6}$/.test(otpCode.trim())) {

      this.errorMessage = 'Enter the 6-digit code from the email.';

      return;

    }

    if (this.form.controls.newPassword.invalid) {

      this.form.controls.newPassword.markAsTouched();

      return;

    }

    if (newPassword !== confirmPassword) {

      this.errorMessage = 'Passwords do not match.';

      return;

    }

    this.submitting = true;

    this.passwordReset.reset({
      email: email.trim().toLowerCase(),
      otpCode: otpCode.trim(),
      newPassword
    }).subscribe({

      next: () => {

        this.submitting = false;

        this.successMessage =
          'Password updated. Redirecting to login...';

        this.cdr.detectChanges();

        setTimeout(() => this.router.navigate(['/login']), 1500);

      },

      error: err => {

        this.submitting = false;

        this.errorMessage =
          apiErrorMessage(err, 'Unable to reset the password.');

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