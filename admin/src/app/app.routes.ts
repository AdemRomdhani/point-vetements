import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: '', loadComponent: () => import('./components/analytics/analytics.component').then(m => m.AnalyticsComponent), canActivate: [AuthGuard] },
  { path: 'produits', loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [AuthGuard] },
  { path: 'produits/ajouter', loadComponent: () => import('./components/product-form/product-form.component').then(m => m.ProductFormComponent), canActivate: [AuthGuard] },
  { path: 'produits/modifier/:id', loadComponent: () => import('./components/product-form/product-form.component').then(m => m.ProductFormComponent), canActivate: [AuthGuard] },
  { path: 'commandes', loadComponent: () => import('./components/orders/orders.component').then(m => m.OrdersComponent), canActivate: [AuthGuard] },
  { path: 'commandes/:id', loadComponent: () => import('./components/order-detail/order-detail.component').then(m => m.OrderDetailComponent), canActivate: [AuthGuard] },
  { path: 'avis', loadComponent: () => import('./components/avis/avis.component').then(m => m.AvisComponent), canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' }
];
