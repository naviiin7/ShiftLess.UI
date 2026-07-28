import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NavigationEnd,
  Router,
  RouterLink
} from '@angular/router';

import { filter } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {

  currentUrl = '';

  readonly homeLink = computed(() => {

    if (!this.authService.isLoggedIn()) {
      return '/';
    }

    switch (this.authService.getRole()) {

      case 'Admin':
        return '/admin';

      case 'Manager':
        return '/manager/dashboard';

      default:
        return '/worker/dashboard';

    }

  });

  constructor(
    public authService: AuthService,
    private router: Router
  ) {

    this.currentUrl = this.router.url;

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {

        this.currentUrl = this.router.url;

      });

  }

  logout(): void {

    this.authService.logout();

    this.router.navigate(['/login']);

  }

}