import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TaskService } from '../../../core/services/task.service';
import { TaskModel } from '../../../core/models/task.model';

@Component({
  selector: 'app-open-tasks',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './open-tasks.html',
  styleUrl: './open-tasks.scss'
})
export class OpenTasks implements OnInit {

  tasks: TaskModel[] = [];

  isLoading = true;

  errorMessage = '';

  successMessage = '';

  applyingTaskId: number | null = null;

  constructor(
    private taskService: TaskService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {

    this.loadTasks();

  }

  loadTasks(): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.taskService
      .getOpenTasks()
      .subscribe({

        next: tasks => {

          this.tasks = tasks ?? [];

          this.isLoading = false;

          this.cdr.detectChanges();

        },

        error: err => {

          this.errorMessage =
            err.error?.message ??
            'Unable to load open tasks.';

          this.isLoading = false;

          this.cdr.detectChanges();

        }

      });

  }

  apply(taskId: number): void {

    this.applyingTaskId = taskId;

    this.errorMessage = '';

    this.successMessage = '';

    this.taskService
      .apply(taskId)
      .subscribe({

        next: () => {

          this.applyingTaskId = null;

          this.successMessage = 'Application submitted successfully.';

          this.loadTasks();

        },

        error: err => {

          this.applyingTaskId = null;

          this.errorMessage =
            err.error?.message ??
            'Unable to apply for this task.';

          this.cdr.detectChanges();

        }

      });

  }

}