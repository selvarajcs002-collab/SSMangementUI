import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { 
    path: 'dashboard', 
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    children: [
      { path: '', loadComponent: () => import('./features/dashboard/dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent) },
      { path: 'inward', loadComponent: () => import('./features/dashboard/inward/inward.component').then(m => m.InwardComponent) },
      { path: 'inward/:id', loadComponent: () => import('./features/dashboard/inward/inward.component').then(m => m.InwardComponent) },
      { 
        path: 'outward',
        children: [
          { path: '', loadComponent: () => import('./features/dashboard/outward/outward.component').then(m => m.OutwardComponent) },
          { path: 'preview', loadComponent: () => import('./features/dashboard/outward/preview/outward-preview.component').then(m => m.OutwardPreviewComponent) },
          { path: ':id', loadComponent: () => import('./features/dashboard/outward/outward.component').then(m => m.OutwardComponent) }
        ]
      },
      { path: 'company', loadComponent: () => import('./features/company/company.component').then(m => m.CompanyComponent) },
      { 
        path: 'delivery-challan', 
        loadComponent: () => import('./features/dashboard/dc-filter-component/dc-filter-container/dc-filter-container.component').then(m => m.DcFilterContainerComponent) 
      },
      { 
        path: 'company/add', 
        loadComponent: () => import('./features/company/add-company/add-company.component').then(m => m.AddCompanyComponent)
      },
      { 
        path: 'company/update', 
        loadComponent: () => import('./features/company/update-company/update-company.component').then(m => m.UpdateCompanyComponent)
      },
      { 
        path: 'company/update/:id', 
        loadComponent: () => import('./features/company/update-company/update-company.component').then(m => m.UpdateCompanyComponent)
      }
    ]
  },
  { path: 'login', loadComponent: () => import('./auth/login/login').then(m => m.Login) },
  { path: 'signup', loadComponent: () => import('./auth/signup/signup').then(m => m.Signup) },
  { path: '**', redirectTo: 'login' }
];
