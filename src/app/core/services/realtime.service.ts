import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface NotificationData {
  type: string;
  payload: any;
  /** Id of the user the server meant this notification for. */
  userId?: number | string;
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {

  private connection: signalR.HubConnection | null = null;

  private startPromise: Promise<void> | null = null;

  // Task groups this tab has successfully joined, so they can be re-joined
  // after an automatic reconnect (the server forgets group membership then).
  private joinedTaskGroups = new Set<number>();

  /** Emits every "Notification" event that is really meant for this user. */
  readonly notifications$ = new Subject<NotificationData>();

  constructor(private authService: AuthService) { }

  start(): Promise<void> {

    if (this.startPromise) {
      return this.startPromise;
    }

    // With apiUrl '/api' (production) this resolves to '/hubs/chat'.
    const hubUrl = environment.apiUrl.replace('/api', '') + '/hubs/chat';

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        // Called before every connect AND every automatic reconnect.
        accessTokenFactory: () => this.getFreshToken()
      })
      .withAutomaticReconnect()
      .build();

    // Register handlers BEFORE starting, so nothing is ever missed.
    conn.on('Notification', (data: NotificationData) => {

      const me = this.currentUserId();

      // Safety net: never show a notification addressed to someone else.
      if (data.userId !== undefined && data.userId !== null &&
          me !== null && String(data.userId) !== me) {

        console.warn(
          '[realtime] dropped notification for user', data.userId,
          '- this window is user', me, data);

        return;

      }

      this.notifications$.next(data);

    });

    conn.onreconnected(async () => {

      for (const taskId of [...this.joinedTaskGroups]) {

        try {
          await conn.invoke('JoinTaskGroup', taskId);
        } catch (err) {
          console.error('Failed to re-join task group', taskId, err);
          this.joinedTaskGroups.delete(taskId);
        }

      }

    });

    this.connection = conn;
    this.startPromise = this.startWithRetry(conn);

    return this.startPromise;

  }

  /**
   * withAutomaticReconnect() does NOT retry a failed initial start(),
   * so retry it ourselves until it connects or stop() is called.
   */
  private async startWithRetry(conn: signalR.HubConnection): Promise<void> {

    while (this.connection === conn) {

      try {

        await conn.start();

        console.info('[realtime] connected as user', this.currentUserId());

        return;

      } catch (err) {

        console.error('SignalR start failed, retrying in 3s', err);

        await new Promise(resolve => setTimeout(resolve, 3000));

      }

    }

  }

  /** Tears the connection down (call on logout). */
  async stop(): Promise<void> {

    const conn = this.connection;

    this.connection = null;
    this.startPromise = null;
    this.joinedTaskGroups.clear();

    if (conn) {

      try {
        await conn.stop();
      } catch (err) {
        console.error('Error stopping SignalR connection', err);
      }

    }

  }

  /** True while this tab has the given task's chat open (joined its group). */
  isViewingTask(taskId: number): boolean {

    return this.joinedTaskGroups.has(taskId);

  }

  /** Kept for existing callers: starts the connection if needed and returns it. */
  getConnection(): signalR.HubConnection {

    void this.start();

    return this.connection!;

  }

  async ensureConnected(): Promise<signalR.HubConnection> {

    await this.start();

    if (!this.connection) {
      throw new Error('Realtime connection was stopped.');
    }

    return this.connection;

  }

  private async getFreshToken(): Promise<string> {

    if (this.authService.isAccessTokenValid()) {

      return this.authService.getToken();

    }

    try {

      const response = await this.authService.ensureFreshToken();

      return response.token;

    } catch (err) {

      console.error('Failed to refresh token for SignalR connection', err);

      return '';

    }

  }

  /** User id inside the current JWT, or null when logged out / unreadable. */
  private currentUserId(): string | null {

    try {

      const part = this.authService.getToken().split('.')[1];

      if (!part) {
        return null;
      }

      const normalized = part.replace(/-/g, '+').replace(/_/g, '/');

      const padded = normalized.padEnd(
        normalized.length + (4 - (normalized.length % 4)) % 4,
        '='
      );

      const payload = JSON.parse(atob(padded));

      const id =
        payload['nameid'] ??
        payload['sub'] ??
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

      return id !== undefined && id !== null ? String(id) : null;

    } catch {

      return null;

    }

  }

  /**
   * Joins the task's chat group. The server only allows the task's
   * manager, its accepted workers and admins; on rejection the task is
   * not remembered as joined.
   */
  async joinTaskGroup(taskId: number): Promise<void> {

    try {

      const connection = await this.ensureConnected();

      await connection.invoke('JoinTaskGroup', taskId);

      this.joinedTaskGroups.add(taskId);

    } catch (err) {

      this.joinedTaskGroups.delete(taskId);

      console.error('Failed to join task group', taskId, err);

    }

  }

  async leaveTaskGroup(taskId: number): Promise<void> {

    this.joinedTaskGroups.delete(taskId);

    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {

      await this.connection.invoke('LeaveTaskGroup', taskId);

    } catch (err) {

      console.error('Failed to leave task group', taskId, err);

    }

  }

}