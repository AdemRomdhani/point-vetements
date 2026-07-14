import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  template: `
    <header class="header">
      <div class="container">
        <div class="header-inner">
          <a routerLink="/" class="logo" (click)="resetAll()">
            <span class="logo-text">POINT</span>
            <span class="logo-subtext">VETEMENTS</span>
          </a>

          <nav class="nav">
            <a routerLink="/" class="nav-link" [class.active]="currentFilter === ''" (click)="filterCategory('')">Tout</a>
            <a routerLink="/" class="nav-link" [class.active]="currentFilter === 'homme'" (click)="filterCategory('homme')">Homme</a>
            <a routerLink="/" class="nav-link" [class.active]="currentFilter === 'femme'" (click)="filterCategory('femme')">Femme</a>
            <a routerLink="/" class="nav-link" [class.active]="currentFilter === 'enfant'" (click)="filterCategory('enfant')">Enfant</a>
            <a routerLink="/" class="nav-link" [class.active]="currentFilter === 'chaussure'" (click)="filterCategory('chaussure')">Chaussures</a>
            <a routerLink="/" class="nav-link" [class.active]="currentFilter === 'accessoire'" (click)="filterCategory('accessoire')">Accessoires</a>
          </nav>

          <div class="header-actions">
            <div class="search-wrap" [class.open]="searchOpen">
              <button class="icon-btn" (click)="toggleSearch()"><i class="fas fa-search"></i></button>
              <input *ngIf="searchOpen" type="text" placeholder="Rechercher..."
                     [(ngModel)]="searchTerm"
                     (input)="onSearch()"
                     (keyup.escape)="closeSearch()">
              <button class="icon-btn close" *ngIf="searchOpen" (click)="closeSearch()"><i class="fas fa-times"></i></button>
            </div>
            <a routerLink="/suivi" class="icon-btn tracking-btn" title="Suivi de commande">
              <i class="fas fa-truck"></i>
            </a>
            <a routerLink="/panier" class="icon-btn cart-btn" title="Panier">
              <i class="fas fa-shopping-cart"></i>
              <span class="cart-badge" *ngIf="cartCount > 0">{{ cartCount }}</span>
            </a>
            <button class="hamburger-btn" (click)="toggleMobileMenu()" [class.active]="mobileMenuOpen">
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </div>

      <div class="mobile-menu" [class.open]="mobileMenuOpen" (click)="closeMobileMenu()">
        <nav class="mobile-nav" (click)="$event.stopPropagation()">
          <div class="mobile-nav-header">
            <span class="mobile-nav-title">Menu</span>
            <button class="mobile-nav-close" (click)="closeMobileMenu()"><i class="fas fa-times"></i></button>
          </div>
          <a routerLink="/" class="mobile-nav-link" [class.active]="currentFilter === ''" (click)="filterCategory(''); closeMobileMenu()">
            <i class="fas fa-home"></i> Tout
          </a>
          <a routerLink="/" class="mobile-nav-link" [class.active]="currentFilter === 'homme'" (click)="filterCategory('homme'); closeMobileMenu()">
            <i class="fas fa-male"></i> Homme
          </a>
          <a routerLink="/" class="mobile-nav-link" [class.active]="currentFilter === 'femme'" (click)="filterCategory('femme'); closeMobileMenu()">
            <i class="fas fa-female"></i> Femme
          </a>
          <a routerLink="/" class="mobile-nav-link" [class.active]="currentFilter === 'enfant'" (click)="filterCategory('enfant'); closeMobileMenu()">
            <i class="fas fa-child"></i> Enfant
          </a>
          <a routerLink="/" class="mobile-nav-link" [class.active]="currentFilter === 'chaussure'" (click)="filterCategory('chaussure'); closeMobileMenu()">
            <i class="fas fa-shoe-prints"></i> Chaussures
          </a>
          <a routerLink="/" class="mobile-nav-link" [class.active]="currentFilter === 'accessoire'" (click)="filterCategory('accessoire'); closeMobileMenu()">
            <i class="fas fa-gem"></i> Accessoires
          </a>
          <div class="mobile-nav-divider"></div>
          <a routerLink="/panier" class="mobile-nav-link" (click)="closeMobileMenu()">
            <i class="fas fa-shopping-cart"></i> Panier
            <span class="mobile-cart-badge" *ngIf="cartCount > 0">{{ cartCount }}</span>
          </a>
          <a routerLink="/suivi" class="mobile-nav-link" (click)="closeMobileMenu()">
            <i class="fas fa-truck"></i> Suivi de commande
          </a>
        </nav>
      </div>

      <div class="category-bar">
        <div class="category-bar-inner">
          <a routerLink="/" class="category-chip" [class.active]="currentFilter === ''" (click)="filterCategory('')">
            <i class="fas fa-fire"></i> Tout
          </a>
          <a routerLink="/" class="category-chip" [class.active]="currentFilter === 'homme'" (click)="filterCategory('homme')">
            <i class="fas fa-male"></i> Homme
          </a>
          <a routerLink="/" class="category-chip" [class.active]="currentFilter === 'femme'" (click)="filterCategory('femme')">
            <i class="fas fa-female"></i> Femme
          </a>
          <a routerLink="/" class="category-chip" [class.active]="currentFilter === 'enfant'" (click)="filterCategory('enfant')">
            <i class="fas fa-child"></i> Enfant
          </a>
          <a routerLink="/" class="category-chip" [class.active]="currentFilter === 'chaussure'" (click)="filterCategory('chaussure')">
            <i class="fas fa-shoe-prints"></i> Chaussures
          </a>
          <a routerLink="/" class="category-chip" [class.active]="currentFilter === 'accessoire'" (click)="filterCategory('accessoire')">
            <i class="fas fa-gem"></i> Accessoires
          </a>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background: var(--blanc);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .header-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 0;
      gap: 20px;
    }
    .logo {
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      text-decoration: none;
      gap: 0;
    }
    .logo-text {
      font-family: 'Inter', sans-serif;
      font-size: 24px;
      font-weight: 100;
      letter-spacing: 6px;
      color: var(--noir);
      line-height: 1;
    }
    .logo-subtext {
      font-family: 'Inter', sans-serif;
      font-size: 9px;
      font-weight: 400;
      letter-spacing: 5px;
      color: #A89070;
      line-height: 1;
      margin-top: 2px;
    }
    .nav {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
    .nav-link {
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: var(--noir-light);
      cursor: pointer;
      transition: var(--transition);
      white-space: nowrap;
    }
    .nav-link:hover {
      background: var(--beige);
      color: var(--noir);
    }
    .nav-link.active {
      background: var(--noir);
      color: var(--blanc);
    }
    .header-actions {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .search-wrap {
      display: flex;
      align-items: center;
      gap: 0;
    }
    .icon-btn {
      width: 42px;
      height: 42px;
      border: 1px solid var(--border);
      background: var(--blanc);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--noir);
      font-size: 15px;
      transition: var(--transition);
      flex-shrink: 0;
      text-decoration: none;
      position: relative;
    }
    .search-wrap:not(.open) .icon-btn {
      border-radius: 10px;
    }
    .search-wrap.open .icon-btn {
      border-radius: 0;
    }
    .search-wrap.open .icon-btn:first-child {
      border-radius: 10px 0 0 10px;
    }
    .icon-btn.close {
      border-radius: 0 10px 10px 0;
      border-left: none;
    }
    .icon-btn:hover {
      background: var(--beige);
    }
    .tracking-btn, .cart-btn {
      border-radius: 10px;
    }
    .cart-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      background: var(--danger);
      color: white;
      font-size: 10px;
      font-weight: 700;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    .mobile-cart-badge {
      margin-left: auto;
      background: var(--danger);
      color: white;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
    }
    .search-wrap input {
      height: 42px;
      width: 0;
      border: 1px solid var(--border);
      border-left: none;
      border-right: none;
      padding: 0;
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      outline: none;
      background: var(--beige-light);
      transition: width 0.3s ease, padding 0.3s ease;
    }
    .search-wrap.open input {
      width: 220px;
      padding: 0 12px;
    }
    @media (max-width: 1024px) {
      .nav { gap: 4px; }
      .nav-link { padding: 8px 12px; font-size: 13px; }
    }
    @media (max-width: 768px) {
      .nav { display: none; }
      .logo-text { font-size: 18px; letter-spacing: 4px; }
      .logo-subtext { font-size: 7px; letter-spacing: 3px; }
      .search-wrap.open input { width: 150px; }
      .hamburger-btn { display: flex; }
      .tracking-btn, .cart-btn { width: 38px; height: 38px; font-size: 14px; }
    }
    @media (max-width: 480px) {
      .header-inner { padding: 10px 0; gap: 8px; }
      .logo-text { font-size: 16px; letter-spacing: 3px; }
      .logo-subtext { font-size: 7px; letter-spacing: 2px; }
      .search-wrap.open input { width: 120px; }
      .icon-btn { width: 38px; height: 38px; }
    }
    .hamburger-btn {
      display: none;
      width: 42px;
      height: 42px;
      border: 1px solid var(--border);
      background: var(--blanc);
      border-radius: 10px;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 5px;
      cursor: pointer;
      padding: 0;
      transition: var(--transition);
    }
    .hamburger-btn span {
      display: block;
      width: 18px;
      height: 2px;
      background: var(--noir);
      border-radius: 2px;
      transition: var(--transition);
    }
    .hamburger-btn.active span:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }
    .hamburger-btn.active span:nth-child(2) {
      opacity: 0;
    }
    .hamburger-btn.active span:nth-child(3) {
      transform: rotate(-45deg) translate(5px, -5px);
    }
    .mobile-menu {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
    .mobile-menu.open {
      opacity: 1;
      pointer-events: auto;
    }
    .mobile-nav {
      position: absolute;
      top: 0;
      right: 0;
      width: 280px;
      max-width: 85vw;
      height: 100%;
      background: var(--blanc);
      padding: 80px 0 30px;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      overflow-y: auto;
      box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
    }
    .mobile-menu.open .mobile-nav {
      transform: translateX(0);
    }
    .mobile-nav-link {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 24px;
      font-size: 16px;
      font-weight: 500;
      color: var(--noir-light);
      transition: var(--transition);
    }
    .mobile-nav-link:hover {
      background: var(--beige);
      color: var(--noir);
    }
    .mobile-nav-link.active {
      background: var(--noir);
      color: var(--blanc);
    }
    .mobile-nav-link i {
      width: 24px;
      text-align: center;
      font-size: 16px;
    }
    .mobile-nav-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px 16px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 8px;
    }
    .mobile-nav-title {
      font-family: 'Playfair Display', serif;
      font-size: 20px;
      font-weight: 700;
      color: var(--noir);
    }
    .mobile-nav-close {
      width: 36px;
      height: 36px;
      border: 1px solid var(--border);
      background: var(--blanc);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 14px;
      color: var(--noir);
      transition: var(--transition);
    }
    .mobile-nav-close:hover {
      background: var(--beige);
    }
    .mobile-nav-divider {
      height: 1px;
      background: var(--border);
      margin: 8px 24px;
    }
    .category-bar {
      display: none;
      background: var(--blanc);
      border-bottom: 1px solid var(--border);
    }
    .category-bar-inner {
      display: flex;
      gap: 8px;
      padding: 10px 0;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .category-bar-inner::-webkit-scrollbar {
      display: none;
    }
    .category-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      color: var(--noir-light);
      background: var(--beige);
      border: 1px solid transparent;
      white-space: nowrap;
      cursor: pointer;
      transition: var(--transition);
      text-decoration: none;
      flex-shrink: 0;
    }
    .category-chip:hover {
      background: var(--beige-dark);
      color: var(--noir);
    }
    .category-chip.active {
      background: var(--noir);
      color: var(--blanc);
      border-color: var(--noir);
    }
    .category-chip i {
      font-size: 12px;
    }
    @media (max-width: 768px) {
      .category-bar { display: block; }
      .mobile-menu { display: block; }
    }
  `]
})
export class HeaderComponent implements OnInit {
  currentFilter = '';
  searchOpen = false;
  searchTerm = '';
  mobileMenuOpen = false;
  cartCount = 0;

