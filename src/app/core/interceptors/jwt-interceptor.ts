import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  catchError,
  filter,
  switchMap,
  take,
  throwError
} from 'rxjs';

import { AuthService } from '../services/auth.service';

let isRefreshing = false;

const refreshedToken$ = new BehaviorSubject<string | null>(null);

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();

  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  return next(authReq).pipe(

    catchError((error: unknown) => {

      const isAuthEndpoint =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/register') ||
        req.url.includes('/auth/refresh');

      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        !authService.isLoggedIn() ||
        isAuthEndpoint
      ) {

        return throwError(() => error);

      }

      if (isRefreshing) {

        // A refresh is already in flight — wait for it, then retry
        // this request with the new token instead of firing a
        // second, redundant refresh call.
        return refreshedToken$.pipe(
          filter(t => t !== null),
          take(1),
          switchMap(newToken => next(req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` }
          })))
        );

      }

      isRefreshing = true;
      refreshedToken$.next(null);

      return authService.refreshToken().pipe(

        switchMap(response => {

          authService.saveUser(response);

          isRefreshing = false;
          refreshedToken$.next(response.token);

          return next(req.clone({
            setHeaders: { Authorization: `Bearer ${response.token}` }
          }));

        }),

        catchError(refreshError => {

          isRefreshing = false;

          authService.logout();
          router.navigate(['/login']);

          return throwError(() => refreshError);

        })

      );

    })

  );

};