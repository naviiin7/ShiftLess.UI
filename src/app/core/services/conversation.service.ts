import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/responses/api-response';

export interface Conversation {
  taskId: number;
  taskTitle: string;
  status: string;
  acceptedWorkers: number;
  lastMessageSender: string | null;
  lastMessageText: string | null;
  lastMessageAt: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ConversationService {

  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getConversations(): Observable<Conversation[]> {

    return this.http
      .get<ApiResponse<Conversation[]>>(`${this.api}/chat/conversations`)
      .pipe(
        map(response => response.data),
        catchError(err => {

          console.error(
            '[chat] /chat/conversations failed (is the API image rebuilt?). ' +
            'Falling back to /tasks/created.', err);

          return this.fromCreatedTasks();

        })
      );

  }

  /** Fallback: one conversation per task that has accepted workers. */
  private fromCreatedTasks(): Observable<Conversation[]> {

    return this.http
      .get<ApiResponse<any[]>>(`${this.api}/tasks/created`)
      .pipe(
        map(response =>
          (response.data ?? [])
            .filter(t => (t.acceptedWorkers ?? 0) > 0)
            .map(t => ({
              taskId: t.taskId,
              taskTitle: t.title,
              status: t.status,
              acceptedWorkers: t.acceptedWorkers ?? 0,
              lastMessageSender: null,
              lastMessageText: null,
              lastMessageAt: null
            }) as Conversation)
        )
      );

  }

}