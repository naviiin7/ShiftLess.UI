import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly year = new Date().getFullYear();

  readonly isLoggedIn = this.auth.isLoggedIn;

  readonly dashboardLink = computed(() => {

    const role = this.auth.currentUser()?.role;

    if (role === 'Manager') return '/manager/dashboard';
    if (role === 'Admin') return '/admin';

    return '/worker/dashboard';

  });

  logout(): void {

    this.auth.logout();

    this.router.navigate(['/login']);

  }

}