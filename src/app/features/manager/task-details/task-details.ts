import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { TaskService } from '../../../core/services/task.service';
import { TaskDetailsModel } from '../../../core/models/task-details.model';

@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './task-details.html',
  styleUrl: './task-details.scss'
})
export class TaskDetails implements OnInit {

  task?: TaskDetailsModel;

  loading = true;

  errorMessage = '';

  constructor(
      private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService
  ) { }

  ngOnInit(): void {

    const taskId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!taskId) {

      this.errorMessage = 'Invalid task.';

      this.loading = false;

      return;

    }

    this.load(taskId);

  }

  load(taskId: number): void {

    this.loading = true;

    this.errorMessage = '';

    this.taskService
      .getTaskDetails(taskId)
      .subscribe({

        next: task => {

          this.task = task;

          this.loading = false;

          this.cdr.detectChanges();

        },

        error: err => {

          this.errorMessage =
            err.error?.message ??
            'Unable to load task.';

          this.loading = false;

          this.cdr.detectChanges();
        }

      });

  }

  complete(): void {

    if (!this.task)
      return;

    if (!confirm('Mark this task as completed?'))
      return;

    this.taskService
      .completeTask(this.task.taskId)
      .subscribe({

        next: () => {

          this.load(this.task!.taskId);

        },

        error: err => {

          this.errorMessage =
            err.error?.message ??
            'Unable to complete task.';

        }

      });

  }

  delete(): void {

    if (!this.task)
      return;

    if (!confirm('Delete this task permanently?'))
      return;

    this.taskService
      .deleteTask(this.task.taskId)
      .subscribe({

        next: () => {

          this.router.navigate([
            '/manager/my-tasks'
          ]);

        },

        error: err => {

          this.errorMessage =
            err.error?.message ??
            'Unable to delete task.';

        }

      });

  }

}