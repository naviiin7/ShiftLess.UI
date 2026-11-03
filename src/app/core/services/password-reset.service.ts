import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';

import { ApiResponse } from '../models/responses/api-response';
import { MessageResponse } from '../models/responses/message-response';
import { SendOtpResponse } from '../models/responses/send-otp-response';

export interface ResetPasswordRequest {
  email: string;
  otpCode: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class PasswordResetService {

  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) { }

  sendCode(email: string): Observable<SendOtpResponse> {

    return this.http
      .post<ApiResponse<SendOtpResponse>>(
        `${this.api}/auth/forgot-password/send-otp`,
        { email }
      )
      .pipe(map(response => response.data));

  }

  reset(request: ResetPasswordRequest): Observable<MessageResponse> {

    return this.http
      .post<ApiResponse<MessageResponse>>(
        `${this.api}/auth/forgot-password/reset`,
        request
      )
      .pipe(map(response => response.data));

  }

}