import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { AdminService } from '../../../core/services/admin.service';
import { AdminUserModel } from '../../../core/models/admin/admin-user.model';
import { AdminTaskModel } from '../../../core/models/admin/admin-task.model';
import { AdminStatsModel } from '../../../core/models/admin/admin-stats.model';
import { apiErrorMessage, cleanPhone } from '../../../core/validators/auth-validators';

type AdminTab = 'overview' | 'tasks' | 'users';

interface Bar {
  label: string;
  value: number;
  cls: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

  activeTab: AdminTab = 'overview';

  users: AdminUserModel[] = [];

  tasks: AdminTaskModel[] = [];

  stats: AdminStatsModel | null = null;

  loading = true;

  errorMessage = '';

  successMessage = '';

  deletingTaskId: number | null = null;

  // ---------- users tab ----------

  userSearch = '';

  roleFilter: 'all' | 'Admin' | 'Manager' | 'Client' = 'all';

  statusFilter: 'all' | 'active' | 'blocked' = 'all';

  busyUserId: number | null = null;

  // ---------- edit dialog ----------

  editing: AdminUserModel | null = null;

  editForm = { fullName: '', phone: '', role: 'Client' };

  editError = '';

  saving = false;

  private flashTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {

    this.load();

  }

  // ---------------------------------------------------------
  // Loading
  // ---------------------------------------------------------

  load(): void {

    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      users: this.adminService.getAllUsers(),
      tasks: this.adminService.getAllTasks(),
      stats: this.adminService.getStats()
    }).subscribe({

      next: ({ users, tasks, stats }) => {

        this.users = users ?? [];
        this.tasks = tasks ?? [];
        this.stats = stats ?? null;

        this.loading = false;

        this.cdr.detectChanges();

      },

      error: err => {

        this.errorMessage =
          apiErrorMessage(err, 'Unable to load platform data.');

        this.loading = false;

        this.cdr.detectChanges();

      }

    });

  }

  private refreshUsersAndStats(): void {

    forkJoin({
      users: this.adminService.getAllUsers(),
      stats: this.adminService.getStats()
    }).subscribe({

      next: ({ users, stats }) => {

        this.users = users ?? [];
        this.stats = stats ?? null;

        this.cdr.detectChanges();

      },

      error: err => {

        this.errorMessage =
          apiErrorMessage(err, 'Unable to refresh users.');

        this.cdr.detectChanges();

      }

    });

  }

  setTab(tab: AdminTab): void {

    this.activeTab = tab;

  }

  private flash(message: string): void {

    this.successMessage = message;

    if (this.flashTimer) {
      clearTimeout(this.flashTimer);
    }

    this.flashTimer = setTimeout(() => {

      this.successMessage = '';

      this.cdr.detectChanges();

    }, 4000);

  }

  // ---------------------------------------------------------
  // Overview numbers
  // ---------------------------------------------------------

  get activeTasks(): number {

    const t = this.stats?.tasks;

    return t ? t.open + t.assigned + t.inProgress : 0;

  }

  get taskBars(): Bar[] {

    const t = this.stats?.tasks;

    if (!t) {
      return [];
    }

    return [
      { label: 'Open', value: t.open, cls: 'bg-primary' },
      { label: 'Assigned', value: t.assigned, cls: 'bg-warning' },
      { label: 'In progress', value: t.inProgress, cls: 'bg-info' },
      { label: 'Completed', value: t.completed, cls: 'bg-success' },
      { label: 'Cancelled', value: t.cancelled, cls: 'bg-secondary' },
      { label: 'Expired', value: t.expired, cls: 'bg-danger' }
    ];

  }

  get applicationBars(): Bar[] {

    const a = this.stats?.applications;

    if (!a) {
      return [];
    }

    return [
      { label: 'Pending', value: a.pending, cls: 'bg-warning' },
      { label: 'Accepted', value: a.accepted, cls: 'bg-success' },
      { label: 'Rejected', value: a.rejected, cls: 'bg-danger' },
      { label: 'Withdrawn', value: a.withdrawn, cls: 'bg-secondary' }
    ];

  }

  pct(value: number, total: number): number {

    return total > 0 ? Math.round((value / total) * 100) : 0;

  }

  // ---------------------------------------------------------
  // Users tab
  // ---------------------------------------------------------

  get filteredUsers(): AdminUserModel[] {

    const term = this.userSearch.trim().toLowerCase();

    return this.users.filter(u => {

      if (this.roleFilter !== 'all' && u.role !== this.roleFilter) {
        return false;
      }

      if (this.statusFilter === 'active' && !u.isActive) {
        return false;
      }

      if (this.statusFilter === 'blocked' && u.isActive) {
        return false;
      }

      if (!term) {
        return true;
      }

      return u.fullName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.phone ?? '').toLowerCase().includes(term);

    });

  }

  roleLabel(role: string): string {

    return role === 'Client' ? 'Worker' : role;

  }

  openEdit(user: AdminUserModel): void {

    this.editing = user;

    this.editForm = {
      fullName: user.fullName,
      phone: user.phone ?? '',
      role: user.role
    };

    this.editError = '';

  }

  cancelEdit(): void {

    if (this.saving) {
      return;
    }

    this.editing = null;

  }

  saveEdit(): void {

    if (!this.editing) {
      return;
    }

    const fullName = this.editForm.fullName.trim();

    const phone = cleanPhone(this.editForm.phone);

    if (!fullName) {
      this.editError = 'Full name is required.';
      return;
    }

    if (!/^\+?\d{10,15}$/.test(phone)) {
      this.editError = 'Phone number must be 10 to 15 digits, optionally starting with +.';
      return;
    }

    this.editError = '';
    this.saving = true;

    this.adminService
      .updateUser(this.editing.userId, {
        fullName,
        phone,
        role: this.editForm.role
      })
      .subscribe({

        next: result => {

          this.saving = false;
          this.editing = null;

          this.flash(result.message);

          this.refreshUsersAndStats();

        },

        error: err => {

          this.saving = false;

          this.editError =
            apiErrorMessage(err, 'Unable to update this user.');

          this.cdr.detectChanges();

        }

      });

  }

  toggleBlock(user: AdminUserModel): void {

    if (user.isActive &&
        !confirm(`Block ${user.fullName}? They will be signed out and unable to log in.`)) {
      return;
    }

    this.errorMessage = '';
    this.busyUserId = user.userId;

    const call = user.isActive
      ? this.adminService.blockUser(user.userId)
      : this.adminService.unblockUser(user.userId);

    call.subscribe({

      next: result => {

        this.busyUserId = null;

        this.flash(result.message);

        this.refreshUsersAndStats();

      },

      error: err => {

        this.busyUserId = null;

        this.errorMessage =
          apiErrorMessage(err, 'Unable to change this account.');

        this.cdr.detectChanges();

      }

    });

  }

  deleteUser(user: AdminUserModel): void {

    if (!confirm(`Permanently delete ${user.fullName}? This cannot be undone.`)) {
      return;
    }

    this.errorMessage = '';
    this.busyUserId = user.userId;

    this.adminService.deleteUser(user.userId).subscribe({

      next: result => {

        this.busyUserId = null;

        this.flash(result.message);

        this.refreshUsersAndStats();

      },

      error: err => {

        this.busyUserId = null;

        this.errorMessage =
          apiErrorMessage(err, 'Unable to delete this user.');

        this.cdr.detectChanges();

      }

    });

  }

  // ---------------------------------------------------------
  // Tasks tab
  // ---------------------------------------------------------

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
          apiErrorMessage(err, 'Unable to delete task.');

        this.cdr.detectChanges();

      }

    });

  }

}