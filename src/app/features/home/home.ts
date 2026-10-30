import { AfterViewInit, Component, ElementRef, OnDestroy, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements AfterViewInit, OnDestroy {

  private readonly auth = inject(AuthService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private observer: IntersectionObserver | null = null;

  readonly isLoggedIn = this.auth.isLoggedIn;

  readonly dashboardLink = computed(() => {

    const role = this.auth.currentUser()?.role;

    if (role === 'Manager') return '/manager/dashboard';
    if (role === 'Admin') return '/admin';

    return '/worker/dashboard';

  });

  ngAfterViewInit(): void {

    const items = this.host.nativeElement.querySelectorAll<HTMLElement>('.reveal');

    if (typeof IntersectionObserver === 'undefined') {
      items.forEach(el => el.classList.add('in'));
      return;
    }

    this.observer = new IntersectionObserver(entries => {

      for (const entry of entries) {

        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add('in');
          this.observer?.unobserve(entry.target);
        }

      }

    }, { threshold: 0.15 });

    items.forEach(el => this.observer!.observe(el));

  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

}