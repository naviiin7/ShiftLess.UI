import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminService } from '../../../core/services/admin.service';
import { AdminUserModel } from '../../../core/models/admin/admin-user.model';
import { AdminTaskModel } from '../../../core/models/admin/admin-task.model';

type AdminTab = 'tasks' | 'users';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

  activeTab: AdminTab = 'tasks';

  users: AdminUserModel[] = [];

  tasks: AdminTaskModel[] = [];

  loading = true;

  errorMessage = '';

  deletingTaskId: number | null = null;

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {

    this.load();

  }

  get totalManagers(): number {

    return this.users.filter(u => u.role === 'Manager').length;

  }

  get totalWorkers(): number {

    return this.users.filter(u => u.role !== 'Manager' && u.role !== 'Admin').length;

  }

  get activeTasks(): number {

    return this.tasks.filter(t =>
      t.status === 'Open' ||
      t.status === 'Full' ||
      t.status === 'InProgress'
    ).length;

  }

  setTab(tab: AdminTab): void {

    this.activeTab = tab;

  }

  load(): void {

    this.loading = true;

    this.errorMessage = '';

    this.adminService.getAllUsers().subscribe({

      next: users => {

        this.users = users ?? [];

        this.adminService.getAllTasks().subscribe({

          next: tasks => {

            this.tasks = tasks ?? [];

            this.loading = false;

            this.cdr.detectChanges();

          },

          error: err => {

            this.errorMessage =
              err.error?.message ?? 'Unable to load tasks.';

            this.loading = false;

            this.cdr.detectChanges();

          }

        });

      },

      error: err => {

        this.errorMessage =
          err.error?.message ?? 'Unable to load users.';

        this.loading = false;

        this.cdr.detectChanges();

      }

    });

  }

  deleteTask(task: AdminTaskModel): void {

    if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) {
      return;
    }

    this.deletingTaskId = task.taskId;

    this.adminService.deleteTask(task.taskId).subscribe({

      next: () => {

        this.deletingTaskId = null;

        this.load();

      },

      error: err => {

        this.deletingTaskId = null;

        this.errorMessage =
          err.error?.message ?? 'Unable to delete task.';

        this.cdr.detectChanges();

      }

    });

  }

}