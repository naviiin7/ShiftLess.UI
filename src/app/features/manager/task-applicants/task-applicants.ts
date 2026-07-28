import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { TaskService } from '../../../core/services/task.service';
import { ApplicantModel } from '../../../core/models/applicant.model';

@Component({
  selector: 'app-task-applicants',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-applicants.html',
  styleUrl: './task-applicants.scss'
})
export class TaskApplicants implements OnInit {

  applicants: ApplicantModel[] = [];

  taskId = 0;

  loading = true;

  errorMessage = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private taskService: TaskService
  ) { }

  ngOnInit(): void {

    this.taskId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!this.taskId) {

      this.errorMessage = 'Invalid task.';

      this.loading = false;

      return;

    }

    this.loadApplicants();

  }

  loadApplicants(): void {

    this.loading = true;

    this.errorMessage = '';

    this.taskService
      .getApplicants(this.taskId)
      .subscribe({

        next: applicants => {

          this.applicants = applicants;
           this.loading = false;
      this.cdr.detectChanges();

    
        },



        error: err => {

           this.errorMessage = err.error?.message ?? 'Unable to load applicants.';
          this.loading = false;
          this.cdr.detectChanges();

        }

      });

  }

  accept(applicationId: number): void {

    if (!confirm('Accept this applicant?'))
      return;

    this.taskService
      .acceptApplicant(
        this.taskId,
        applicationId
      )
      .subscribe({

        next: () => {

          this.loadApplicants();
          this.cdr.detectChanges();


        },

        error: err => {

          this.errorMessage =
            err.error?.message ??
            'Unable to accept applicant.';
            this.cdr.detectChanges();


        }

      });

  }

  reject(applicationId: number): void {

    if (!confirm('Reject this applicant?'))
      return;

    this.taskService
      .rejectApplicant(
        this.taskId,
        applicationId
      )
      .subscribe({

        next: () => {

          this.loadApplicants();
          this.cdr.detectChanges();


        },

        error: err => {

          this.errorMessage =
            err.error?.message ??
            'Unable to reject applicant.';
            this.cdr.detectChanges();


        }

      });

  }

}