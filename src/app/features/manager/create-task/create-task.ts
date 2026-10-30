import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';

import { TaskService } from '../../../core/services/task.service';
import { CreateTaskRequest } from '../../../core/models/requests/create-task-request';

@Component({
  selector: 'app-create-task',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './create-task.html',
  styleUrl: './create-task.scss'
})
export class CreateTask {

  isSaving = false;

  errorMessage = '';

  successMessage = '';

  form;

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private router: Router
  ) {

    this.form = this.fb.group({

      title: ['', Validators.required],

      description: ['', Validators.required],

      location: ['', [Validators.required, Validators.maxLength(100)]],

      budget: [0, [Validators.required, Validators.min(1)]],

      requiredWorkers: [1, [Validators.required, Validators.min(1)]],

      startTime: ['', Validators.required],

      workingHours: [1, [Validators.required, Validators.min(1)]],

      leaveNoticeHours: [24, Validators.required]

    });

  }

  create(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;

    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const raw = this.form.getRawValue();

    const request = {
      ...raw,
      // datetime-local has no timezone; interpret it as the user's local
      // time and send the real UTC instant (ends with "Z").
      startTime: new Date(raw.startTime as string).toISOString()
    } as CreateTaskRequest;

    this.taskService.createTask(request).subscribe({

      next: response => {

        this.successMessage = response.message;

        this.isSaving = false;

        this.router.navigate(['/manager/my-tasks']);

      },

      error: err => {

        this.errorMessage =
          err.error?.message ??
          'Unable to create task.';

        this.isSaving = false;

      }

    });

  }

}