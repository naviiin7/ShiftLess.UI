import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';

export const managerGuard: CanActivateFn = (route, state) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {

    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });

  }

  const role = authService.getRole();

  if (role === 'Manager' || role === 'Admin') {
    return true;
  }

  return router.createUrlTree(['/']);

};