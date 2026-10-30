export interface CreateOrderResponse {

  razorpayOrderId: string;

  razorpayKeyId: string;

  amountInPaise: number;

  currency: string;

}

export interface VerifyPaymentRequest {

  razorpayOrderId: string;

  razorpayPaymentId: string;

  razorpaySignature: string;

}

export interface CardPaymentRequest {

  cardholderName: string;

  cardNumber: string;

  expiryMonth: number;

  expiryYear: number;

  cvv: string;

}

export interface CardPaymentResponse {

  message: string;

  transactionId: string;

  amount: number;

}export interface CreateOrderResponse {

  razorpayOrderId: string;

  razorpayKeyId: string;

  amountInPaise: number;

  currency: string;

}

export interface VerifyPaymentRequest {

  razorpayOrderId: string;

  razorpayPaymentId: string;

  razorpaySignature: string;

}

export interface CardPaymentRequest {

  cardholderName: string;

  cardNumber: string;

  expiryMonth: number;

  expiryYear: number;

  cvv: string;

}

export interface CardPaymentResponse {

  message: string;

  transactionId: string;

  amount: number;

}