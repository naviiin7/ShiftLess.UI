import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth-guard';
import { managerGuard } from './core/guards/manager-guard';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [

  {
    path: '',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout')
        .then(c => c.MainLayout),

    children: [

      // ==========================
      // Home
      // ==========================

      {
        path: '',
        loadComponent: () =>
          import('./features/home/home')
            .then(c => c.Home)
      },

      // ==========================
      // Authentication
      // ==========================

      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login')
            .then(c => c.Login)
      },

      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register')
            .then(c => c.Register)
      },

      // ==========================
      // Worker
      // ==========================

      {
        path: 'worker/dashboard',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/worker/dashboard/dashboard')
            .then(c => c.Dashboard)
      },

      {
        path: 'worker/open-tasks',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/worker/open-tasks/open-tasks')
            .then(c => c.OpenTasks)
      },

      {
        path: 'worker/my-tasks',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/worker/my-tasks/my-tasks')
            .then(c => c.MyTasks)
      },

      // ==========================
      // Manager
      // ==========================

      {
        path: 'manager/dashboard',
        canActivate: [managerGuard],
        loadComponent: () =>
          import('./features/manager/dashboard/dashboard')
            .then(c => c.Dashboard)
      },

      {
        path: 'manager/create-task',
        canActivate: [managerGuard],
        loadComponent: () =>
          import('./features/manager/create-task/create-task')
            .then(c => c.CreateTask)
      },

      {
        path: 'manager/my-tasks',
        canActivate: [managerGuard],
        loadComponent: () =>
          import('./features/manager/my-created-tasks/my-created-tasks')
            .then(c => c.MyCreatedTasks)
      },

      {
        path: 'manager/edit-task/:id',
        canActivate: [managerGuard],
        loadComponent: () =>
          import('./features/manager/edit-task/edit-task')
            .then(c => c.EditTask)
      },

      {
        path: 'manager/task-details/:id',
        canActivate: [managerGuard],
        loadComponent: () =>
          import('./features/manager/task-details/task-details')
            .then(c => c.TaskDetails)
      },

      {
        path: 'manager/task-applicants/:id',
        canActivate: [managerGuard],
        loadComponent: () =>
          import('./features/manager/task-applicants/task-applicants')
            .then(c => c.TaskApplicants)
      },

      {
        path: 'manager/applicants',
        canActivate: [managerGuard],
        loadComponent: () =>
          import('./features/manager/applicants-overview/applicants-overview')
            .then(c => c.ApplicantsOverview)
      },

      // ==========================
      // Admin
      // ==========================

      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard')
            .then(c => c.Dashboard)
      }

    ]
  },

  {
    path: '**',
    redirectTo: ''
  }

];