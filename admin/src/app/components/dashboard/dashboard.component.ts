import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Product } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="dashboard">
      <div class="page-header">
        <div>
          <h2>Produits</h2>
          <p>Gerez votre catalogue de produits</p>
        </div>
        <a routerLink="/produits/ajouter" class="btn btn-primary">
          <i class="fas fa-plus"></i> Ajouter un produit
        </a>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: #E3F2FD; color: #1976D2;">
            <i class="fas fa-box"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ totalCount }}</span>
            <span class="stat-label">Total produits</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #E8F5E9; color: #4CAF50;">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ availableCount }}</span>
            <span class="stat-label">Disponibles</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #FFF3E0; color: #FF9800;">
            <i class="fas fa-tag"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ promoCount }}</span>
            <span class="stat-label">En promotion</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #FFEBEE; color: #E53935;">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ lowStockCount }}</span>
            <span class="stat-label">Stock faible</span>
          </div>
        </div>
      </div>

      <div class="filters-bar">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Rechercher un produit..." [(ngModel)]="searchTerm" (input)="onSearchInput()">
        </div>
        <select [(ngModel)]="filterCategorie" (change)="loadProducts()">
          <option value="">Toutes les categories</option>
          <option value="homme">Homme</option>
          <option value="femme">Femme</option>
          <option value="enfant">Enfant</option>
          <option value="chaussure">Chaussures</option>
          <option value="accessoire">Accessoires</option>
        </select>
      </div>

      <div class="loading" *ngIf="loading">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>

      <div class="table-container" *ngIf="!loading">
        <table class="desktop-table">
          <thead>
            <tr>
              <th>Image</th>
              <th class="sortable" (click)="toggleSort('nom')">
                Nom <i class="fas" [class.fa-sort-up]="sortField === 'nom' && sortDir === 'asc'" [class.fa-sort-down]="sortField === 'nom' && sortDir === 'desc'" [class.fa-sort]="sortField !== 'nom'"></i>
              </th>
              <th>Categorie</th>
              <th>Marque</th>
              <th class="sortable" (click)="toggleSort('prix')">
                Prix <i class="fas" [class.fa-sort-up]="sortField === 'prix' && sortDir === 'asc'" [class.fa-sort-down]="sortField === 'prix' && sortDir === 'desc'" [class.fa-sort]="sortField !== 'prix'"></i>
              </th>
              <th class="sortable" (click)="toggleSort('quantite')">
                Stock <i class="fas" [class.fa-sort-up]="sortField === 'quantite' && sortDir === 'asc'" [class.fa-sort-down]="sortField === 'quantite' && sortDir === 'desc'" [class.fa-sort]="sortField !== 'quantite'"></i>
              </th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let product of filteredProducts; trackBy: trackById">
              <td>
                <img [src]="getImageUrl(product.images[0]) || 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2750%27 height=%2750%27%3E%3Crect fill=%27%23F5F0E8%27 width=%2750%27 height=%2750%27/%3E%3Ctext x=%2750%25%27 y=%2755%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 font-family=%27sans-serif%27 font-size=%2718%27 fill=%27%231A1A1A%27%3EP%3C/text%3E%3C/svg%3E'
                     class="product-thumb" [alt]="product.nom"
                     (error)="onImageError($event)">
              </td>
              <td>
                <div class="product-name-cell">
                  <strong>{{ product.nom }}</strong>
                  <span class="product-color" *ngIf="product.couleurs && product.couleurs.length > 0">{{ product.couleurs.length }} couleur(s)</span>
                  <span class="product-color" *ngIf="!product.couleurs || product.couleurs.length === 0">{{ product.couleur }}</span>
                </div>
              </td>
              <td><span class="badge badge-secondary">{{ product.categorie }}</span></td>
              <td>{{ product.marque || '-' }}</td>
              <td>
                <span [class.has-promo]="product.promotions > 0">
                  {{ getDisplayPrice(product) | number:'1.2-2' }} DT
                </span>
                <span class="old-price" *ngIf="product.promotions > 0">
                  {{ product.prix | number:'1.2-2' }}
                </span>
              </td>
              <td>
                <span [class.low-stock]="product.quantite < 5" [class.out-stock]="product.quantite === 0">
                  {{ product.quantite }}
                </span>
              </td>
              <td>
                <span class="badge" [class.badge-success]="product.disponible" [class.badge-danger]="!product.disponible">
                  {{ product.disponible ? 'Actif' : 'Inactif' }}
                </span>
              </td>
              <td>
                <div class="actions">
                  <a [routerLink]="['/produits/modifier', product._id]" class="action-btn edit" title="Modifier">
                    <i class="fas fa-edit"></i>
                  </a>
                  <button class="action-btn delete" title="Supprimer" (click)="deleteProduct(product)">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="mobile-cards">
          <div class="product-card" *ngFor="let product of filteredProducts; trackBy: trackById">
            <div class="card-header">
              <img [src]="getImageUrl(product.images[0]) || 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2780%27 height=%2780%27%3E%3Crect fill=%27%23F5F0E8%27 width=%2780%27 height=%2780%27/%3E%3Ctext x=%2750%25%27 y=%2755%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 font-family=%27sans-serif%27 font-size=%2724%27 fill=%27%231A1A1A%27%3EP%3C/text%3E%3C/svg%3E'"
                   class="card-thumb" [alt]="product.nom"
                   (error)="onImageError($event)">
              <div class="card-info">
                <strong>{{ product.nom }}</strong>
                <span class="product-color" *ngIf="product.couleurs && product.couleurs.length > 0">{{ product.couleurs.length }} couleur(s)</span>
                <span class="product-color" *ngIf="!product.couleurs || product.couleurs.length === 0">{{ product.couleur }}</span>
                <span class="card-brand" *ngIf="product.marque">{{ product.marque }}</span>
              </div>
            </div>
            <div class="card-details">
              <div class="card-row">
                <span class="badge badge-secondary">{{ product.categorie }}</span>
                <span class="badge" [class.badge-success]="product.disponible" [class.badge-danger]="!product.disponible">
                  {{ product.disponible ? 'Actif' : 'Inactif' }}
                </span>
              </div>
              <div class="card-row">
                <span [class.has-promo]="product.promotions > 0" class="card-price">
                  {{ getDisplayPrice(product) | number:'1.2-2' }} DT
                </span>
                <span class="old-price" *ngIf="product.promotions > 0">
                  {{ product.prix | number:'1.2-2' }} DT
                </span>
                <span [class.low-stock]="product.quantite < 5" [class.out-stock]="product.quantite === 0" class="card-stock">
                  Stock: {{ product.quantite }}
                </span>
              </div>
            </div>
            <div class="card-actions">
              <a [routerLink]="['/produits/modifier', product._id]" class="action-btn edit">
                <i class="fas fa-edit"></i> Modifier
              </a>
              <button class="action-btn delete" (click)="deleteProduct(product)">
                <i class="fas fa-trash"></i> Supprimer
              </button>
            </div>
          </div>
        </div>

        <div class="pagination" *ngIf="totalPages > 1">
          <button class="btn btn-sm" [disabled]="currentPage <= 1" (click)="goToPage(currentPage - 1)">
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="page-info">Page {{ currentPage }} / {{ totalPages }}</span>
          <button class="btn btn-sm" [disabled]="currentPage >= totalPages" (click)="goToPage(currentPage + 1)">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>

        <div class="empty-state" *ngIf="filteredProducts.length === 0 && !loading">
          <i class="fas fa-box-open"></i>
          <h3>Aucun produit</h3>
          <p>{{ searchTerm || filterCategorie ? 'Aucun resultat pour vos filtres.' : 'Commencez par ajouter votre premier produit.' }}</p>
        </div>
      </div>
    </div>

    <div class="toast" *ngIf="showToast" [class.success]="toastType === 'success'" [class.error]="toastType === 'error'">
      {{ toastMessage }}
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }
    .page-header h2 { font-size: 28px; margin-bottom: 4px; }
    .page-header p { color: var(--gris); font-size: 14px; }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
    .stat-card { background: var(--blanc); border-radius: var(--radius); padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: var(--shadow); }
    .stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 24px; font-weight: 700; font-family: 'Playfair Display', serif; }
    .stat-label { font-size: 13px; color: var(--gris); }

    .filters-bar { display: flex; gap: 12px; margin-bottom: 20px; }
    .search-box { position: relative; flex: 1; }
    .search-box i { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--gris-light); }
    .search-box input { width: 100%; padding: 12px 14px 12px 40px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; background: var(--blanc); }
    .filters-bar select { padding: 12px 16px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; background: var(--blanc); }

    .product-thumb { width: 50px; height: 50px; border-radius: 8px; object-fit: cover; }
    .product-name-cell { display: flex; flex-direction: column; }
    .product-color { font-size: 12px; color: var(--gris); }

    .has-promo { color: var(--danger); font-weight: 600; }
    .old-price { font-size: 12px; color: var(--gris-light); text-decoration: line-through; margin-left: 6px; }
    .low-stock { color: var(--warning); font-weight: 600; }
    .out-stock { color: var(--danger); font-weight: 600; }

    .sortable { cursor: pointer; user-select: none; }
    .sortable:hover { color: var(--accent); }
    .sortable i { font-size: 11px; margin-left: 4px; opacity: 0.5; }

    .actions { display: flex; gap: 8px; }
    .action-btn { width: 34px; height: 34px; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: var(--transition); font-size: 14px; }
    .action-btn.edit { background: #E3F2FD; color: #1976D2; }
    .action-btn.edit:hover { background: #BBDEFB; }
    .action-btn.delete { background: #FFEBEE; color: var(--danger); }
    .action-btn.delete:hover { background: #FFCDD2; }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 20px; }
    .page-info { font-size: 14px; color: var(--gris); }

    .loading { text-align: center; padding: 60px; }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--noir); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 60px; color: var(--gris); }
    .empty-state i { font-size: 48px; margin-bottom: 16px; opacity: 0.3; }

    .mobile-cards { display: none; }

    @media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) {
      .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
      .page-header .btn-primary { width: 100%; justify-content: center; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
      .filters-bar { flex-direction: column; }
      .desktop-table { display: none; }
      .mobile-cards { display: block; }
      .product-card {
        background: var(--blanc);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        margin-bottom: 12px;
        overflow: hidden;
      }
      .card-header { display: flex; align-items: center; gap: 12px; padding: 14px; }
      .card-thumb { width: 60px; height: 60px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
      .card-info { display: flex; flex-direction: column; gap: 2px; }
      .card-info strong { font-size: 14px; }
      .card-info .product-color { font-size: 12px; color: var(--gris); }
      .card-info .card-brand { font-size: 12px; color: var(--gris-light); }
      .card-details { padding: 0 14px 12px; }
      .card-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
      .card-price { font-weight: 600; font-size: 14px; }
      .card-stock { font-size: 13px; }
      .card-actions { display: flex; border-top: 1px solid var(--border); }
      .card-actions .action-btn { flex: 1; justify-content: center; border-radius: 0; border: none; padding: 12px; font-size: 13px; }
      .card-actions .action-btn i { margin-right: 6px; }
    }
    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
      .stat-card { padding: 14px; gap: 10px; }
      .stat-icon { width: 40px; height: 40px; font-size: 16px; }
      .stat-value { font-size: 20px; }
      .stat-label { font-size: 11px; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchTerm = '';
  filterCategorie = '';
  loading = true;
  showToast = false;
  toastMessage = '';
  toastType = 'success';
  sortField = 'dateAjout';
  sortDir = 'desc';
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  availableCount = 0;
  promoCount = 0;
  lowStockCount = 0;
  private searchTimeout: any;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    const filters: any = {
      page: this.currentPage,
      sort: this.sortField,
      order: this.sortDir
    };
    if (this.filterCategorie) filters.categorie = this.filterCategorie;
    if (this.searchTerm) filters.search = this.searchTerm;

    this.api.getProducts(filters).subscribe({
      next: (res) => {
        this.products = res.data;
        this.filteredProducts = res.data;
        this.totalPages = res.pagination.pages;
        this.totalCount = res.pagination.total;
        this.computeStats();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.showToastMessage('Erreur lors du chargement des produits', 'error');
      }
    });
  }

  computeStats() {
    this.availableCount = this.products.filter(p => p.disponible).length;
    this.promoCount = this.products.filter(p => p.promotions > 0).length;
    this.lowStockCount = this.products.filter(p => p.quantite < 5 && p.quantite > 0).length;
  }

  onSearchInput() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.loadProducts();
    }, 300);
  }

  toggleSort(field: string) {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.loadProducts();
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadProducts();
  }

  trackById(index: number, item: Product): string {
    return item._id;
  }

  getDisplayPrice(product: Product): number {
    if (product.promotions > 0) {
      return product.prix * (1 - product.promotions / 100);
    }
    return product.prix;
  }

  deleteProduct(product: Product) {
    if (confirm(`Supprimer "${product.nom}" ?`)) {
      this.api.deleteProduct(product._id).subscribe({
        next: () => {
          this.products = this.products.filter(p => p._id !== product._id);
          this.filteredProducts = this.filteredProducts.filter(p => p._id !== product._id);
          this.computeStats();
          this.showToastMessage('Produit supprime', 'success');
        },
        error: (err) => this.showToastMessage('Erreur lors de la suppression', 'error')
      });
    }
  }

  showToastMessage(message: string, type: string) {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }

  getImageUrl(image: string): string {
    return this.api.getImageUrl(image);
  }

  onImageError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop';
  }
}
