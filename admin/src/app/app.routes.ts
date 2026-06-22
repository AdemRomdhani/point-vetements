import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AnalyticsComponent } from './components/analytics/analytics.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProductFormComponent } from './components/product-form/product-form.component';
import { OrdersComponent } from './components/orders/orders.component';
import { OrderDetailComponent } from './components/order-detail/order-detail.component';
import { LoginComponent } from './components/login/login.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: AnalyticsComponent, canActivate: [AuthGuard] },
  { path: 'produits', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'produits/ajouter', component: ProductFormComponent, canActivate: [AuthGuard] },
  { path: 'produits/modifier/:id', component: ProductFormComponent, canActivate: [AuthGuard] },
  { path: 'commandes', component: OrdersComponent, canActivate: [AuthGuard] },
  { path: 'commandes/:id', component: OrderDetailComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' }
];
