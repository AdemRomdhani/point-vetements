import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, Order } from '../../services/api.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="orders-page">
      <div class="page-header">
        <div>
          <h2>Commandes</h2>
          <p>Gerez les commandes de vos clients</p>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: #FFF3E0; color: #FF9800;">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.enAttente || 0 }}</span>
            <span class="stat-label">En attente</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #E3F2FD; color: #1976D2;">
            <i class="fas fa-cog"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.enPreparation || 0 }}</span>
            <span class="stat-label">En preparation</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #E8F5E9; color: #4CAF50;">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.livre || 0 }}</span>
            <span class="stat-label">Livre</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #F3E5F5; color: #9C27B0;">
            <i class="fas fa-money-bill-wave"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.revenuTotal || 0 | number:'1.0-0' }} DT</span>
            <span class="stat-label">Revenu total</span>
          </div>
        </div>
      </div>

      <div class="filters-bar">
        <select [(ngModel)]="filterStatut" (change)="loadOrders()">
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="en_preparation">En preparation</option>
          <option value="expedie">Expidie</option>
          <option value="livre">Livre</option>
          <option value="annule">Annule</option>
        </select>
      </div>

      <div class="loading" *ngIf="loading">
        <div class="spinner"></div>
        <p>Chargement des commandes...</p>
      </div>

      <div class="orders-list" *ngIf="!loading">
        <a class="order-card" *ngFor="let order of orders; trackBy: trackById" [routerLink]="['/commandes', order._id]">
          <div class="order-header">
            <div class="order-id">
              <span class="order-number">#{{ order._id.slice(-6).toUpperCase() }}</span>
              <span class="order-date">{{ order.dateCommande | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="order-status">
              <select [ngModel]="order.statut" (ngModelChange)="updateStatus(order, $event)">
                <option value="en_attente">En attente</option>
                <option value="en_preparation">En preparation</option>
                <option value="expedie">Expidie</option>
                <option value="livre">Livre</option>
                <option value="annule">Annule</option>
              </select>
            </div>
          </div>

          <div class="order-body">
            <div class="client-info">
              <h4><i class="fas fa-user"></i> Client</h4>
              <p><strong>{{ order.client.prenom }} {{ order.client.nom }}</strong></p>
              <p><i class="fas fa-phone"></i> {{ order.client.telephone }}</p>
              <p><i class="fas fa-map-marker-alt"></i> {{ order.client.adresse }}</p>
              <p *ngIf="order.client.ville">{{ order.client.ville }} {{ order.client.codePostal }}</p>
            </div>

            <div class="order-items">
              <h4><i class="fas fa-box"></i> Produits</h4>
              <div class="item" *ngFor="let item of order.produits">
                <img [src]="getImageUrl(item.image)" [alt]="item.nom" (error)="onImageError($event)">
                <div class="item-details">
                  <span class="item-name">{{ item.nom }}</span>
                  <span class="item-meta">Taille: {{ item.taille }}<span *ngIf="item.couleur"> | Couleur: <span class="order-color-dot" [style.background]="item.couleur"></span> {{ getColorName(item.couleur) }}</span> | Qte: {{ item.quantite }}</span>
                </div>
                <span class="item-price">{{ item.prix * item.quantite | number:'1.2-2' }} DT</span>
              </div>
            </div>
          </div>

          <div class="order-footer">
            <span class="total">
              Livraison: <strong>8,00 DT</strong> | Total: <strong>{{ order.montantTotal | number:'1.2-2' }} DT</strong>
            </span>
            <div class="footer-right">
              <span class="badge" [ngClass]="getStatusBadge(order.statut)">
                {{ getStatusLabel(order.statut) }}
              </span>
              <button class="delete-btn" (click)="deleteOrder(order, $event)" title="Supprimer">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </a>
      </div>

      <div class="pagination" *ngIf="totalPages > 1 && !loading">
        <button class="btn btn-sm" [disabled]="currentPage <= 1" (click)="goToPage(currentPage - 1)">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="page-info">Page {{ currentPage }} / {{ totalPages }}</span>
        <button class="btn btn-sm" [disabled]="currentPage >= totalPages" (click)="goToPage(currentPage + 1)">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>

      <div class="empty-state" *ngIf="orders.length === 0 && !loading">
        <i class="fas fa-shopping-cart"></i>
        <h3>Aucune commande</h3>
        <p>Les commandes apparaitront ici.</p>
      </div>
    </div>

    <div class="toast" *ngIf="showToast" [class.success]="toastType === 'success'" [class.error]="toastType === 'error'">
      {{ toastMessage }}
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .page-header h2 { font-size: 28px; margin-bottom: 4px; }
    .page-header p { color: var(--gris); font-size: 14px; }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
    .stat-card { background: var(--blanc); border-radius: var(--radius); padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: var(--shadow); }
    .stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 22px; font-weight: 700; font-family: 'Playfair Display', serif; }
    .stat-label { font-size: 13px; color: var(--gris); }

    .filters-bar { margin-bottom: 20px; }
    .filters-bar select { padding: 12px 16px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; background: var(--blanc); }

    .orders-list { display: flex; flex-direction: column; gap: 20px; }
    .order-card { background: var(--blanc); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; display: block; text-decoration: none; color: inherit; cursor: pointer; transition: var(--transition); }
    .order-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.1); transform: translateY(-2px); }

    .order-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: var(--beige-light); border-bottom: 1px solid var(--border); }
    .order-number { font-weight: 700; font-size: 16px; color: var(--noir); }
    .order-date { font-size: 13px; color: var(--gris); margin-left: 12px; }
    .order-status select { padding: 8px 12px; border: 1px solid var(--border); border-radius: 6px; font-size: 13px; background: var(--blanc); cursor: pointer; }

    .order-body { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; padding: 20px; }
    .client-info h4, .order-items h4 { font-size: 13px; font-family: 'Inter', sans-serif; font-weight: 600; color: var(--gris); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
    .client-info h4 i, .order-items h4 i { color: var(--accent); }
    .client-info p { font-size: 14px; margin-bottom: 6px; color: var(--noir-light); }
    .client-info i { width: 16px; color: var(--gris-light); margin-right: 4px; }

    .item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
    .item:last-child { border-bottom: none; }
    .item img { width: 50px; height: 50px; border-radius: 8px; object-fit: cover; }
    .item-details { flex: 1; display: flex; flex-direction: column; }
    .item-name { font-weight: 500; font-size: 14px; }
    .item-meta { font-size: 12px; color: var(--gris); }
    .order-color-dot {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 1px solid var(--border);
      vertical-align: middle;
      margin: 0 3px;
    }
    .item-price { font-weight: 600; font-size: 14px; }

    .order-footer { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-top: 1px solid var(--border); background: var(--beige-light); }
    .footer-right { display: flex; align-items: center; gap: 12px; }
    .total { font-size: 14px; color: var(--gris); }
    .total strong { font-size: 18px; color: var(--noir); font-family: 'Playfair Display', serif; }
    .delete-btn { width: 36px; height: 36px; border: 1px solid var(--border); background: var(--blanc); border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--danger); font-size: 14px; transition: var(--transition); }
    .delete-btn:hover { background: #FFEBEE; border-color: var(--danger); }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 20px; }
    .page-info { font-size: 14px; color: var(--gris); }

    .loading { text-align: center; padding: 60px; }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--noir); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 60px; color: var(--gris); }
    .empty-state i { font-size: 48px; margin-bottom: 16px; opacity: 0.3; }

    @media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) {
      .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
      .order-body { grid-template-columns: 1fr; }
      .order-header { flex-direction: column; gap: 12px; align-items: flex-start; }
      .order-status select { width: 100%; }
      .order-footer { flex-direction: column; gap: 10px; align-items: flex-start; }
    }
    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
      .stat-card { padding: 14px; gap: 10px; }
      .stat-icon { width: 40px; height: 40px; font-size: 16px; }
      .stat-value { font-size: 18px; }
      .stat-label { font-size: 11px; }
    }
  `]
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  stats: any = {};
  filterStatut = '';
  loading = true;
  showToast = false;
  toastMessage = '';
  toastType = 'success';
  currentPage = 1;
  totalPages = 1;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadOrders();
    this.loadStats();
    this.cleanupOldOrders();
  }

  loadOrders() {
    this.loading = true;
    this.api.getOrders(this.filterStatut, this.currentPage).subscribe({
      next: (res) => {
        this.orders = res.data;
        this.totalPages = res.pagination.pages;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.showToastMessage('Erreur lors du chargement des commandes', 'error');
      }
    });
  }

  loadStats() {
    this.api.getOrderStats().subscribe({
      next: (data) => this.stats = data,
      error: (err) => console.error(err)
    });
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadOrders();
  }

  trackById(index: number, item: Order): string {
    return item._id;
  }

  updateStatus(order: Order, newStatus: string) {
    this.api.updateOrderStatus(order._id, newStatus).subscribe({
      next: () => {
        order.statut = newStatus;
        this.loadStats();
        this.showToastMessage('Statut mis a jour', 'success');
      },
      error: (err) => this.showToastMessage('Erreur lors de la mise a jour', 'error')
    });
  }

  deleteOrder(order: Order, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm('Supprimer la commande #' + order._id.slice(-6).toUpperCase() + ' ?')) return;

    this.api.deleteOrder(order._id).subscribe({
      next: () => {
        this.orders = this.orders.filter(o => o._id !== order._id);
        this.loadStats();
        this.showToastMessage('Commande supprimee', 'success');
      },
      error: () => this.showToastMessage('Erreur lors de la suppression', 'error')
    });
  }

  cleanupOldOrders() {
    this.api.cleanupOldDeliveredOrders().subscribe({
      next: (res) => {
        if (res.deleted > 0) {
          this.loadOrders();
          this.loadStats();
        }
      },
      error: () => {}
    });
  }

  getStatusLabel(statut: string): string {
    const labels: any = {
      'en_attente': 'En attente',
      'en_preparation': 'En preparation',
      'expedie': 'Expidie',
      'livre': 'Livre',
      'annule': 'Annule'
    };
    return labels[statut] || statut;
  }

  getStatusBadge(statut: string): string {
    const badges: any = {
      'en_attente': 'badge-warning',
      'en_preparation': 'badge-info',
      'expedie': 'badge-secondary',
      'livre': 'badge-success',
      'annule': 'badge-danger'
    };
    return badges[statut] || 'badge-secondary';
  }

  showToastMessage(message: string, type: string) {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }

  getColorName(hex: string): string {
    const names: any = {
      '#1A1A1A': 'Noir', '#FFFFFF': 'Blanc', '#808080': 'Gris',
      '#C62828': 'Rouge', '#1565C0': 'Bleu', '#2E7D32': 'Vert',
      '#E91E63': 'Rose', '#FFC107': 'Jaune', '#FF5722': 'Orange',
      '#795548': 'Marron', '#FFCCBC': 'Beige', '#01579B': 'Marine',
      '#4E342E': 'Marron fonce', '#F5F5DC': 'Ecru', '#263238': 'Anthracite',
      '#9C27B0': 'Multicolore'
    };
    return names[hex] || hex;
  }

  getImageUrl(image: string): string {
    return this.api.getImageUrl(image);
  }

  onImageError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop';
  }
}
