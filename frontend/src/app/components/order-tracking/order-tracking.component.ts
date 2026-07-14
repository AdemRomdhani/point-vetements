import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { OrderTracking } from '../../models/product.model';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tracking-page">
      <div class="container">
        <div class="tracking-header">
          <h2><i class="fas fa-truck"></i> Suivi de commande</h2>
          <p>Entrez votre numero de commande ou votre numero de telephone pour suivre votre commande.</p>
        </div>

        <div class="tracking-search">
          <div class="search-tabs">
            <button [class.active]="searchMode === 'order'" (click)="searchMode = 'order'">Numero de commande</button>
            <button [class.active]="searchMode === 'phone'" (click)="searchMode = 'phone'">Numero de telephone</button>
          </div>
          <div class="search-input">
            <input *ngIf="searchMode === 'order'" type="text" placeholder="Ex: PV1A2B3C4D" [(ngModel)]="searchValue" (keyup.enter)="search()">
            <input *ngIf="searchMode === 'phone'" type="tel" placeholder="Ex: 21234567" [(ngModel)]="searchValue" (keyup.enter)="search()">
            <button class="btn btn-primary" (click)="search()" [disabled]="searching || !searchValue">
              <i class="fas" [class.fa-search]="!searching" [class.fa-spinner]="searching"></i>
            </button>
          </div>
          <p class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</p>
        </div>

        <div class="tracking-result" *ngIf="order">
          <div class="order-header">
            <div>
              <h3>Commande #{{ order._id.substring(0, 8) }}</h3>
              <p class="order-date">{{ order.dateCommande | date:'dd/MM/yyyy HH:mm' }}</p>
            </div>
            <div class="order-status" [attr.data-status]="order.statut">
              {{ order.statutLabel }}
            </div>
          </div>

          <div class="tracking-info-cards">
            <div class="info-card">
              <i class="fas fa-money-bill-wave"></i>
              <span class="info-label">Paiement</span>
              <span class="info-value" [class.paid]="order.paiement_statut === 'paye'">
                {{ order.paiement_statut === 'paye' ? 'Paye' : order.paiement_statut === 'rembourse' ? 'Rembourse' : order.paiement_statut === 'echoue' ? 'Echoue' : 'En attente' }}
              </span>
            </div>
            <div class="info-card" *ngIf="order.tracking_numero">
              <i class="fas fa-barcode"></i>
              <span class="info-label">Suivi</span>
              <span class="info-value">{{ order.tracking_numero }}</span>
            </div>
            <div class="info-card">
              <i class="fas fa-box"></i>
              <span class="info-label">Total</span>
              <span class="info-value">{{ order.montantTotal | number:'1.2-2' }} DT</span>
            </div>
          </div>

          <div class="order-products">
            <h4>Articles commandes</h4>
            <div class="product-row" *ngFor="let item of order.produits">
              <img [src]="getImageUrl(item.image)" [alt]="item.nom" (error)="onImageError($event)">
              <div class="product-details">
                <span class="product-name">{{ item.nom }}</span>
                <span class="product-meta" *ngIf="item.taille || item.couleur">
                  {{ item.taille }}{{ item.taille && item.couleur ? ' / ' : '' }}{{ item.couleur }}
                </span>
              </div>
              <span class="product-qty">x{{ item.quantite }}</span>
              <span class="product-price">{{ item.prix * item.quantite | number:'1.2-2' }} DT</span>
            </div>
          </div>

          <div class="tracking-timeline">
            <h4>Suivi de livraison</h4>
            <div class="timeline">
              <div class="timeline-item" *ngFor="let step of order.history; let last = last" [class.active]="last" [class.done]="!last">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <span class="timeline-label">{{ step.label }}</span>
                  <span class="timeline-date">{{ step.date | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="multiple-orders" *ngIf="multipleOrders.length > 0">
          <h3>Vos commandes</h3>
          <div class="order-card" *ngFor="let o of multipleOrders" (click)="viewOrder(o._id)">
            <div class="order-card-header">
              <span class="order-id">#{{ o._id.substring(0, 8) }}</span>
              <span class="order-status-sm" [attr.data-status]="o.statut">{{ o.statutLabel }}</span>
            </div>
            <div class="order-card-body">
              <span>{{ o.dateCommande | date:'dd/MM/yyyy' }}</span>
              <span class="order-total">{{ o.montantTotal | number:'1.2-2' }} DT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tracking-page { padding: 40px 0; }
    .tracking-header { text-align: center; margin-bottom: 30px; }
    .tracking-header h2 { font-size: 28px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 10px; }
    .tracking-header h2 i { color: var(--accent); }
    .tracking-header p { color: var(--gris); }
    .tracking-search { max-width: 500px; margin: 0 auto 40px; }
    .search-tabs { display: flex; gap: 4px; margin-bottom: 12px; background: var(--beige); border-radius: 10px; padding: 4px; }
    .search-tabs button { flex: 1; padding: 10px; border: none; background: transparent; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; transition: var(--transition); }
    .search-tabs button.active { background: var(--blanc); box-shadow: var(--shadow); }
    .search-input { display: flex; gap: 8px; }
    .search-input input { flex: 1; padding: 12px 16px; border: 1px solid var(--border); border-radius: 10px; font-size: 15px; }
    .search-input input:focus { outline: none; border-color: var(--accent); }
    .search-input .btn { padding: 12px 20px; }
    .error-msg { color: var(--danger); font-size: 13px; margin-top: 10px; text-align: center; }
    .tracking-result { max-width: 700px; margin: 0 auto; }
    .order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .order-header h3 { font-size: 22px; }
    .order-date { color: var(--gris); font-size: 13px; }
    .order-status { padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; }
    .order-status[data-status="en_attente"] { background: #FFF3E0; color: #E65100; }
    .order-status[data-status="en_preparation"] { background: #E3F2FD; color: #1565C0; }
    .order-status[data-status="expedie"] { background: #F3E5F5; color: #7B1FA2; }
    .order-status[data-status="livre"] { background: #E8F5E9; color: #2E7D32; }
    .order-status[data-status="annule"] { background: #FFEBEE; color: #C62828; }
    .tracking-info-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .info-card { background: var(--blanc); border-radius: var(--radius); padding: 16px; text-align: center; box-shadow: var(--shadow); }
    .info-card i { font-size: 20px; color: var(--accent); margin-bottom: 8px; display: block; }
    .info-label { font-size: 12px; color: var(--gris); display: block; margin-bottom: 4px; }
    .info-value { font-size: 14px; font-weight: 600; }
    .info-value.paid { color: var(--success); }
    .order-products { background: var(--blanc); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow); margin-bottom: 24px; }
    .order-products h4 { margin-bottom: 16px; font-size: 16px; }
    .product-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
    .product-row:last-child { border-bottom: none; }
    .product-row img { width: 50px; height: 50px; object-fit: cover; border-radius: 6px; }
    .product-details { flex: 1; }
    .product-name { font-weight: 500; font-size: 14px; display: block; }
    .product-meta { font-size: 12px; color: var(--gris); }
    .product-qty { font-size: 14px; color: var(--gris); }
    .product-price { font-weight: 600; font-size: 14px; }
    .tracking-timeline { background: var(--blanc); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow); }
    .tracking-timeline h4 { margin-bottom: 20px; font-size: 16px; }
    .timeline { position: relative; padding-left: 30px; }
    .timeline::before { content: ''; position: absolute; left: 10px; top: 0; bottom: 0; width: 2px; background: var(--border); }
    .timeline-item { position: relative; padding-bottom: 20px; }
    .timeline-item:last-child { padding-bottom: 0; }
    .timeline-dot { position: absolute; left: -24px; top: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--border); }
    .timeline-item.done .timeline-dot { background: var(--success); }
    .timeline-item.active .timeline-dot { background: var(--accent); box-shadow: 0 0 0 4px rgba(168, 144, 112, 0.2); }
    .timeline-label { display: block; font-weight: 500; font-size: 14px; }
    .timeline-date { font-size: 12px; color: var(--gris); }
    .multiple-orders { max-width: 700px; margin: 0 auto; }
    .multiple-orders h3 { margin-bottom: 16px; }
    .order-card { background: var(--blanc); border-radius: var(--radius); box-shadow: var(--shadow); padding: 16px; margin-bottom: 12px; cursor: pointer; transition: var(--transition); }
    .order-card:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .order-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .order-id { font-weight: 600; }
    .order-status-sm { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .order-status-sm[data-status="en_attente"] { background: #FFF3E0; color: #E65100; }
    .order-status-sm[data-status="en_preparation"] { background: #E3F2FD; color: #1565C0; }
    .order-status-sm[data-status="expedie"] { background: #F3E5F5; color: #7B1FA2; }
    .order-status-sm[data-status="livre"] { background: #E8F5E9; color: #2E7D32; }
    .order-status-sm[data-status="annule"] { background: #FFEBEE; color: #C62828; }
    .order-card-body { display: flex; justify-content: space-between; color: var(--gris); font-size: 13px; }
    .order-total { font-weight: 600; color: var(--noir); }
    @media (max-width: 768px) {
      .tracking-info-cards { grid-template-columns: 1fr; }
      .order-header { flex-direction: column; align-items: flex-start; gap: 10px; }
    }
  `]
})
export class OrderTrackingComponent implements OnInit {
  searchMode: 'order' | 'phone' = 'order';
  searchValue = '';
  searching = false;
  errorMsg = '';
  order: OrderTracking | null = null;
  multipleOrders: any[] = [];
  private baseUrl = environment.baseUrl;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('orderId');
    if (id) {
      this.searchValue = id;
      this.search();
    }
  }

  search() {
    if (!this.searchValue) return;
    this.searching = true;
    this.errorMsg = '';
    this.order = null;
    this.multipleOrders = [];

    if (this.searchMode === 'order') {
      this.http.get<OrderTracking>(`${environment.apiUrl}/tracking/${this.searchValue}`).subscribe({
        next: (data) => {
          this.order = data;
          this.searching = false;
        },
        error: (err) => {
          this.errorMsg = err.error?.error || 'Commande non trouvee';
          this.searching = false;
        }
      });
    } else {
      this.http.get<any[]>(`${environment.apiUrl}/tracking/by-phone/${this.searchValue}`).subscribe({
        next: (data) => {
          if (data.length === 1) {
            this.viewOrder(data[0]._id);
          } else if (data.length > 1) {
            this.multipleOrders = data;
          } else {
            this.errorMsg = 'Aucune commande trouvee pour ce numero';
          }
          this.searching = false;
        },
        error: (err) => {
          this.errorMsg = err.error?.error || 'Erreur de recherche';
          this.searching = false;
        }
      });
    }
  }

  viewOrder(id: string) {
    this.searching = true;
    this.multipleOrders = [];
    this.http.get<OrderTracking>(`${environment.apiUrl}/tracking/${id}`).subscribe({
      next: (data) => {
        this.order = data;
        this.searching = false;
      },
      error: (err) => {
        this.errorMsg = err.error?.error || 'Commande non trouvee';
        this.searching = false;
      }
    });
  }

  getImageUrl(image: string): string {
    if (!image) return '';
    if (image.startsWith('http')) return image;
    return this.baseUrl + image;
  }

  onImageError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop';
  }
}
