import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, throwError, firstValueFrom } from 'rxjs';
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

    // Another tab changed the stored session.
    //  - Different user, login or logout -> reload so this tab restarts
    //    cleanly instead of mixing state from two sessions.
    //  - Same user (just a token refresh)  -> silently adopt the new
    //    tokens, so this tab never uses an already-rotated refresh token.
    window.addEventListener('storage', (event: StorageEvent) => {

      if (event.key !== this.USER_KEY) {
        return;
      }

      if (event.newValue === event.oldValue) {
        return;
      }

      const oldIdentity = this.identityFromRaw(event.oldValue);
      const newIdentity = this.identityFromRaw(event.newValue);

      if (oldIdentity !== newIdentity) {

        window.location.reload();
        return;

      }

      const refreshed = this.parseUser(event.newValue);

      if (refreshed) {
        this._currentUser.set(refreshed);
      }

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

  isAccessTokenValid(): boolean {

    const token = this.getToken();

    if (!token) {
      return false;
    }

    return !this.isTokenExpired(token);

  }

  private parseUser(raw: string | null): LoginResponse | null {

    if (!raw) {
      return null;
    }

    try {

      return JSON.parse(raw) as LoginResponse;

    } catch {

      return null;

    }

  }

  /**
   * Stable identity of a stored session: the user id inside the JWT.
   * Returns null when logged out / unreadable. Two sessions of the same
   * user (different tokens after a refresh) give the same identity.
   */
  private identityFromRaw(raw: string | null): string | null {

    const user = this.parseUser(raw);

    if (!user?.token) {
      return null;
    }

    const payload = this.decodePayload(user.token);

    if (!payload) {
      return null;
    }

    const id =
      payload['nameid'] ??
      payload['sub'] ??
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

    return id !== undefined && id !== null ? String(id) : null;

  }

  private decodePayload(token: string): any | null {

    try {

      const payloadBase64 = token.split('.')[1];

      if (!payloadBase64) {
        return null;
      }

      const normalized = payloadBase64
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const padded = normalized.padEnd(
        normalized.length + (4 - (normalized.length % 4)) % 4,
        '='
      );

      return JSON.parse(atob(padded));

    } catch {

      return null;

    }

  }

  private isTokenExpired(token: string): boolean {

    const payload = this.decodePayload(token);

    if (!payload) {
      return true;
    }

    if (!payload.exp) {
      return false;
    }

    return Date.now() >= payload.exp * 1000;

  }

  private refreshInFlight: Promise<LoginResponse> | null = null;

  /**
   * Shared by the HTTP interceptor and the SignalR connection so only
   * one refresh call is ever in flight at a time. Refresh tokens
   * rotate server-side (each one is single-use), so two concurrent
   * refreshes would get the second one rejected as already-revoked.
   *
   * The refresh response is merged over the existing user, so profile
   * fields (name, email, ...) survive even if the refresh endpoint
   * doesn't send them back.
   */
  ensureFreshToken(): Promise<LoginResponse> {

    if (this.refreshInFlight) {

      return this.refreshInFlight;

    }

    this.refreshInFlight = firstValueFrom(this.refreshToken())
      .then(response => {

        const previous = this._currentUser();

        const received = Object.fromEntries(
          Object.entries(response ?? {}).filter(
            ([, value]) => value !== null && value !== undefined && value !== ''
          )
        ) as Partial<LoginResponse>;

        const merged = { ...(previous ?? {}), ...received } as LoginResponse;

        this.saveUser(merged);

        this.refreshInFlight = null;

        return merged;

      })
      .catch(err => {

        this.refreshInFlight = null;

        throw err;

      });

    return this.refreshInFlight;

  }

}