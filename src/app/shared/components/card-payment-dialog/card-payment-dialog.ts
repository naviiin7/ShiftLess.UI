import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';

import { PaymentService } from '../../../core/services/payment.service';

interface TestCard {
  number: string;
  outcome: string;
}

function cardNumberValidator(control: AbstractControl): ValidationErrors | null {

  const digits = String(control.value ?? '').replace(/\D/g, '');

  if (digits.length < 13 || digits.length > 19) {
    return { cardNumber: true };
  }

  let sum = 0;
  let alternate = false;

  for (let i = digits.length - 1; i >= 0; i--) {

    let n = Number(digits[i]);

    if (alternate) {

      n *= 2;

      if (n > 9) {
        n -= 9;
      }

    }

    sum += n;
    alternate = !alternate;

  }

  return sum % 10 === 0 ? null : { cardNumber: true };

}

@Component({
  selector: 'app-card-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './card-payment-dialog.html',
  styleUrl: './card-payment-dialog.scss'
})
export class CardPaymentDialog {

  @Input({ required: true }) taskId!: number;

  @Input({ required: true }) taskTitle!: string;

  @Input({ required: true }) amount!: number;

  @Output() paid = new EventEmitter<string>();

  @Output() closed = new EventEmitter<void>();

  readonly testCards: TestCard[] = [
    { number: '4242 4242 4242 4242', outcome: 'Success' },
    { number: '4000 0000 0000 0002', outcome: 'Declined' },
    { number: '4000 0000 0000 9995', outcome: 'Insufficient funds' },
    { number: '4000 0000 0000 0069', outcome: 'Expired card' },
    { number: '4000 0000 0000 0127', outcome: 'Wrong security code' }
  ];

  processing = false;

  success = false;

  transactionId = '';

  errorMessage = '';

  private finished = false;

  form;

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private cdr: ChangeDetectorRef
  ) {

    this.form = this.fb.nonNullable.group({

      cardholderName: [
        '',
        [Validators.required, Validators.maxLength(60)]
      ],

      cardNumber: [
        '',
        [Validators.required, cardNumberValidator]
      ],

      expiry: [
        '',
        [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]
      ],

      cvv: [
        '',
        [Validators.required, Validators.pattern(/^\d{3,4}$/)]
      ]

    });

  }

  @HostListener('document:keydown.escape')
  onEscape(): void {

    this.close();

  }

  onCardNumberInput(event: Event): void {

    const input = event.target as HTMLInputElement;

    const digits = input.value.replace(/\D/g, '').slice(0, 19);

    this.form.controls.cardNumber.setValue(
      digits.replace(/(.{4})/g, '$1 ').trim()
    );

  }

  onExpiryInput(event: Event): void {

    const input = event.target as HTMLInputElement;

    const digits = input.value.replace(/\D/g, '').slice(0, 4);

    this.form.controls.expiry.setValue(
      digits.length > 2
        ? `${digits.slice(0, 2)}/${digits.slice(2)}`
        : digits
    );

  }

  fillTestCard(card: TestCard): void {

    this.errorMessage = '';

    this.form.patchValue({
      cardholderName: 'Test User',
      cardNumber: card.number,
      expiry: '12/34',
      cvv: '123'
    });

  }

  submit(): void {

    if (this.processing || this.success) {
      return;
    }

    this.errorMessage = '';

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;

    }

    const value = this.form.getRawValue();

    const [month, year] = value.expiry.split('/');

    this.processing = true;

    this.paymentService.payWithCard(this.taskId, {
      cardholderName: value.cardholderName.trim(),
      cardNumber: value.cardNumber.replace(/\s/g, ''),
      expiryMonth: Number(month),
      expiryYear: 2000 + Number(year),
      cvv: value.cvv
    }).subscribe({

      next: response => {

        this.processing = false;

        this.success = true;

        this.transactionId = response.transactionId;

        this.cdr.detectChanges();

        setTimeout(() => this.finish(), 1800);

      },

      error: err => {

        this.processing = false;

        this.errorMessage =
          err.error?.message ??
          'Payment failed. Please try again.';

        this.cdr.detectChanges();

      }

    });

  }

  finish(): void {

    if (this.finished) {
      return;
    }

    this.finished = true;

    this.paid.emit(this.transactionId);

  }

  close(): void {

    if (this.processing) {
      return;
    }

    if (this.success) {

      this.finish();

      return;

    }

    this.closed.emit();

  }

}