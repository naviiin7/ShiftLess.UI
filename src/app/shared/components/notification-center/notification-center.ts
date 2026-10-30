import { Component, ChangeDetectorRef, effect, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationData, RealtimeService } from '../../../core/services/realtime.service';

interface ToastItem {
  id: number;
  title: string;
  body: string;
  link?: string[];
}

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-center.html',
  styleUrl: './notification-center.scss'
})
export class NotificationCenter {

  toasts: ToastItem[] = [];

  private nextId = 1;

  constructor(
    private authService: AuthService,
    private realtimeService: RealtimeService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {

    // One subscription for the lifetime of the component. The service
    // emits here no matter how many times the connection is rebuilt.
    this.realtimeService.notifications$
      .pipe(takeUntilDestroyed())
      .subscribe(data => this.show(data));

    // Connection follows login state: start on login, stop on logout.
    effect(() => {

      const loggedIn = this.authService.isLoggedIn();

      untracked(() => {

        if (loggedIn) {

          this.requestBrowserPermission();

          void this.realtimeService.start();

        } else {

          void this.realtimeService.stop();

          this.toasts = [];

          this.cdr.detectChanges();

        }

      });

    });

  }

  private show(data: NotificationData): void {

    // Already looking at this chat: the live message list shows it,
    // so a toast would just be noise.
    if (
      data.type === 'ChatMessage' &&
      this.realtimeService.isViewingTask(data.payload?.taskId)
    ) {
      return;
    }

    const { title, body, link } = this.formatNotification(data);

    const toast: ToastItem = { id: this.nextId++, title, body, link };

    this.toasts = [...this.toasts, toast];

    // SignalR callbacks run outside Angular's change detection.
    this.cdr.detectChanges();

    this.showBrowserNotification(toast);

    setTimeout(() => {

      this.dismiss(toast.id);

    }, 6000);

  }

  private formatNotification(
    data: NotificationData
  ): { title: string; body: string; link?: string[] } {

    switch (data.type) {

      case 'ChatMessage':
        return {
          title: data.payload.taskTitle ?? 'New message',
          body: `${data.payload.senderName}: ${this.preview(data.payload.text)}`,
          link: this.chatLink()
        };

      case 'ApplicationAccepted':
        return {
          title: 'Application accepted',
          body: `You've been accepted for "${data.payload.taskTitle}".`,
          link: ['/worker/my-tasks']
        };

      case 'ApplicationRejected':
        return {
          title: 'Application update',
          body: `Your application for "${data.payload.taskTitle}" wasn't accepted.`,
          link: ['/worker/open-tasks']
        };

      case 'TaskCompleted':
        return {
          title: 'Task completed',
          body: `"${data.payload.taskTitle}" has been marked complete.`,
          link: ['/worker/my-tasks']
        };

      case 'WorkerLeft':
        return {
          title: 'Worker left',
          body: `Someone left "${data.payload.taskTitle}". It's open again.`,
          link: ['/manager/dashboard']
        };

      case 'NewApplicant':
        return {
          title: 'New applicant',
          body: `Someone applied to "${data.payload.taskTitle}".`,
          link: ['/manager/applicants']
        };

      default:
        return { title: 'Notification', body: 'You have a new update.' };

    }

  }

  /** Where a chat toast should take the user. Adjust to your chat route. */
  private chatLink(): string[] {

    return this.authService.getRole() === 'Manager'
      ? ['/manager/dashboard']
      : ['/worker/my-tasks'];

  }

  private preview(text: string | undefined): string {

    const value = (text ?? '').trim();

    return value.length > 80 ? value.slice(0, 80) + '…' : value;

  }

  // ---------------------------------------------------------
  // Browser (desktop) notifications, shown only when the tab
  // is in the background.
  // ---------------------------------------------------------

  private requestBrowserPermission(): void {

    if ('Notification' in window && Notification.permission === 'default') {

      void Notification.requestPermission();

    }

  }

  private showBrowserNotification(toast: ToastItem): void {

    if (
      !('Notification' in window) ||
      Notification.permission !== 'granted' ||
      !document.hidden
    ) {
      return;
    }

    const notification = new Notification(toast.title, { body: toast.body });

    notification.onclick = () => {

      window.focus();

      if (toast.link) {
        this.router.navigate(toast.link);
      }

      notification.close();

    };

  }

  dismiss(id: number): void {

    this.toasts = this.toasts.filter(t => t.id !== id);

    this.cdr.detectChanges();

  }

  open(toast: ToastItem): void {

    if (toast.link) {
      this.router.navigate(toast.link);
    }

    this.dismiss(toast.id);

  }

}