import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';

import { ApiResponse } from '../models/responses/api-response';

import { TaskModel } from '../models/task.model';
import { ApplicantModel } from '../models/applicant.model';
import { TaskDetailsModel } from '../models/task-details.model';

import { MessageResponse } from '../models/responses/message-response';

import { CreateTaskRequest } from '../models/requests/create-task-request';
import { CreateTaskResponse } from '../models/responses/create-task-response';

import { UpdateTaskRequest } from '../models/requests/update-task-request';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private readonly api = environment.apiUrl;

  constructor(
    private http: HttpClient
  ) { }

  // =====================================================
  // Worker
  // =====================================================

  getOpenTasks(): Observable<TaskModel[]> {

    return this.http
      .get<ApiResponse<TaskModel[]>>(
        `${this.api}/tasks`
      )
      .pipe(
        map(response => response.data)
      );

  }

  getMyTasks(): Observable<TaskModel[]> {

    return this.http
      .get<ApiResponse<TaskModel[]>>(
        `${this.api}/tasks/my-tasks`
      )
      .pipe(
        map(response => response.data)
      );

  }

  apply(taskId: number): Observable<MessageResponse> {

    return this.http
      .post<ApiResponse<MessageResponse>>(
        `${this.api}/tasks/${taskId}/apply`,
        {}
      )
      .pipe(
        map(response => response.data)
      );

  }

  leave(taskId: number): Observable<MessageResponse> {

    return this.http
      .post<ApiResponse<MessageResponse>>(
        `${this.api}/tasks/${taskId}/leave`,
        {}
      )
      .pipe(
        map(response => response.data)
      );

  }

  // =====================================================
  // Manager
  // =====================================================

  
  
  getMyCreatedTasks(): Observable<TaskModel[]> {

    return this.http
      .get<ApiResponse<TaskModel[]>>(
        `${this.api}/tasks/created`
      )
      .pipe(
        map(response => response.data)
      );

  }

  createTask(
    request: CreateTaskRequest
  ): Observable<CreateTaskResponse> {

    return this.http
      .post<ApiResponse<CreateTaskResponse>>(
        `${this.api}/tasks`,
        request
      )
      .pipe(
        map(response => response.data)
      );

  }

  

  updateTask(
    id: number,
    request: UpdateTaskRequest
  ): Observable<MessageResponse> {

    return this.http
      .put<ApiResponse<MessageResponse>>(
        `${this.api}/tasks/${id}`,
        request
      )
      .pipe(
        map(response => response.data)
      );

  }

  deleteTask(
    id: number
  ): Observable<MessageResponse> {

    return this.http
      .delete<ApiResponse<MessageResponse>>(
        `${this.api}/tasks/${id}`
      )
      .pipe(
        map(response => response.data)
      );

  }

  getTaskDetails(
  id: number
): Observable<TaskDetailsModel> {

  return this.http
    .get<ApiResponse<TaskDetailsModel>>(
      `${this.api}/tasks/${id}/details`
    )
    .pipe(
      map(response => response.data)
    );

}

  getApplicants(
  id: number
): Observable<ApplicantModel[]> {

  return this.http
    .get<ApiResponse<ApplicantModel[]>>(
      `${this.api}/tasks/${id}/applicants`
    )
    .pipe(
      map(response => response.data)
    );

}

  acceptApplicant(
    taskId: number,
    applicationId: number
  ): Observable<MessageResponse> {

    return this.http
      .post<ApiResponse<MessageResponse>>(
        `${this.api}/tasks/${taskId}/applications/${applicationId}/accept`,
        {}
      )
      .pipe(
        map(response => response.data)
      );

  }

  rejectApplicant(
    taskId: number,
    applicationId: number
  ): Observable<MessageResponse> {

    return this.http
      .post<ApiResponse<MessageResponse>>(
        `${this.api}/tasks/${taskId}/applications/${applicationId}/reject`,
        {}
      )
      .pipe(
        map(response => response.data)
      );

  }

  completeTask(
    id: number
  ): Observable<MessageResponse> {

    return this.http
      .post<ApiResponse<MessageResponse>>(
        `${this.api}/tasks/${id}/complete`,
        {}
      )
      .pipe(
        map(response => response.data)
      );

  }

}