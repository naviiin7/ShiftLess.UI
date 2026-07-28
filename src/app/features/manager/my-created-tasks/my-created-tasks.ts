import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { TaskService } from '../../../core/services/task.service';
import { TaskModel } from '../../../core/models/task.model';

@Component({
  selector: 'app-my-created-tasks',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './my-created-tasks.html',
  styleUrl: './my-created-tasks.scss'
})
export class MyCreatedTasks implements OnInit {

  tasks: TaskModel[] = [];

  loading = true;

  constructor(
    private taskService: TaskService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.load();
  }

  load(): void {

    this.loading = true;

    this.taskService
      .getMyCreatedTasks()
      .subscribe({

        next: tasks => {

          this.tasks = tasks ?? [];

          this.loading = false;

          this.cdr.detectChanges();

        },

        error: err => {

          console.error(err);

          this.loading = false;

          this.cdr.detectChanges();

        }

      });

  }

  delete(id: number): void {

    if (!confirm('Delete task?')) {
      return;
    }

    this.taskService
      .deleteTask(id)
      .subscribe({

        next: () => this.load(),

        error: err => console.error(err)

      });

  }

}