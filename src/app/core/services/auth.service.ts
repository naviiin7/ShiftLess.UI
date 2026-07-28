import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';

import { LoginRequest } from '../models/requests/login-request';
import { LoginResponse } from '../models/responses/login-response';
import { RegisterRequest } from '../models/requests/register-request';
import { RefreshTokenRequest } from '../models/requests/refresh-token-request';
import { ApiResponse } from '../models/responses/api-response';
import { MessageResponse } from '../models/responses/message-response';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly api = environment.apiUrl;

  private readonly USER_KEY = 'currentUser';

  private readonly _currentUser = signal<LoginResponse | null>(
    this.loadUser()
  );

  readonly currentUser = this._currentUser.asReadonly();

  readonly isLoggedIn = computed(
    () => this._currentUser() !== null
  );

  constructor(
    private http: HttpClient
  ) {

    // Another tab logged in as a different user, or logged out.
    // Reloading is deliberate here rather than just re-syncing the
    // signal — this guarantees every component's in-flight data,
    // guards, and in-memory state all restart clean instead of
    // mixing state from two different sessions.
    window.addEventListener('storage', (event: StorageEvent) => {

      if (event.key !== this.USER_KEY) {
        return;
      }

      if (event.newValue === event.oldValue) {
        return;
      }

      window.location.reload();

    });

  }

  login(request: LoginRequest): Observable<LoginResponse> {

    return this.http
      .post<ApiResponse<LoginResponse>>(
        `${this.api}/auth/login`,
        request
      )
      .pipe(
        map(response => response.data)
      );

  }

  register(request: RegisterRequest): Observable<MessageResponse> {

    return this.http
      .post<ApiResponse<MessageResponse>>(
        `${this.api}/auth/register`,
        request
      )
      .pipe(
        map(response => response.data)
      );

  }

  refreshToken(): Observable<LoginResponse> {

    const currentRefreshToken =
      this._currentUser()?.refreshToken;

    if (!currentRefreshToken) {

      return throwError(
        () => new Error('No refresh token available.')
      );

    }

    const request: RefreshTokenRequest = {
      refreshToken: currentRefreshToken
    };

    return this.http
      .post<ApiResponse<LoginResponse>>(
        `${this.api}/auth/refresh`,
        request
      )
      .pipe(
        map(response => response.data)
      );

  }

  saveUser(user: LoginResponse): void {

    localStorage.setItem(
      this.USER_KEY,
      JSON.stringify(user)
    );

    this._currentUser.set(user);

  }

  logout(): void {

    localStorage.removeItem(this.USER_KEY);

    this._currentUser.set(null);

  }

  getCurrentUser(): LoginResponse | null {

    return this._currentUser();

  }

  getToken(): string {

    return this._currentUser()?.token ?? '';

  }

  getRole(): string {

    return this._currentUser()?.role ?? '';

  }

  private loadUser(): LoginResponse | null {

    const data = localStorage.getItem(this.USER_KEY);

    if (!data) {
      return null;
    }

    let user: LoginResponse;

    try {

      user = JSON.parse(data) as LoginResponse;

    } catch {

      localStorage.removeItem(this.USER_KEY);
      return null;

    }

    if (!user?.token || this.isTokenExpired(user.token)) {

      if (!user?.refreshToken) {

        localStorage.removeItem(this.USER_KEY);
        return null;

      }

    }

    return user;

  }

  private isTokenExpired(token: string): boolean {

    try {

      const payloadBase64 = token.split('.')[1];

      if (!payloadBase64) {
        return true;
      }

      const normalized = payloadBase64
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const padded = normalized.padEnd(
        normalized.length + (4 - (normalized.length % 4)) % 4,
        '='
      );

      const payload = JSON.parse(atob(padded));

      if (!payload.exp) {
        return false;
      }

      return Date.now() >= payload.exp * 1000;

    } catch {

      return true;

    }

  }

}