  constructor(private router: Router, private cartService: CartService) {}

  ngOnInit() {
    this.cartService.cart$.subscribe(() => {
      this.cartCount = this.cartService.getItemCount();
    });
  }

  toggleSearch() {
    if (this.searchOpen) {
      this.closeSearch();
    } else {
      this.searchOpen = true;
    }
  }

  closeSearch() {
    this.searchOpen = false;
    this.searchTerm = '';
    window.dispatchEvent(new CustomEvent('filter-search', { detail: '' }));
  }

  onSearch() {
    window.dispatchEvent(new CustomEvent('filter-search', { detail: this.searchTerm }));
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    document.body.style.overflow = this.mobileMenuOpen ? 'hidden' : '';
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
    document.body.style.overflow = '';
  }

  filterCategory(category: string) {
    this.currentFilter = category;
    this.searchTerm = '';
    this.searchOpen = false;
    this.closeMobileMenu();
    if (this.router.url === '/') {
      window.dispatchEvent(new CustomEvent('filter-category', { detail: category }));
    } else {
      sessionStorage.setItem('pendingCategory', category);
    }
  }

  resetAll() {
    this.currentFilter = '';
    this.searchTerm = '';
    this.searchOpen = false;
    this.closeMobileMenu();
    sessionStorage.removeItem('pendingCategory');
    window.dispatchEvent(new CustomEvent('filter-category', { detail: '' }));
    window.dispatchEvent(new CustomEvent('filter-search', { detail: '' }));
  }
}
