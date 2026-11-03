import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Same rules as the API: 8+ characters with an uppercase letter, a lowercase letter and a number. */
export const strongPassword: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {

  const value: string = control.value ?? '';

  if (!value) {
    return null; // `required` reports an empty field
  }

  const missing: string[] = [];

  if (value.length < 8) missing.push('at least 8 characters');
  if (!/[A-Z]/.test(value)) missing.push('an uppercase letter');
  if (!/[a-z]/.test(value)) missing.push('a lowercase letter');
  if (!/[0-9]/.test(value)) missing.push('a number');

  return missing.length ? { strongPassword: missing } : null;

};

/** Email check that tolerates the trailing space mobile keyboards add. */
export const trimmedEmail: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {

  const value: string = (control.value ?? '').trim();

  if (!value) {
    return null; // `required` reports an empty field
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : { email: true };

};

/** Removes spaces, dashes, dots and brackets people type inside phone numbers. */
export function cleanPhone(value: string): string {
  return (value ?? '').replace(/[\s\-().]/g, '');
}

/** 10 to 15 digits, optional leading +; separators are ignored. */
export const phoneNumber: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {

  const value: string = control.value ?? '';

  if (!value) {
    return null; // `required` reports an empty field
  }

  return /^\+?\d{10,15}$/.test(cleanPhone(value)) ? null : { phoneNumber: true };

};

/** Picks the most helpful message out of an API error. */
export function apiErrorMessage(err: any, fallback: string): string {

  // Status 0: the browser never got an answer (offline, or the free-tier
  // server is still waking up).
  if (err?.status === 0) {
    return 'Cannot reach the server right now. It may be waking up, ' +
      'so please wait a few seconds and try again.';
  }

  const details = err?.error?.errors;

  if (Array.isArray(details) && details.length > 0) {
    return details.join(' ');
  }

  return err?.error?.message || fallback;

}