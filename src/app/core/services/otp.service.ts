import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';

import { ApiResponse } from '../models/responses/api-response';
import { SendOtpResponse } from '../models/responses/send-otp-response';

@Injectable({
  providedIn: 'root'
})
export class OtpService {

  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) { }

  sendRegistrationOtp(email: string): Observable<SendOtpResponse> {

    return this.http
      .post<ApiResponse<SendOtpResponse>>(
        `${this.api}/auth/register/send-otp`,
        { email }
      )
      .pipe(map(response => response.data));

  }

}