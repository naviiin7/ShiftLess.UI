import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';

import { ApiResponse } from '../models/responses/api-response';
import { ChatMessageModel } from '../models/chat-message.model';
import { SendChatMessageRequest } from '../models/requests/send-chat-message-request';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getMessages(taskId: number): Observable<ChatMessageModel[]> {

    return this.http
      .get<ApiResponse<ChatMessageModel[]>>(`${this.api}/tasks/${taskId}/chat`)
      .pipe(map(response => response.data));

  }

  sendMessage(
    taskId: number,
    request: SendChatMessageRequest
  ): Observable<ChatMessageModel> {

    return this.http
      .post<ApiResponse<ChatMessageModel>>(`${this.api}/tasks/${taskId}/chat`, request)
      .pipe(map(response => response.data));

  }

}