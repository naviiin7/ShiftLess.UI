import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { TaskService } from '../../../core/services/task.service';
import { ToastService } from '../../../core/services/toast.service';
import { TaskDetailsModel } from '../../../core/models/task-details.model';
import { ChatWidget } from '../../../shared/components/chat-widget/chat-widget';
import { CardPaymentDialog } from '../../../shared/components/card-payment-dialog/card-payment-dialog';

@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ChatWidget,
    CardPaymentDialog
  ],
  templateUrl: './task-details.html',
  styleUrl: './task-details.scss'
})
export class TaskDetails implements OnInit {

  task?: TaskDetailsModel;

  loading = true;

  errorMessage = '';

  showPayDialog = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private toastService: ToastService
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

          const msg = err.error?.message ?? 'Unable to load task.';

          this.errorMessage = msg;

          this.toastService.error(msg);

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

          this.toastService.success('Task marked as completed.');

          this.load(this.task!.taskId);

        },

        error: err => {

          const msg = err.error?.message ?? 'Unable to complete task.';

          this.errorMessage = msg;

          this.toastService.error(msg);

          this.cdr.detectChanges();

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

          this.toastService.success('Task deleted.');

          this.router.navigate([
            '/manager/my-tasks'
          ]);

        },

        error: err => {

          const msg = err.error?.message ?? 'Unable to delete task.';

          this.errorMessage = msg;

          this.toastService.error(msg);

          this.cdr.detectChanges();

        }

      });

  }

  openPayDialog(): void {

    if (!this.task || this.task.status !== 'Completed' || this.task.isPaid) {
      return;
    }

    this.showPayDialog = true;

  }

  closePayDialog(): void {

    this.showPayDialog = false;

  }

  onPaid(): void {

    this.showPayDialog = false;

    this.toastService.success('Payment successful.');

    if (this.task) {
      this.load(this.task.taskId);
    }

  }

}