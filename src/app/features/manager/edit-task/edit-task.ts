import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { TaskService } from '../../../core/services/task.service';
import { UpdateTaskRequest } from '../../../core/models/requests/update-task-request';
import { TaskDetailsModel } from '../../../core/models/task-details.model';

@Component({
  selector: 'app-edit-task',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './edit-task.html',
  styleUrl: './edit-task.scss'
})
export class EditTask implements OnInit {

  taskId = 0;

  loading = true;

  saving = false;

  errorMessage = '';

  form;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private cdr: ChangeDetectorRef
  ) {

    this.form = this.fb.group({

      title: [
        '',
        [
          Validators.required,
          Validators.maxLength(100)
        ]
      ],

      description: [
        '',
        [
          Validators.required,
          Validators.maxLength(1000)
        ]
      ],

      budget: [
        1,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      requiredWorkers: [
        1,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      startTime: [
        '',
        Validators.required
      ],

      workingHours: [
        1,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      leaveNoticeHours: [
        24,
        [
          Validators.required,
          Validators.min(1)
        ]
      ]

    });

  }

  ngOnInit(): void {

    this.taskId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!this.taskId) {

      this.errorMessage = 'Invalid task.';

      this.loading = false;

      return;

    }

    this.loadTask();

  }

  loadTask(): void {

    this.loading = true;

    this.errorMessage = '';

    this.taskService
      .getTaskDetails(this.taskId)
      .subscribe({

        next: (task: TaskDetailsModel) => {

          try {

            this.form.patchValue({

              title: task.title,
              description: task.description,
              budget: task.budget,
              requiredWorkers: task.requiredWorkers,
              startTime: this.toDateTimeLocal(task.startTime),
              workingHours: task.workingHours,
              leaveNoticeHours: task.leaveNoticeHours

            });

          }
          catch (e) {

            console.error('PATCH VALUE FAILED', e);

          }

          this.loading = false;

          this.cdr.detectChanges();

        },

        error: err => {

          this.errorMessage =
            err.error?.message ??
            'Unable to load task. It may not exist or you may not have access.';

          this.loading = false;

          this.cdr.detectChanges();

        }

      });

  }

  update(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;

    }

    this.saving = true;

    this.errorMessage = '';

    const request =
      this.form.getRawValue() as UpdateTaskRequest;

    this.taskService
      .updateTask(this.taskId, request)
      .subscribe({

        next: () => {

          this.router.navigate([
            '/manager/task-details',
            this.taskId
          ]);

        },

        error: err => {

          this.errorMessage =
            err.error?.message ??
            'Unable to update task.';

          this.saving = false;

          this.cdr.detectChanges();

        }

      });

  }

  cancel(): void {

    this.router.navigate([
      '/manager/task-details',
      this.taskId
    ]);

  }

  private toDateTimeLocal(date: string): string {

    const d = new Date(date);

    d.setMinutes(
      d.getMinutes() -
      d.getTimezoneOffset()
    );

    return d.toISOString().slice(0, 16);

  }

}