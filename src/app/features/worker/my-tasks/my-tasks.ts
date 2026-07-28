import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TaskService } from '../../../core/services/task.service';
import { TaskModel } from '../../../core/models/task.model';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './my-tasks.html',
  styleUrl: './my-tasks.scss'
})
export class MyTasks implements OnInit {

  tasks: TaskModel[] = [];

  loading = true;

  errorMessage = '';

  successMessage = '';

  leavingTaskId: number | null = null;

  constructor(
    private taskService: TaskService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {

    this.load();

  }

  load(): void {

    this.loading = true;

    this.errorMessage = '';

    this.taskService
      .getMyTasks()
      .subscribe({

        next: tasks => {

          this.tasks = tasks ?? [];

          this.loading = false;

          this.cdr.detectChanges();

        },

        error: err => {

          this.errorMessage =
            err.error?.message ??
            'Unable to load your tasks.';

          this.loading = false;

          this.cdr.detectChanges();

        }

      });

  }

  canLeave(task: TaskModel): boolean {

    return task.status === 'Full' || task.status === 'Open';

  }

  leave(taskId: number): void {

    if (!confirm('Leave this task? You may not be able to rejoin depending on the notice period.')) {
      return;
    }

    this.leavingTaskId = taskId;

    this.errorMessage = '';

    this.successMessage = '';

    this.taskService
      .leave(taskId)
      .subscribe({

        next: () => {

          this.leavingTaskId = null;

          this.successMessage = 'You have left the task.';

          this.load();

        },

        error: err => {

          this.leavingTaskId = null;

          this.errorMessage =
            err.error?.message ??
            'Unable to leave this task.';

          this.cdr.detectChanges();

        }

      });

  }

}