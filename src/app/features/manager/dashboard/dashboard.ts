import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { ChatWidget } from '../../../shared/components/chat-widget/chat-widget';
import { Conversation, ConversationService } from '../../../core/services/conversation.service';
import { RealtimeService } from '../../../core/services/realtime.service';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [RouterLink, ChatWidget],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

  private readonly conversationService = inject(ConversationService);
  private readonly realtime = inject(RealtimeService);

  readonly loading = signal(true);
  readonly error = signal('');

  readonly conversations = signal<Conversation[]>([]);
  readonly selectedId = signal<number | null>(null);

  /** taskId -> unread count (counted while this page is open). */
  readonly unread = signal<Record<number, number>>({});

  readonly sorted = computed(() =>
    [...this.conversations()].sort((a, b) =>
      this.time(b) - this.time(a) || a.taskTitle.localeCompare(b.taskTitle))
  );

  readonly selected = computed(() =>
    this.conversations().find(c => c.taskId === this.selectedId()) ?? null
  );

  /**
   * A 0/1 item list used with @for so the chat widget is re-created
   * whenever the selected conversation changes (it loads in ngOnInit).
   */
  readonly selectedAsList = computed(() => {
    const s = this.selected();
    return s ? [s] : [];
  });

  readonly totalUnread = computed(() =>
    Object.values(this.unread()).reduce((sum, n) => sum + n, 0)
  );

  constructor() {

    this.realtime.notifications$
      .pipe(takeUntilDestroyed())
      .subscribe(n => {

        if (n.type === 'ChatMessage') {
          this.onChatNotification(n.payload);
        }

      });

  }

  ngOnInit(): void {
    this.load(true);
  }

  load(showSpinner: boolean): void {

    if (showSpinner) {
      this.loading.set(true);
    }

    this.conversationService.getConversations().subscribe({

      next: list => {
        this.conversations.set(list);
        this.error.set('');
        this.loading.set(false);
      },

      error: err => {
        const status = err?.status ? ` (HTTP ${err.status})` : '';
        this.error.set(`Could not load your conversations${status}.`);
        this.loading.set(false);
      }

    });

  }

  select(conversation: Conversation): void {

    this.selectedId.set(conversation.taskId);

    this.unread.update(u => {
      const { [conversation.taskId]: _removed, ...rest } = u;
      return rest;
    });

  }

  back(): void {
    this.selectedId.set(null);
  }

  private onChatNotification(payload: any): void {

    const taskId = Number(payload?.taskId);

    if (!taskId) {
      return;
    }

    const list = this.conversations();
    const index = list.findIndex(c => c.taskId === taskId);

    if (index === -1) {

      // A conversation we haven't listed yet (first message / new worker).
      this.load(false);

    } else {

      const updated = [...list];

      updated[index] = {
        ...updated[index],
        lastMessageSender: payload.senderName ?? null,
        lastMessageText: payload.text ?? null,
        lastMessageAt: new Date().toISOString()
      };

      this.conversations.set(updated);

    }

    if (this.selectedId() !== taskId) {
      this.unread.update(u => ({ ...u, [taskId]: (u[taskId] ?? 0) + 1 }));
    }

  }

  // ---------------- template helpers ----------------

  initials(title: string): string {

    const words = title.trim().split(/\s+/).filter(Boolean);

    return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?';

  }

  statusLabel(status: string): string {
    return status === 'Full' ? 'Assigned' : status;
  }

  preview(c: Conversation): string {

    if (!c.lastMessageText) {
      return 'No messages yet';
    }

    const text = c.lastMessageText.length > 48
      ? c.lastMessageText.slice(0, 48) + '…'
      : c.lastMessageText;

    return c.lastMessageSender ? `${c.lastMessageSender}: ${text}` : text;

  }

  when(iso: string | null): string {

    if (!iso) {
      return '';
    }

    const d = this.parse(iso);
    const now = new Date();

    return d.toDateString() === now.toDateString()
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { day: 'numeric', month: 'short' });

  }

  private time(c: Conversation): number {
    return c.lastMessageAt ? this.parse(c.lastMessageAt).getTime() : 0;
  }

  /** The API sends UTC; add the Z if the serializer left it off. */
  private parse(iso: string): Date {
    return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : iso + 'Z');
  }

}