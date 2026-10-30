import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

interface NavLink {
  label: string;
  path: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoggedIn = this.auth.isLoggedIn;

  readonly menuOpen = signal(false);

  readonly roleLabel = computed(() => {

    const role = this.auth.currentUser()?.role;

    if (role === 'Manager') return 'Manager';
    if (role === 'Admin') return 'Admin';

    return 'Worker';

  });

  /** First name for the "Hi, ..." greeting. */
  readonly displayName = computed(() => {

    const user: any = this.auth.currentUser();

    if (!user) {
      return '';
    }

    const full = String(
      user.fullName ?? user.name ?? user.userName ?? user.username ?? ''
    ).trim();

    if (full) {
      return full.split(/\s+/)[0];
    }

    const email: string =
      user.email ?? this.claimFromToken(user.token, 'email') ?? '';

    return email ? email.split('@')[0] : '';

  });

  readonly links = computed<NavLink[]>(() => {

    if (!this.isLoggedIn()) {
      return [];
    }

    const role = this.auth.currentUser()?.role;

    if (role === 'Manager') {
      return [
        { label: 'Dashboard', path: '/manager/dashboard' },
        { label: 'Create Task', path: '/manager/create-task' },
        { label: 'My Tasks', path: '/manager/my-tasks' },
        { label: 'Applicants', path: '/manager/applicants' }
      ];
    }

    if (role === 'Admin') {
      return [{ label: 'Admin', path: '/admin' }];
    }

    return [
      { label: 'Dashboard', path: '/worker/dashboard' },
      { label: 'Open Tasks', path: '/worker/open-tasks' },
      { label: 'My Tasks', path: '/worker/my-tasks' }
    ];

  });

  toggleMenu(): void {
    this.menuOpen.update(open => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {

    this.closeMenu();

    this.auth.logout();

    this.router.navigate(['/login']);

  }

  private claimFromToken(token: string | undefined, name: string): string | null {

    try {

      const part = (token ?? '').split('.')[1];

      if (!part) {
        return null;
      }

      const normalized = part.replace(/-/g, '+').replace(/_/g, '/');

      const padded = normalized.padEnd(
        normalized.length + (4 - (normalized.length % 4)) % 4,
        '='
      );

      const payload = JSON.parse(atob(padded));

      return payload[name] ??
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ??
        null;

    } catch {

      return null;

    }

  }

}