import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';

import { ApiResponse } from '../models/responses/api-response';
import { MessageResponse } from '../models/responses/message-response';
import { AdminUserModel } from '../models/admin/admin-user.model';
import { AdminTaskModel } from '../models/admin/admin-task.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<AdminUserModel[]> {

    return this.http
      .get<ApiResponse<AdminUserModel[]>>(`${this.api}/admin/users`)
      .pipe(map(response => response.data));

  }

  getAllTasks(): Observable<AdminTaskModel[]> {

    return this.http
      .get<ApiResponse<AdminTaskModel[]>>(`${this.api}/admin/tasks`)
      .pipe(map(response => response.data));

  }

  deleteTask(taskId: number): Observable<MessageResponse> {

    return this.http
      .delete<ApiResponse<MessageResponse>>(`${this.api}/admin/tasks/${taskId}`)
      .pipe(map(response => response.data));

  }

}