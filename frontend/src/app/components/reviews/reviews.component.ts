import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { Review } from '../../models/product.model';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reviews-section">
      <div class="reviews-header">
        <h3><i class="fas fa-star"></i> Avis clients</h3>
        <div class="reviews-summary" *ngIf="stats.totalReviews > 0">
          <div class="avg-rating">
            <span class="rating-number">{{ stats.avgRating }}</span>
            <div class="stars">
              <i class="fas fa-star" *ngFor="let s of getStars(stats.avgRating)"></i>
              <i class="far fa-star" *ngFor="let s of getEmptyStars(stats.avgRating)"></i>
            </div>
            <span class="review-count">{{ stats.totalReviews }} avis</span>
          </div>
        </div>
      </div>

      <div class="reviews-list" *ngIf="reviews.length > 0">
        <div class="review-card" *ngFor="let review of reviews">
          <div class="review-header">
            <div class="reviewer-info">
              <span class="reviewer-name">{{ review.nom }} {{ review.prenom }}</span>
              <span class="review-date">{{ review.dateReview | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="review-stars">
              <i class="fas fa-star" *ngFor="let s of getStars(review.rating)"></i>
              <i class="far fa-star" *ngFor="let s of getEmptyStars(review.rating)"></i>
            </div>
          </div>
          <p class="review-text" *ngIf="review.commentaire">{{ review.commentaire }}</p>
        </div>
      </div>

      <div class="no-reviews" *ngIf="reviews.length === 0 && !loading">
        <p>Aucun avis pour le moment. Soyez le premier a donner votre avis !</p>
      </div>

      <div class="pagination" *ngIf="totalPages > 1">
        <button (click)="loadReviews(currentPage - 1)" [disabled]="currentPage <= 1" class="page-btn">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="page-info">Page {{ currentPage }} / {{ totalPages }}</span>
        <button (click)="loadReviews(currentPage + 1)" [disabled]="currentPage >= totalPages" class="page-btn">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>

      <div class="write-review">
        <h4>Laisser un avis</h4>
        <div class="rating-input">
          <span>Votre note :</span>
          <div class="star-rating">
            <i *ngFor="let s of [1,2,3,4,5]" class="fa-star" [class.fas]="s <= newRating" [class.far]="s > newRating"
               (click)="newRating = s" style="cursor:pointer"></i>
          </div>
        </div>
        <input type="text" placeholder="Votre nom *" [(ngModel)]="newReview.nom" required>
        <input type="text" placeholder="Prenom (optionnel)" [(ngModel)]="newReview.prenom">
        <textarea placeholder="Votre avis (optionnel)" [(ngModel)]="newReview.commentaire" rows="3"></textarea>
        <p class="review-error" *ngIf="reviewError">{{ reviewError }}</p>
        <p class="review-success" *ngIf="reviewSuccess">{{ reviewSuccess }}</p>
        <button class="btn btn-primary" (click)="submitReview()" [disabled]="submitting || !newReview.nom || newRating === 0">
          {{ submitting ? 'Envoi...' : 'Envoyer mon avis' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .reviews-section { margin-top: 40px; }
    .reviews-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .reviews-header h3 { font-size: 20px; display: flex; align-items: center; gap: 8px; }
    .reviews-header h3 i { color: var(--accent); }
    .avg-rating { display: flex; align-items: center; gap: 12px; }
    .rating-number { font-size: 32px; font-weight: 700; }
    .stars { display: flex; gap: 2px; color: #FFC107; }
    .review-count { font-size: 13px; color: var(--gris); }
    .reviews-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
    .review-card { background: var(--blanc); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; }
    .review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .reviewer-name { font-weight: 600; font-size: 14px; display: block; }
    .review-date { font-size: 12px; color: var(--gris); }
    .review-stars { color: #FFC107; font-size: 13px; }
    .review-text { font-size: 14px; color: var(--noir-light); line-height: 1.6; }
    .no-reviews { text-align: center; padding: 30px; color: var(--gris); }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 24px; }
    .page-btn { width: 36px; height: 36px; border: 1px solid var(--border); background: var(--blanc); border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .page-btn:hover:not(:disabled) { background: var(--beige); }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-info { font-size: 14px; color: var(--gris); }
    .write-review { background: var(--beige-light); border-radius: var(--radius); padding: 24px; }
    .write-review h4 { margin-bottom: 16px; }
    .rating-input { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .star-rating { color: #FFC107; font-size: 20px; }
    .write-review input, .write-review textarea { width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; margin-bottom: 10px; font-family: 'Inter', sans-serif; background: var(--blanc); }
    .write-review input:focus, .write-review textarea:focus { outline: none; border-color: var(--accent); }
    .write-review textarea { resize: vertical; }
    .review-error { color: var(--danger); font-size: 13px; margin-bottom: 8px; }
    .review-success { color: var(--success); font-size: 13px; margin-bottom: 8px; }
    .write-review .btn { margin-top: 4px; }
  `]
})
export class ReviewsComponent implements OnInit, OnChanges {
  @Input() productId = '';

  reviews: Review[] = [];
  stats = { avgRating: 0, totalReviews: 0 };
  currentPage = 1;
  totalPages = 1;
  loading = false;

  newRating = 0;
  newReview = { nom: '', prenom: '', email: '', commentaire: '' };
  submitting = false;
  reviewError = '';
  reviewSuccess = '';

  constructor(private productService: ProductService) {}

  ngOnInit() {
    if (this.productId) {
      this.loadReviews(1);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['productId'] && !changes['productId'].firstChange && this.productId) {
      this.loadReviews(1);
    }
  }

  loadReviews(page: number) {
    this.loading = true;
    this.productService.getReviews(this.productId, page).subscribe({
      next: (res: any) => {
        this.reviews = res.data || [];
        this.stats = res.stats || { avgRating: 0, totalReviews: 0 };
        this.currentPage = res.pagination?.page || 1;
        this.totalPages = res.pagination?.pages || 1;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement avis:', err);
        this.reviews = [];
        this.loading = false;
      }
    });
  }

  getStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  getEmptyStars(rating: number): number[] {
    return Array(5 - Math.floor(rating)).fill(0);
  }

  submitReview() {
    if (!this.newReview.nom || this.newRating === 0) return;
    this.submitting = true;
    this.reviewError = '';
    this.reviewSuccess = '';

    this.productService.submitReview({
      produit_id: this.productId,
      nom: this.newReview.nom,
      prenom: this.newReview.prenom,
      email: this.newReview.email,
      rating: this.newRating,
      commentaire: this.newReview.commentaire
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.reviewSuccess = 'Merci ! Votre avis a ete publie.';
        this.newRating = 0;
        this.newReview = { nom: '', prenom: '', email: '', commentaire: '' };
        this.loadReviews(1);
      },
      error: (err) => {
        this.submitting = false;
        this.reviewError = err.error?.error || 'Erreur lors de l\'envoi';
      }
    });
  }
}
