import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="splash-overlay" *ngIf="showSplash" [class.hiding]="splashHiding">
      <div class="splash-logo">
        <span class="splash-logo-text">POINT</span>
        <span class="splash-logo-sub">VETEMENTS</span>
        <span class="splash-badge">Admin Panel</span>
      </div>
    </div>

    <div *ngIf="!isLoggedIn; else adminLayout">
      <router-outlet></router-outlet>
    </div>
    <ng-template #adminLayout>
      <div class="admin-layout">
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed" [class.mobile-open]="mobileSidebarOpen">
        <div class="sidebar-header">
          <div class="logo">
            <span class="logo-text">POINT</span>
            <span class="logo-subtext">VETEMENTS</span>
            <span class="admin-badge">Admin Panel</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item" (click)="closeMobileSidebar()">
            <i class="fas fa-chart-line"></i>
            <span>Tableau de bord</span>
          </a>
          <a routerLink="/produits" routerLinkActive="active" class="nav-item" (click)="closeMobileSidebar()">
            <i class="fas fa-box"></i>
            <span>Produits</span>
          </a>
          <a routerLink="/commandes" routerLinkActive="active" class="nav-item" (click)="closeMobileSidebar()">
            <i class="fas fa-shopping-cart"></i>
            <span>Commandes</span>
          </a>
          <a routerLink="/avis" routerLinkActive="active" class="nav-item" (click)="closeMobileSidebar()">
            <i class="fas fa-comments"></i>
            <span>Avis</span>
          </a>
          <a [href]="frontendUrl" target="_blank" class="nav-item" (click)="closeMobileSidebar()">
            <i class="fas fa-external-link-alt"></i>
            <span>Voir la boutique</span>
          </a>
        </nav>

        <div class="sidebar-footer-text">
          <p>&copy; 2026 Point Vetements</p>
        </div>
      </aside>

      <div class="sidebar-overlay" [class.active]="mobileSidebarOpen" (click)="closeMobileSidebar()"></div>

      <main class="main-content" [class.sidebar-collapsed]="sidebarCollapsed">
        <header class="topbar">
          <div class="topbar-left">
            <button class="sidebar-toggle" (click)="toggleSidebar()">
              <i class="fas" [class.fa-bars]="!mobileSidebarOpen && !sidebarCollapsed" [class.fa-times]="mobileSidebarOpen || sidebarCollapsed"></i>
            </button>
            <h1>Gestion de la boutique</h1>
          </div>
          <div class="topbar-right">
            <span class="user-info">
              <i class="fas fa-user-circle"></i>
              <span class="user-label">Administrateur</span>
            </span>
            <button class="logout-btn" (click)="logout()" title="Deconnexion">
              <i class="fas fa-sign-out-alt"></i>
              <span class="logout-label">Deconnexion</span>
            </button>
          </div>
        </header>

        <div class="content-area">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
    </ng-template>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      min-height: 100vh;
    }

    .sidebar {
      width: var(--sidebar-width);
      background: var(--noir);
      color: var(--blanc);
      display: flex;
      flex-direction: column;
      position: fixed;
      height: 100vh;
      z-index: 100;
    }

    .sidebar-header {
      padding: 24px;
      border-bottom: 1px solid var(--noir-light);
    }

    .logo {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .logo-text {
      font-family: 'Inter', sans-serif;
      font-size: 20px;
      font-weight: 100;
      letter-spacing: 5px;
      color: var(--blanc);
      line-height: 1;
    }
    .logo-subtext {
      font-family: 'Inter', sans-serif;
      font-size: 8px;
      font-weight: 400;
      letter-spacing: 4px;
      color: #A89070;
      line-height: 1;
    }
    .admin-badge {
      font-size: 9px;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 4px;
    }

    .sidebar-nav {
      flex: 1;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 10px;
      color: var(--gris-light);
      transition: var(--transition);
      font-size: 14px;
      font-weight: 500;
    }

    .nav-item:hover {
      background: var(--noir-light);
      color: var(--blanc);
    }

    .nav-item.active {
      background: var(--accent);
      color: var(--blanc);
    }

    .nav-item i {
      width: 20px;
      text-align: center;
      font-size: 16px;
    }

    .main-content {
      flex: 1;
      margin-left: var(--sidebar-width);
      display: flex;
      flex-direction: column;
      transition: margin-left 0.3s ease;
    }
    .main-content.sidebar-collapsed {
      margin-left: 70px;
    }

    .topbar {
      background: var(--blanc);
      border-bottom: 1px solid var(--border);
      padding: 16px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .topbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .topbar h1 {
      font-size: 20px;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--gris);
    }
    .topbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logout-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border: 1px solid var(--border);
      background: var(--blanc);
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      color: var(--danger);
      transition: var(--transition);
      font-family: 'Inter', sans-serif;
    }
    .logout-btn:hover {
      background: #FFEBEE;
      border-color: var(--danger);
    }
    .user-info i {
      font-size: 24px;
      color: var(--accent);
    }
    .content-area {
      flex: 1;
      padding: 32px;
    }

    .sidebar-footer-text {
      padding: 16px 24px;
      border-top: 1px solid var(--noir-light);
      font-size: 12px;
      color: var(--gris);
      text-align: center;
    }
    .sidebar-toggle {
      display: none;
      width: 40px;
      height: 40px;
      border: 1px solid var(--border);
      background: var(--blanc);
      border-radius: 8px;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 16px;
      color: var(--noir);
      transition: var(--transition);
    }
    .sidebar-toggle:hover { background: var(--beige); }
    .sidebar-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 99;
    }
    .sidebar-overlay.active {
      display: block;
    }

    @media (max-width: 1024px) {
      .content-area { padding: 24px; }
    }
    @media (max-width: 768px) {
      .sidebar {
        width: 260px;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
        z-index: 100;
      }
      .sidebar.mobile-open {
        transform: translateX(0);
      }
      .sidebar .sidebar-footer-text { display: none; }
      .sidebar-header { padding: 16px; }
      .nav-item { padding: 14px 16px; justify-content: flex-start; }
      .nav-item span { display: inline; }
      .main-content { margin-left: 0; }
      .sidebar-toggle { display: flex; }
      .topbar { padding: 12px 16px; z-index: 101; }
      .topbar h1 { font-size: 16px; }
      .user-label { display: none; }
      .content-area { padding: 16px; }
      .logout-btn span { display: none; }
      .logout-btn { padding: 8px 12px; }
    }
    @media (max-width: 480px) {
      .topbar h1 { font-size: 14px; }
      .content-area { padding: 12px; }
    }
  `]
})
export class AppComponent implements OnInit {
  sidebarCollapsed = false;
  mobileSidebarOpen = false;
  frontendUrl = environment.frontendUrl || '/';
  isLoggedIn = false;
  showSplash = false;
  splashHiding = false;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.auth.isLoggedIn$.subscribe(val => {
      const wasLoggedIn = this.isLoggedIn;
      this.isLoggedIn = val;
      if (val && !wasLoggedIn) {
        this.showSplash = true;
        this.splashHiding = false;
        setTimeout(() => {
          this.splashHiding = true;
          setTimeout(() => this.showSplash = false, 600);
        }, 2200);
      }
    });
  }

  toggleSidebar() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      this.mobileSidebarOpen = !this.mobileSidebarOpen;
      document.body.style.overflow = this.mobileSidebarOpen ? 'hidden' : '';
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }

  closeMobileSidebar() {
    this.mobileSidebarOpen = false;
    document.body.style.overflow = '';
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
