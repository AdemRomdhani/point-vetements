import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) },
  { path: 'produit/:id', loadComponent: () => import('./components/product-detail/product-detail.component').then(m => m.ProductDetailComponent) },
  { path: 'panier', loadComponent: () => import('./components/cart/cart.component').then(m => m.CartComponent) },
  { path: 'suivi', loadComponent: () => import('./components/order-tracking/order-tracking.component').then(m => m.OrderTrackingComponent) },
  { path: 'suivi/:orderId', loadComponent: () => import('./components/order-tracking/order-tracking.component').then(m => m.OrderTrackingComponent) },
  { path: '**', redirectTo: '' }
];
