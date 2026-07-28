import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {

    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });

  }

  if (authService.getRole() === 'Admin') {
    return true;
  }

  return router.createUrlTree(['/']);

};