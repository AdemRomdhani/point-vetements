import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Order } from '../../services/api.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="order-detail-page" *ngIf="order">
      <div class="page-header">
        <div>
          <a routerLink="/commandes" class="back-link"><i class="fas fa-arrow-left"></i> Retour aux commandes</a>
          <h2>Commande #{{ order._id.slice(-6).toUpperCase() }}</h2>
          <p>Passée le {{ order.dateCommande | date:'dd/MM/yyyy à HH:mm' }}</p>
        </div>
        <div class="header-actions">
          <select [ngModel]="order.statut" (ngModelChange)="updateStatus($event)">
            <option value="en_attente">En attente</option>
            <option value="en_preparation">En préparation</option>
            <option value="expedie">Expédié</option>
            <option value="livre">Livré</option>
            <option value="annule">Annulé</option>
          </select>
          <span class="badge" [ngClass]="getStatusBadge(order.statut)">
            {{ getStatusLabel(order.statut) }}
          </span>
          <button class="delete-btn" (click)="deleteOrder()">
            <i class="fas fa-trash"></i> Supprimer
          </button>
        </div>
      </div>

      <div class="detail-grid">
        <div class="detail-card client-card">
          <h3><i class="fas fa-user"></i> Informations client</h3>
          <div class="info-list">
            <div class="info-row">
              <span class="info-label">Nom complet</span>
              <span class="info-value">{{ order.client.prenom }} {{ order.client.nom }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Téléphone</span>
              <span class="info-value"><a href="tel:{{ order.client.telephone }}">{{ order.client.telephone }}</a></span>
            </div>
            <div class="info-row">
              <span class="info-label">Adresse</span>
              <span class="info-value">{{ order.client.adresse }}</span>
            </div>
            <div class="info-row" *ngIf="order.client.ville">
              <span class="info-label">Ville</span>
              <span class="info-value">{{ order.client.ville }} {{ order.client.codePostal }}</span>
            </div>
          </div>
        </div>

        <div class="detail-card notes-card" *ngIf="order.notes">
          <h3><i class="fas fa-sticky-note"></i> Notes</h3>
          <p class="notes-text">{{ order.notes }}</p>
        </div>

        <div class="detail-card timeline-card">
          <h3><i class="fas fa-clock"></i> Suivi</h3>
          <div class="timeline">
            <div class="timeline-item" [class.active]="isStepActive('en_attente')">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <span class="timeline-title">Commande passée</span>
                <span class="timeline-date">{{ order.dateCommande | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            </div>
            <div class="timeline-item" [class.active]="isStepActive('en_preparation')">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <span class="timeline-title">En préparation</span>
              </div>
            </div>
            <div class="timeline-item" [class.active]="isStepActive('expedie')">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <span class="timeline-title">Expédié</span>
              </div>
            </div>
            <div class="timeline-item" [class.active]="isStepActive('livre')">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <span class="timeline-title">Livré</span>
                <span class="timeline-date" *ngIf="order.dateLivraison">{{ order.dateLivraison | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-card products-card">
        <h3><i class="fas fa-box"></i> Produits commandés</h3>
        <div class="products-table">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Produit</th>
                <th>Taille</th>
                <th>Prix unitaire</th>
                <th>Quantité</th>
                <th>Sous-total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of order.produits">
                <td>
                  <img [src]="getImageUrl(item.image)"
                       [alt]="item.nom" (error)="onImageError($event)" class="product-thumb">
                </td>
                <td><strong>{{ item.nom }}</strong></td>
                <td>{{ item.taille }}</td>
                <td>{{ item.prix | number:'1.2-2' }} DT</td>
                <td>{{ item.quantite }}</td>
                <td><strong>{{ item.prix * item.quantite | number:'1.2-2' }} DT</strong></td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" class="total-label">Sous-total</td>
                <td class="subtotal-value">{{ order.montantTotal - (order.fraisLivraison || 8) | number:'1.2-2' }} DT</td>
              </tr>
              <tr>
                <td colspan="5" class="total-label">Frais de livraison</td>
                <td class="delivery-value">{{ order.fraisLivraison || 8 | number:'1.2-2' }} DT</td>
              </tr>
              <tr>
                <td colspan="5" class="total-label">Total</td>
                <td class="total-value">{{ order.montantTotal | number:'1.2-2' }} DT</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <div class="loading" *ngIf="loading">
      <div class="spinner"></div>
      <p>Chargement de la commande...</p>
    </div>

    <div class="error-state" *ngIf="error && !loading">
      <i class="fas fa-exclamation-triangle"></i>
      <h3>Commande introuvable</h3>
      <p>{{ error }}</p>
      <a routerLink="/commandes" class="btn btn-primary">Retour aux commandes</a>
    </div>

    <div class="toast" *ngIf="showToast" [class.success]="toastType === 'success'" [class.error]="toastType === 'error'">
      {{ toastMessage }}
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 30px; }
    .back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--gris); text-decoration: none; margin-bottom: 8px; transition: var(--transition); }
    .back-link:hover { color: var(--noir); }
    .page-header h2 { font-size: 28px; margin-bottom: 4px; }
    .page-header p { color: var(--gris); font-size: 14px; }
    .header-actions { display: flex; align-items: center; gap: 12px; margin-top: 16px; }
    .header-actions select { padding: 10px 14px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; background: var(--blanc); cursor: pointer; }
    .delete-btn { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border: 1px solid var(--border); background: var(--blanc); border-radius: 8px; cursor: pointer; font-size: 13px; color: var(--danger); transition: var(--transition); font-family: 'Inter', sans-serif; }
    .delete-btn:hover { background: #FFEBEE; border-color: var(--danger); }

    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }

    .detail-card { background: var(--blanc); border-radius: var(--radius); box-shadow: var(--shadow); padding: 24px; }
    .detail-card h3 { font-size: 15px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; color: var(--noir); }
    .detail-card h3 i { color: var(--accent); font-size: 14px; }

    .info-list { display: flex; flex-direction: column; gap: 12px; }
    .info-row { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid var(--border-light); }
    .info-row:last-child { border-bottom: none; padding-bottom: 0; }
    .info-label { font-size: 13px; color: var(--gris); }
    .info-value { font-size: 14px; font-weight: 500; text-align: right; }
    .info-value a { color: var(--accent); text-decoration: none; }
    .info-value a:hover { text-decoration: underline; }

    .notes-text { font-size: 14px; color: var(--noir-light); line-height: 1.6; }

    .timeline { position: relative; padding-left: 24px; }
    .timeline::before { content: ''; position: absolute; left: 7px; top: 4px; bottom: 4px; width: 2px; background: var(--border); }
    .timeline-item { position: relative; padding-bottom: 20px; }
    .timeline-item:last-child { padding-bottom: 0; }
    .timeline-dot { position: absolute; left: -21px; top: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--border); border: 2px solid var(--blanc); z-index: 1; }
    .timeline-item.active .timeline-dot { background: var(--accent); }
    .timeline-content { display: flex; flex-direction: column; gap: 2px; }
    .timeline-title { font-size: 14px; font-weight: 500; }
    .timeline-item.active .timeline-title { color: var(--noir); }
    .timeline-item:not(.active) .timeline-title { color: var(--gris-light); }
    .timeline-date { font-size: 12px; color: var(--gris); }

    .products-card { margin-bottom: 20px; }
    .products-table { overflow-x: auto; }
    .products-table table { width: 100%; border-collapse: collapse; }
    .products-table th { text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; color: var(--gris); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid var(--border); }
    .products-table td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid var(--border-light); vertical-align: middle; }
    .product-thumb { width: 50px; height: 50px; border-radius: 8px; object-fit: cover; }
    .total-label { text-align: right; font-weight: 600; font-size: 14px; color: var(--gris); }
    .subtotal-value { font-size: 14px; }
    .delivery-value { font-size: 14px; color: var(--accent); }
    .total-value { font-weight: 700; font-size: 18px; font-family: 'Playfair Display', serif; }

    .loading { text-align: center; padding: 60px; }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--noir); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-state { text-align: center; padding: 60px; color: var(--gris); }
    .error-state i { font-size: 48px; margin-bottom: 16px; opacity: 0.3; color: var(--danger); }
    .error-state h3 { margin-bottom: 8px; }
    .error-state .btn { margin-top: 16px; }

    @media (max-width: 768px) {
      .detail-grid { grid-template-columns: 1fr; }
      .header-actions { flex-direction: column; align-items: flex-start; }
      .products-table table { min-width: 600px; }
    }
  `]
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  loading = true;
  error = '';
  showToast = false;
  toastMessage = '';
  toastType = 'success';

  private statusOrder = ['en_attente', 'en_preparation', 'expedie', 'livre'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOrder(id);
    } else {
      this.error = 'ID de commande manquant';
      this.loading = false;
    }
  }

  loadOrder(id: string) {
    this.loading = true;
    this.api.getOrder(id).subscribe({
      next: (order) => {
        this.order = order;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Erreur lors du chargement';
        this.loading = false;
      }
    });
  }

  updateStatus(newStatus: string) {
    if (!this.order) return;
    this.api.updateOrderStatus(this.order._id, newStatus).subscribe({
      next: (updated) => {
        this.order = updated;
        this.showToastMessage('Statut mis à jour', 'success');
      },
      error: () => this.showToastMessage('Erreur lors de la mise à jour', 'error')
    });
  }

  deleteOrder() {
    if (!this.order) return;
    if (!confirm('Supprimer la commande #' + this.order._id.slice(-6).toUpperCase() + ' ?')) return;

    this.api.deleteOrder(this.order._id).subscribe({
      next: () => {
        this.showToastMessage('Commande supprimée', 'success');
        setTimeout(() => this.router.navigate(['/commandes']), 1000);
      },
      error: () => this.showToastMessage('Erreur lors de la suppression', 'error')
    });
  }

  isStepActive(status: string): boolean {
    if (!this.order) return false;
    if (this.order.statut === 'annule') return status === 'en_attente';
    const currentIdx = this.statusOrder.indexOf(this.order.statut);
    const stepIdx = this.statusOrder.indexOf(status);
    return stepIdx <= currentIdx;
  }

  getStatusLabel(statut: string): string {
    const labels: any = {
      'en_attente': 'En attente',
      'en_preparation': 'En préparation',
      'expedie': 'Expédié',
      'livre': 'Livré',
      'annule': 'Annulé'
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

  getImageUrl(image: string): string {
    return this.api.getImageUrl(image);
  }

  onImageError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop';
  }

  showToastMessage(message: string, type: string) {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }
}
