import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { RealtimeService } from '../../../core/services/realtime.service';
import { ChatMessageModel } from '../../../core/models/chat-message.model';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.scss'
})
export class ChatWidget implements OnInit, OnChanges, OnDestroy {

  @Input({ required: true }) taskId!: number;

  messages: ChatMessageModel[] = [];

  draft = '';

  loading = true;

  sending = false;

  errorMessage = '';

  private messageHandler = (msg: ChatMessageModel) => {

    if (!this.messages.some(m => m.messageId === msg.messageId)) {

      this.messages = [...this.messages, msg];
      this.cdr.detectChanges();

    }

  };

  private reconnectedHandler = () => {

    this.realtimeService.joinTaskGroup(this.taskId);

  };

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private realtimeService: RealtimeService,
    private cdr: ChangeDetectorRef
  ) { }

  get currentUserId(): number {

    return this.authService.currentUser()?.userId ?? 0;

  }

  async ngOnInit(): Promise<void> {

    this.load();

    const connection = await this.realtimeService.ensureConnected();

    connection.on('ReceiveMessage', this.messageHandler);

    connection.onreconnected(this.reconnectedHandler);

    await this.realtimeService.joinTaskGroup(this.taskId);

  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {

    if (changes['taskId'] && !changes['taskId'].firstChange) {

      await this.realtimeService.leaveTaskGroup(changes['taskId'].previousValue);

      this.messages = [];
      this.loading = true;
      this.load();

      await this.realtimeService.joinTaskGroup(this.taskId);

    }

  }

  ngOnDestroy(): void {

    this.realtimeService.leaveTaskGroup(this.taskId);

  }

  load(): void {

    this.loading = true;

    this.chatService.getMessages(this.taskId).subscribe({

      next: messages => {

        this.messages = messages ?? [];

        this.loading = false;

        this.errorMessage = '';

        this.cdr.detectChanges();

      },

      error: err => {

        this.loading = false;

        this.errorMessage =
          err.error?.message ?? 'Unable to load messages.';

        this.cdr.detectChanges();

      }

    });

  }

  send(): void {

    const text = this.draft.trim();

    if (!text || this.sending) {
      return;
    }

    this.sending = true;

    this.chatService.sendMessage(this.taskId, { message: text }).subscribe({

      next: () => {

        this.draft = '';
        this.sending = false;
        this.cdr.detectChanges();

      },

      error: err => {

        this.sending = false;

        this.errorMessage =
          err.error?.message ?? 'Unable to send message.';

        this.cdr.detectChanges();

      }

    });

  }

}