import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Review } from '../../services/api.service';

@Component({
  selector: 'app-avis',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="avis-page">
      <div class="page-header">
        <div>
          <h2>Avis Clients</h2>
          <p>Gerez les avis de vos clients</p>
        </div>
        <div class="header-stats">
          <span class="stat-pill">
            <i class="fas fa-comments"></i>
            {{ totalReviews }} avis
          </span>
          <span class="stat-pill" *ngIf="avgRating > 0">
            <i class="fas fa-star" style="color: #FFC107;"></i>
            {{ avgRating | number:'1.1-1' }}/5
          </span>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <div class="spinner"></div>
        <p>Chargement des avis...</p>
      </div>

      <div class="reviews-list" *ngIf="!loading">
        <div class="review-card" *ngFor="let review of reviews; trackBy: trackById">
          <div class="review-header">
            <div class="reviewer-info">
              <div class="reviewer-avatar">
                {{ getInitials(review.nom, review.prenom) }}
              </div>
              <div class="reviewer-details">
                <h4>{{ review.prenom }} {{ review.nom }}</h4>
                <span class="review-date">{{ review.dateReview | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            </div>
            <div class="review-actions">
              <div class="stars">
                <i class="fas fa-star" *ngFor="let s of [1,2,3,4,5]" [class.filled]="s <= review.rating"></i>
              </div>
              <button class="delete-btn" (click)="deleteReview(review)" title="Supprimer">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>

          <div class="review-body" *ngIf="review.commentaire">
            <p>{{ review.commentaire }}</p>
          </div>

          <div class="review-footer">
            <span class="product-link">
              <i class="fas fa-box"></i>
              Produit: {{ review.produit_id | slice:0:8 }}...
            </span>
            <span class="badge" [class.badge-approved]="review.approuve === 1">
              {{ review.approuve === 1 ? 'Approuve' : 'En attente' }}
            </span>
          </div>
        </div>
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

      <div class="empty-state" *ngIf="reviews.length === 0 && !loading">
        <i class="fas fa-comments"></i>
        <h3>Aucun avis</h3>
        <p>Les avis de vos clients apparaitront ici.</p>
      </div>
    </div>

    <div class="toast" *ngIf="showToast" [class.toast-success]="toastType === 'success'" [class.toast-error]="toastType === 'error'">
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

    .header-stats {
      display: flex;
      gap: 12px;
    }
    .stat-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: var(--blanc);
      border: 1px solid var(--border);
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      color: var(--noir);
    }
    .stat-pill i { color: var(--accent); }

    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .review-card {
      background: var(--blanc);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      overflow: hidden;
      transition: var(--transition);
    }
    .review-card:hover {
      box-shadow: var(--shadow-hover);
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
    }

    .reviewer-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .reviewer-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: var(--accent);
      color: var(--blanc);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      font-family: 'Inter', sans-serif;
    }
    .reviewer-details h4 {
      font-family: 'Inter', sans-serif;
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .review-date {
      font-size: 12px;
      color: var(--gris);
    }

    .review-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .stars {
      display: flex;
      gap: 2px;
    }
    .stars i {
      color: #DDD;
      font-size: 14px;
    }
    .stars i.filled {
      color: #FFC107;
    }

    .delete-btn {
      width: 36px;
      height: 36px;
      border: 1px solid var(--border);
      background: var(--blanc);
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--danger);
      font-size: 14px;
      transition: var(--transition);
    }
    .delete-btn:hover {
      background: #FFEBEE;
      border-color: var(--danger);
    }

    .review-body {
      padding: 16px 20px;
    }
    .review-body p {
      font-size: 14px;
      line-height: 1.6;
      color: var(--noir-light);
    }

    .review-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      background: var(--beige-light);
      border-top: 1px solid var(--border);
    }
    .product-link {
      font-size: 12px;
      color: var(--gris);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .product-link i { color: var(--accent); }

    .badge-approved {
      background: #E8F5E9 !important;
      color: var(--success) !important;
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 20px;
    }
    .page-info { font-size: 14px; color: var(--gris); }

    .loading {
      text-align: center;
      padding: 60px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border);
      border-top-color: var(--noir);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state {
      text-align: center;
      padding: 60px;
      color: var(--gris);
    }
    .empty-state i { font-size: 48px; margin-bottom: 16px; opacity: 0.3; }

    @media (max-width: 768px) {
      .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
      .header-stats { width: 100%; }
      .review-header { flex-direction: column; gap: 12px; align-items: flex-start; }
      .review-actions { width: 100%; justify-content: space-between; }
      .review-footer { flex-direction: column; gap: 8px; align-items: flex-start; }
    }
  `]
})
export class AvisComponent implements OnInit {
  reviews: Review[] = [];
  loading = true;
  showToast = false;
  toastMessage = '';
  toastType = 'success';
  currentPage = 1;
  totalPages = 1;
  totalReviews = 0;
  avgRating = 0;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadReviews();
  }

  loadReviews() {
    this.loading = true;
    this.api.getReviews(this.currentPage).subscribe({
      next: (res) => {
        this.reviews = res.data || [];
        this.totalPages = res.pagination?.pages || 1;
        this.totalReviews = res.pagination?.total || 0;
        this.calculateStats();
        this.loading = false;
      },
      error: () => {
        this.reviews = [];
        this.loading = false;
        this.showToastMessage('Erreur lors du chargement des avis', 'error');
      }
    });
  }

  calculateStats() {
    if (this.reviews.length === 0) {
      this.avgRating = 0;
      return;
    }
    const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.avgRating = total / this.reviews.length;
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadReviews();
  }

  trackById(index: number, item: Review): string {
    return item._id;
  }

  deleteReview(review: Review) {
    const name = review.prenom ? `${review.prenom} ${review.nom}` : review.nom;
    if (!confirm(`Supprimer l'avis de ${name} ?`)) return;

    this.api.deleteReview(review._id).subscribe({
      next: () => {
        this.reviews = this.reviews.filter(r => r._id !== review._id);
        this.totalReviews--;
        this.calculateStats();
        this.showToastMessage('Avis supprime', 'success');
      },
      error: () => this.showToastMessage('Erreur lors de la suppression', 'error')
    });
  }

  getInitials(nom: string, prenom: string): string {
    const n = (prenom || nom || '?')[0].toUpperCase();
    const p = (nom || '?')[0].toUpperCase();
    return n + p;
  }

  showToastMessage(message: string, type: string) {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }
}
