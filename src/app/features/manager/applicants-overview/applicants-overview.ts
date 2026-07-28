import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { TaskService } from '../../../core/services/task.service';
import { ApplicantModel } from '../../../core/models/applicant.model';

interface ApplicantRow extends ApplicantModel {
  taskId: number;
  taskTitle: string;
}

@Component({
  selector: 'app-applicants-overview',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './applicants-overview.html',
  styleUrl: './applicants-overview.scss'
})
export class ApplicantsOverview implements OnInit {

  rows: ApplicantRow[] = [];

  loading = true;

  errorMessage = '';

  actingId: number | null = null;

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
      .getMyCreatedTasks()
      .subscribe({

        next: tasks => {

          if (!tasks || tasks.length === 0) {

            this.rows = [];

            this.loading = false;

            this.cdr.detectChanges();

            return;

          }

          const calls = tasks.map(task =>
            this.taskService
              .getApplicants(task.taskId)
              .pipe(
                catchError(() => of([]))
              )
          );

          forkJoin(calls).subscribe(results => {

            const rows: ApplicantRow[] = [];

            results.forEach((applicants, index) => {

              const task = tasks[index];

              applicants.forEach(applicant => {

                rows.push({
                  ...applicant,
                  taskId: task.taskId,
                  taskTitle: task.title
                });

              });

            });

            // Pending applicants first, most relevant to act on.
            rows.sort((a, b) => {

              if (a.status === b.status) return 0;
              if (a.status === 'Pending') return -1;
              if (b.status === 'Pending') return 1;
              return 0;

            });

            this.rows = rows;

            this.loading = false;

            this.cdr.detectChanges();

          });

        },

        error: err => {

          this.errorMessage =
            err.error?.message ??
            'Unable to load applicants.';

          this.loading = false;

          this.cdr.detectChanges();

        }

      });

  }

  accept(row: ApplicantRow): void {

    if (!confirm(`Accept ${row.fullName} for "${row.taskTitle}"?`)) {
      return;
    }

    this.actingId = row.applicationId;

    this.taskService
      .acceptApplicant(row.taskId, row.applicationId)
      .subscribe({

        next: () => {

          this.actingId = null;

          this.load();

        },

        error: err => {

          this.actingId = null;

          this.errorMessage =
            err.error?.message ??
            'Unable to accept applicant.';

          this.cdr.detectChanges();

        }

      });

  }

  reject(row: ApplicantRow): void {

    if (!confirm(`Reject ${row.fullName} for "${row.taskTitle}"?`)) {
      return;
    }

    this.actingId = row.applicationId;

    this.taskService
      .rejectApplicant(row.taskId, row.applicationId)
      .subscribe({

        next: () => {

          this.actingId = null;

          this.load();

        },

        error: err => {

          this.actingId = null;

          this.errorMessage =
            err.error?.message ??
            'Unable to reject applicant.';

          this.cdr.detectChanges();

        }

      });

  }

}