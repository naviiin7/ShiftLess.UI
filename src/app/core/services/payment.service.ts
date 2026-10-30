import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';

import { ApiResponse } from '../models/responses/api-response';
import { MessageResponse } from '../models/responses/message-response';
import {
  CardPaymentRequest,
  CardPaymentResponse,
  CreateOrderResponse,
  VerifyPaymentRequest
} from '../models/payment.model';

declare const Razorpay: any;

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) { }

  payWithCard(
    taskId: number,
    request: CardPaymentRequest
  ): Observable<CardPaymentResponse> {

    return this.http
      .post<ApiResponse<CardPaymentResponse>>(
        `${this.api}/payments/tasks/${taskId}/pay`,
        request
      )
      .pipe(map(response => response.data));

  }

  // ---- Razorpay flow (parked) ----

  createOrder(taskId: number): Observable<CreateOrderResponse> {

    return this.http
      .post<ApiResponse<CreateOrderResponse>>(`${this.api}/payments/tasks/${taskId}/order`, {})
      .pipe(map(response => response.data));

  }

  verifyPayment(request: VerifyPaymentRequest): Observable<MessageResponse> {

    return this.http
      .post<ApiResponse<MessageResponse>>(`${this.api}/payments/verify`, request)
      .pipe(map(response => response.data));

  }

  openCheckout(
    order: CreateOrderResponse,
    taskTitle: string,
    onSuccess: (paymentId: string, orderId: string, signature: string) => void,
    onDismiss: () => void
  ): void {

    const options = {
      key: order.razorpayKeyId,
      amount: order.amountInPaise,
      currency: order.currency,
      name: 'ShiftLess',
      description: `Payment for "${taskTitle}"`,
      order_id: order.razorpayOrderId,
      handler: (response: any) => {

        onSuccess(
          response.razorpay_payment_id,
          response.razorpay_order_id,
          response.razorpay_signature
        );

      },
      modal: {
        ondismiss: onDismiss
      },
      theme: {
        color: '#0d6efd'
      }
    };

    const razorpayInstance = new Razorpay(options);

    razorpayInstance.open();

  }

}