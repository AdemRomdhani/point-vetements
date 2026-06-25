import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="marquee-bar">
      <div class="marquee-content">
        Point Vêtements est votre destination en ligne tendance et accessible pour dénicher des vêtements stylés, alliant qualité et petits prix, afin de sublimer votre garde-robe au quotidien.
      </div>
    </div>

    <div class="hero">
      <div class="container">
        <div class="hero-content fade-in">
          <span class="hero-badge">Nouvelle Collection</span>
          <h1>Decouvrez notre collection<br><span class="accent">exclusive</span></h1>
          <p>Des vetements de qualite pour toute la famille. Style, confort et elegance a prix accessibles.</p>
          <button class="btn btn-primary btn-lg" (click)="scrollToProducts()">
            <i class="fas fa-arrow-down"></i> Voir la collection
          </button>
        </div>
      </div>
    </div>

    <section class="products-section" id="products">
      <div class="container">
        <div class="section-header">
          <h2>Nos Produits</h2>
          <div class="filter-bar">
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input type="text" placeholder="Rechercher..." [(ngModel)]="searchTerm" (input)="filterProducts()">
            </div>
            <select [(ngModel)]="sortBy" (change)="filterProducts()">
              <option value="">Trier par</option>
              <option value="prix-asc">Prix croissant</option>
              <option value="prix-desc">Prix decroissant</option>
              <option value="date">Nouveautes</option>
            </select>
          </div>
        </div>

        <div class="products-grid" *ngIf="filteredProducts.length > 0">
          <div class="product-card card" *ngFor="let product of filteredProducts; let i = index; trackBy: trackByProduct"
               [style.animation-delay]="i * 0.1 + 's'">
            <a [routerLink]="['/produit', product._id]" class="product-link">
              <div class="product-image">
                <img [src]="getImageUrl(product.images[0])"
                     [alt]="product.nom" loading="lazy"
                     (error)="onImageError($event)">
                <div class="product-badges">
                  <span class="badge badge-promo" *ngIf="product.promotions > 0">-{{ product.promotions }}%</span>
                  <span class="badge badge-new" *ngIf="isNew(product.dateAjout)">Nouveau</span>
                </div>
                <div class="product-overlay">
                  <button class="btn btn-primary">Voir le produit</button>
                </div>
              </div>
              <div class="product-info">
                <div class="product-meta">
                  <span class="product-category">{{ product.categorie }}</span>
                  <span class="product-brand" *ngIf="product.marque">{{ product.marque }}</span>
                </div>
                <h3 class="product-name">{{ product.nom }}</h3>
                <div class="product-colors" *ngIf="product.couleurs && product.couleurs.length > 0">
                  <span *ngFor="let c of product.couleurs; trackBy: trackByColor" class="product-color-dot" [style.background]="c"></span>
                </div>
                <p class="product-color" *ngIf="!product.couleurs || product.couleurs.length === 0">{{ product.couleur }}</p>
                <div class="product-pricing">
                  <span class="product-price" [class.has-promo]="product.promotions > 0">
                    {{ getProductPrice(product) | number:'1.2-2' }} DT
                  </span>
                  <span class="product-old-price" *ngIf="product.promotions > 0">
                    {{ product.prix | number:'1.2-2' }} DT
                  </span>
                </div>
                <div class="product-sizes">
                  <span *ngFor="let taille of product.tailles; trackBy: trackBySize" class="size-tag">{{ taille }}</span>
                </div>
                <div class="product-stock" [class.out-stock]="product.quantite === 0">
                  <i class="fas" [class.fa-check-circle]="product.quantite > 0" [class.fa-times-circle]="product.quantite === 0"></i>
                  {{ product.quantite > 0 ? 'En stock (' + product.quantite + ')' : 'Rupture de stock' }}
                </div>
              </div>
            </a>
          </div>
        </div>

        <div class="empty-state" *ngIf="filteredProducts.length === 0 && !loading">
          <i class="fas fa-box-open"></i>
          <h3>Aucun produit trouve</h3>
          <p>Essayez de modifier vos filtres ou revenez plus tard.</p>
        </div>

        <div class="products-grid" *ngIf="loading">
          <div class="skeleton-card" *ngFor="let i of [1,2,3,4,5,6,7,8]">
            <div class="skeleton skeleton-image"></div>
            <div class="skeleton-body">
              <div class="skeleton-text-sm"></div>
              <div class="skeleton-text-lg"></div>
              <div class="skeleton-colors">
                <div class="skeleton skeleton-dot"></div>
                <div class="skeleton skeleton-dot"></div>
                <div class="skeleton skeleton-dot"></div>
              </div>
              <div class="skeleton-text" style="width: 35%"></div>
              <div class="skeleton-sizes">
                <div class="skeleton skeleton-size"></div>
                <div class="skeleton skeleton-size"></div>
                <div class="skeleton skeleton-size"></div>
              </div>
              <div class="skeleton-text-sm" style="width: 50%"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .marquee-bar {
      background: var(--noir);
      color: var(--blanc);
      overflow: hidden;
      white-space: nowrap;
      padding: 10px 0;
    }
    .marquee-content {
      display: inline-block;
      font-size: 14px;
      letter-spacing: 0.5px;
      animation: marqueeScroll 20s linear infinite;
    }
    @keyframes marqueeScroll {
      0% { transform: translateX(100vw); }
      100% { transform: translateX(-100%); }
    }

    .hero {
      background: linear-gradient(135deg, var(--beige) 0%, var(--beige-dark) 100%);
      padding: 80px 0;
      margin-bottom: 40px;
    }
    .hero-content {
      max-width: 600px;
    }
    .hero-badge {
      display: inline-block;
      padding: 6px 16px;
      background: var(--noir);
      color: var(--blanc);
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 20px;
    }
    .hero h1 {
      font-size: 48px;
      line-height: 1.2;
      margin-bottom: 20px;
      color: var(--noir);
    }
    .hero .accent {
      color: var(--accent);
    }
    .hero p {
      font-size: 18px;
      color: var(--gris);
      margin-bottom: 30px;
      line-height: 1.8;
    }

    .products-section {
      padding: 40px 0;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 20px;
    }
    .section-header h2 {
      font-size: 28px;
    }
    .filter-bar {
      display: flex;
      gap: 12px;
    }
    .search-box {
      position: relative;
    }
    .search-box i {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--gris-light);
    }
    .search-box input {
      padding: 10px 14px 10px 40px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 14px;
      width: 250px;
      background: var(--blanc);
    }
    .search-box input:focus {
      outline: none;
      border-color: var(--accent);
    }
    .filter-bar select {
      padding: 10px 16px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 14px;
      background: var(--blanc);
      cursor: pointer;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .product-card {
      animation: fadeIn 0.5s ease forwards;
      opacity: 0;
    }
    .product-link {
      display: block;
    }
    .product-image {
      position: relative;
      overflow: hidden;
      aspect-ratio: 1/1;
    }
    .product-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }
    .product-card:hover .product-image img {
      transform: scale(1.05);
    }
    .product-badges {
      position: absolute;
      top: 12px;
      left: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .badge-promo {
      background: var(--danger);
      color: var(--blanc);
    }
    .badge-new {
      background: var(--noir);
      color: var(--blanc);
    }
    .product-overlay {
      position: absolute;
      inset: 0;
      background: rgba(26, 26, 26, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: var(--transition);
    }
    .product-card:hover .product-overlay {
      opacity: 1;
    }

    .product-info {
      padding: 16px;
    }
    .product-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .product-category {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--accent-dark);
      font-weight: 600;
    }
    .product-brand {
      font-size: 12px;
      color: var(--gris);
    }
    .product-name {
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      margin-bottom: 4px;
      color: var(--noir);
    }
    .product-color {
      font-size: 13px;
      color: var(--gris);
      margin-bottom: 8px;
    }
    .product-colors {
      display: flex;
      gap: 5px;
      margin-bottom: 8px;
    }
    .product-color-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid var(--border);
    }
    .product-pricing {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .product-price {
      font-size: 20px;
      font-weight: 600;
      color: var(--noir);
    }
    .product-price.has-promo {
      color: var(--danger);
    }
    .product-old-price {
      font-size: 14px;
      color: var(--gris-light);
      text-decoration: line-through;
    }
    .product-sizes {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 10px;
    }
    .size-tag {
      padding: 2px 8px;
      border: 1px solid var(--border);
      border-radius: 4px;
      font-size: 11px;
      color: var(--gris);
    }
    .product-stock {
      font-size: 12px;
      color: var(--success);
    }
    .product-stock i {
      margin-right: 4px;
    }
    .product-stock.out-stock {
      color: var(--danger);
    }

    .loading {
      text-align: center;
      padding: 60px;
    }

    @media (max-width: 1024px) {
      .products-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
      .hero h1 { font-size: 40px; }
    }
    @media (max-width: 768px) {
      .marquee-content { font-size: 12px; }
      .hero h1 { font-size: 28px; }
      .hero { padding: 50px 0; margin-bottom: 24px; }
      .hero p { font-size: 15px; }
      .products-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
      .section-header { flex-direction: column; align-items: flex-start; gap: 16px; }
      .section-header h2 { font-size: 24px; }
      .filter-bar { flex-direction: column; width: 100%; }
      .search-box input { width: 100%; height: 44px; }
      .filter-bar select { width: 100%; height: 44px; }
      .product-info { padding: 12px; }
      .product-name { font-size: 15px; }
      .product-price { font-size: 16px; }
      .product-sizes { display: none; }
      .product-overlay { display: none; }
      .card:hover { transform: none; box-shadow: var(--shadow); }
    }
    @media (max-width: 480px) {
      .hero h1 { font-size: 24px; }
      .hero { padding: 36px 0; margin-bottom: 20px; }
      .hero .hero-badge { font-size: 10px; }
      .hero p { font-size: 14px; margin-bottom: 24px; }
      .products-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
      .product-image { aspect-ratio: 1/1; }
      .product-meta { flex-direction: column; gap: 2px; }
      .product-name { font-size: 14px; }
      .product-price { font-size: 15px; }
      .product-old-price { font-size: 12px; }
      .product-color { display: none; }
      .product-stock { font-size: 11px; }
      .section-header h2 { font-size: 20px; }
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  loading = true;
  searchTerm = '';
  sortBy = '';
  currentCategory = '';
  private filterListener: any;
  private searchListener: any;

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.loadProducts();
    this.filterListener = (e: any) => {
      this.currentCategory = e.detail;
      this.filterProducts();
    };
    this.searchListener = (e: any) => {
      this.searchTerm = e.detail;
      this.filterProducts();
    };
    window.addEventListener('filter-category', this.filterListener);
    window.addEventListener('filter-search', this.searchListener);

    const pendingCategory = sessionStorage.getItem('pendingCategory');
    if (pendingCategory) {
      sessionStorage.removeItem('pendingCategory');
      this.currentCategory = pendingCategory;
    }
  }

  ngOnDestroy() {
    window.removeEventListener('filter-category', this.filterListener);
    window.removeEventListener('filter-search', this.searchListener);
  }

  loadProducts() {
    this.loading = true;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.filteredProducts = data;
        this.loading = false;
        if (this.currentCategory) {
          this.filterProducts();
        }
      },
      error: (err) => {
        console.error('Erreur chargement produits:', err);
        this.loading = false;
      }
    });
  }

  filterProducts() {
    let result = [...this.products];

    if (this.currentCategory) {
      result = result.filter(p => p.categorie === this.currentCategory);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(p =>
        p.nom.toLowerCase().includes(term) ||
        p.marque.toLowerCase().includes(term) ||
        (p.couleur && p.couleur.toLowerCase().includes(term)) ||
        (p.couleurs && p.couleurs.some(c => c.toLowerCase().includes(term))) ||
        p.description.toLowerCase().includes(term)
      );
    }

    if (this.sortBy === 'prix-asc') result.sort((a, b) => a.prix - b.prix);
    else if (this.sortBy === 'prix-desc') result.sort((a, b) => b.prix - a.prix);
    else if (this.sortBy === 'date') result.sort((a, b) => new Date(b.dateAjout).getTime() - new Date(a.dateAjout).getTime());

    this.filteredProducts = result;
  }

  getProductPrice(product: Product): number {
    if (product.promotions > 0) {
      return product.prix * (1 - product.promotions / 100);
    }
    return product.prix;
  }

  isNew(dateStr: string): boolean {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  }

  scrollToProducts() {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  }

  getImageUrl(image: string): string {
    return this.productService.getImageUrl(image);
  }

  onImageError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop';
  }

  trackByProduct(index: number, product: Product): string {
    return product._id;
  }

  trackByColor(index: number, color: string): string {
    return color;
  }

  trackBySize(index: number, size: string): string {
    return size;
  }
}
