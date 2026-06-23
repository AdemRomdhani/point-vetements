import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="product-detail" *ngIf="product">
      <div class="container">
        <div class="breadcrumb">
          <a routerLink="/">Accueil</a>
          <i class="fas fa-chevron-right"></i>
          <a (click)="goBack()">{{ product.categorie | titlecase }}</a>
          <i class="fas fa-chevron-right"></i>
          <span>{{ product.nom }}</span>
        </div>

        <div class="detail-grid">
            <div class="gallery">
            <div class="slider" *ngIf="product">
              <div class="slider-viewport" (touchstart)="onTouchStart($event)" (touchmove)="onTouchMove($event)" (touchend)="onTouchEnd($event)">
                <div class="slider-track" [style.transform]="'translateX(-' + currentSlideIndex * 100 + '%)'">
                  <div class="slider-slide" *ngFor="let img of product.images; trackBy: trackByImage">
                    <img [src]="getImageUrl(img)" [alt]="product.nom" loading="lazy" (error)="onImageError($event)">
                  </div>
                  <div class="slider-slide" *ngIf="product.images.length === 0">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='750'%3E%3Crect fill='%23F5F0E8' width='600' height='750'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%231A1A1A'%3EProduit%3C/text%3E%3C/svg%3E" [alt]="product.nom">
                  </div>
                </div>
              </div>
              <span class="badge badge-promo slider-badge" *ngIf="product.promotions > 0">-{{ product.promotions }}%</span>
              <button class="slider-arrow slider-arrow-left" *ngIf="product.images.length > 1" (click)="prevSlide()">
                <i class="fas fa-chevron-left"></i>
              </button>
              <button class="slider-arrow slider-arrow-right" *ngIf="product.images.length > 1" (click)="nextSlide()">
                <i class="fas fa-chevron-right"></i>
              </button>
              <div class="slider-dots" *ngIf="product.images.length > 1">
                <span *ngFor="let img of product.images; let i = index"
                      class="slider-dot"
                      [class.active]="i === currentSlideIndex"
                      (click)="goToSlide(i)"></span>
              </div>
            </div>
            <div class="thumbnails" *ngIf="product.images.length > 1">
              <img *ngFor="let img of product.images; let i = index; trackBy: trackByImage"
                   [src]="getImageUrl(img)"
                   [alt]="product.nom + ' ' + (i+1)"
                   [class.active]="i === currentSlideIndex"
                   (click)="goToSlide(i)"
                   loading="lazy"
                   (error)="onImageError($event)">
            </div>
          </div>

          <div class="info">
            <span class="category-badge">{{ product.categorie }}</span>
            <h1>{{ product.nom }}</h1>
            <p class="brand" *ngIf="product.marque">Marque: <strong>{{ product.marque }}</strong></p>

            <div class="price-block">
              <span class="current-price" [class.has-promo]="product.promotions > 0">
                {{ getDisplayPrice() | number:'1.2-2' }} DT
              </span>
              <span class="old-price" *ngIf="product.promotions > 0">
                {{ product.prix | number:'1.2-2' }} DT
              </span>
            </div>

            <div class="details-grid">
              <div class="detail-item colors-item" *ngIf="product.couleurs && product.couleurs.length > 0">
                <div class="detail-icon"><i class="fas fa-palette"></i></div>
                <div class="detail-content">
                  <label>Couleurs disponibles</label>
                  <div class="detail-colors">
                    <span *ngFor="let c of product.couleurs" class="detail-color-dot" [style.background]="c"></span>
                  </div>
                </div>
              </div>
              <div class="detail-item" *ngIf="product.couleur && (!product.couleurs || product.couleurs.length === 0)">
                <div class="detail-icon"><i class="fas fa-palette"></i></div>
                <div class="detail-content">
                  <label>Couleur</label>
                  <span>{{ product.couleur }}</span>
                </div>
              </div>
              <div class="detail-item" *ngIf="product.matiere">
                <div class="detail-icon"><i class="fas fa-tshirt"></i></div>
                <div class="detail-content">
                  <label>Matiere</label>
                  <span>{{ product.matiere }}</span>
                </div>
              </div>
              <div class="detail-item" *ngIf="product.saison">
                <div class="detail-icon"><i class="fas fa-cloud-sun"></i></div>
                <div class="detail-content">
                  <label>Saison</label>
                  <span>{{ product.saison | titlecase }}</span>
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-icon" [class.danger]="product.quantite === 0"><i class="fas fa-box"></i></div>
                <div class="detail-content">
                  <label>Stock</label>
                  <span [class.out]="product.quantite === 0">
                    {{ product.quantite > 0 ? product.quantite + ' disponible(s)' : 'Rupture' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="description" *ngIf="product.description">
              <h3>Description</h3>
              <p>{{ product.description }}</p>
            </div>

            <div class="sizes-section">
              <h3>Taille</h3>
              <div class="sizes">
                <button *ngFor="let taille of product.tailles"
                        class="size-btn"
                        [class.selected]="selectedTaille === taille"
                        (click)="selectedTaille = taille">
                  {{ taille }}
                </button>
              </div>
              <p class="error" *ngIf="tailleError">Veuillez selectionner une taille</p>
            </div>

            <div class="colors-section" *ngIf="product.couleurs && product.couleurs.length > 0">
              <h3>Couleur</h3>
              <div class="colors">
                <button *ngFor="let couleur of product.couleurs"
                        class="color-btn"
                        [class.selected]="selectedCouleur === couleur"
                        [style.background]="couleur"
                        (click)="selectedCouleur = couleur">
                  <i class="fas fa-check" *ngIf="selectedCouleur === couleur" [style.color]="isLightColor(couleur) ? '#333' : '#fff'"></i>
                </button>
              </div>
              <p class="error" *ngIf="couleurError">Veuillez selectionner une couleur</p>
            </div>

            <div class="quantity-section">
              <h3>Quantite</h3>
              <div class="quantity-control">
                <button (click)="decrementQuantity()" [disabled]="quantity <= 1">
                  <i class="fas fa-minus"></i>
                </button>
                <span>{{ quantity }}</span>
                <button (click)="incrementQuantity()" [disabled]="quantity >= product.quantite">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
            </div>

            <button class="btn btn-primary btn-lg add-to-cart" (click)="openOrderForm()">
              <i class="fas fa-shopping-bag"></i> Commander maintenant
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="showOrderForm" (click)="showOrderForm = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Finaliser la commande</h2>
          <button class="close-btn" (click)="showOrderForm = false">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="order-summary">
            <h3>Resume de la commande</h3>
            <div class="order-item">
              <img [src]="getImageUrl(product.images[0])" [alt]="product.nom" loading="lazy" (error)="onImageError($event)">
              <div>
                <p class="item-name">{{ product.nom }}</p>
                <p class="item-detail">Taille: {{ selectedTaille }}<span *ngIf="selectedCouleur"> | Couleur: {{ selectedCouleur }}</span> | Qte: {{ quantity }}</p>
              </div>
              <span class="item-price">{{ getDisplayPrice() * quantity | number:'1.2-2' }} DT</span>
            </div>
            <div class="order-line">
              <span>Sous-total</span>
              <span>{{ getDisplayPrice() * quantity | number:'1.2-2' }} DT</span>
            </div>
            <div class="order-line">
              <span>Frais de livraison</span>
              <span>8,00 DT</span>
            </div>
            <div class="order-total">
              <span>Total</span>
              <span class="total-price">{{ getDisplayPrice() * quantity + 8 | number:'1.2-2' }} DT</span>
            </div>
          </div>

          <form (ngSubmit)="submitOrder()" class="order-form">
            <h3>Vos informations</h3>

            <div class="form-row">
              <div class="form-group">
                <label>Prenom *</label>
                <input type="text" [(ngModel)]="client.prenom" name="prenom" required placeholder="Votre prenom">
              </div>
              <div class="form-group">
                <label>Nom *</label>
                <input type="text" [(ngModel)]="client.nom" name="nom" required placeholder="Votre nom">
              </div>
            </div>

            <div class="form-group">
              <label>Telephone *</label>
              <input type="tel" [(ngModel)]="client.telephone" name="telephone" required placeholder="Numero de telephone">
            </div>

            <div class="form-group">
              <label>Adresse *</label>
              <textarea [(ngModel)]="client.adresse" name="adresse" required rows="2" placeholder="Adresse complete"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Ville</label>
                <input type="text" [(ngModel)]="client.ville" name="ville" placeholder="Ville">
              </div>
              <div class="form-group">
                <label>Code Postal</label>
                <input type="text" [(ngModel)]="client.codePostal" name="codePostal" placeholder="Code postal">
              </div>
            </div>

            <p class="form-error" *ngIf="orderError">{{ orderError }}</p>

            <button type="submit" class="btn btn-primary btn-lg" [disabled]="orderLoading" style="width:100%">
              <span *ngIf="!orderLoading"><i class="fas fa-check"></i> Confirmer la commande</span>
              <span *ngIf="orderLoading"><i class="fas fa-spinner fa-spin"></i> Traitement en cours...</span>
            </button>
          </form>
        </div>
      </div>
    </div>

    <div class="toast" *ngIf="showToast" [class.success]="toastType === 'success'" [class.error]="toastType === 'error'">
      {{ toastMessage }}
    </div>
  `,
  styles: [`
    .product-detail { padding: 30px 0; }
    .breadcrumb {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 30px; font-size: 14px; color: var(--gris);
    }
    .breadcrumb a { cursor: pointer; color: var(--gris); transition: color 0.3s; }
    .breadcrumb a:hover { color: var(--noir); }
    .breadcrumb i { font-size: 10px; }

    .detail-grid {
      display: grid;
      grid-template-columns: 40% 1fr;
      gap: 40px;
      align-items: start;
    }

    .gallery { position: sticky; top: 90px; }

    .slider { position: relative; border-radius: var(--radius); overflow: hidden; margin-bottom: 10px; }
    .slider-viewport { overflow: hidden; aspect-ratio: 4/5; }
    .slider-track { display: flex; transition: transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1); height: 100%; }
    .slider-slide { min-width: 100%; flex-shrink: 0; height: 100%; position: relative; }
    .slider-slide img { width: 100%; height: 100%; object-fit: cover; display: block; position: absolute; inset: 0; }
    .slider-badge {
      position: absolute; top: 16px; left: 16px;
      background: var(--danger); color: white;
      padding: 6px 14px; border-radius: 20px; font-weight: 600; z-index: 5;
    }
    .slider-arrow {
      position: absolute; top: 50%; transform: translateY(-50%);
      width: 44px; height: 44px; border: none;
      background: rgba(255,255,255,0.9); color: var(--noir);
      border-radius: 50%; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; z-index: 5;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: all 0.3s;
      opacity: 0;
    }
    .slider:hover .slider-arrow { opacity: 1; }
    .slider-arrow:hover { background: var(--blanc); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .slider-arrow:active { transform: translateY(-50%) scale(0.92); }
    .slider-arrow-left { left: 12px; }
    .slider-arrow-right { right: 12px; }
    .slider-dots {
      position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 6px; z-index: 5;
    }
    .slider-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.3s;
    }
    .slider-dot.active { background: white; width: 22px; border-radius: 4px; }

    .thumbnails { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
    .thumbnails::-webkit-scrollbar { height: 4px; }
    .thumbnails::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
    .thumbnails img {
      width: 72px; height: 72px; object-fit: cover;
      border-radius: 8px; cursor: pointer; flex-shrink: 0;
      border: 2px solid transparent; transition: border-color 0.3s;
    }
    .thumbnails img.active { border-color: var(--noir); }

    .info .category-badge {
      display: inline-block; padding: 4px 12px;
      background: var(--beige); border-radius: 20px;
      font-size: 12px; text-transform: uppercase; letter-spacing: 1px;
      color: var(--accent-dark); font-weight: 600; margin-bottom: 12px;
    }
    .info h1 { font-size: 30px; margin-bottom: 8px; line-height: 1.3; }
    .info .brand { color: var(--gris); margin-bottom: 20px; font-size: 15px; }
    .price-block { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .current-price { font-size: 30px; font-weight: 700; color: var(--noir); }
    .current-price.has-promo { color: var(--danger); }
    .old-price { font-size: 18px; color: var(--gris-light); text-decoration: line-through; }
    .details-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
      margin-bottom: 24px; padding: 16px;
      background: var(--beige-light); border-radius: 8px;
    }
    .detail-item {
      display: flex; align-items: center; gap: 10px;
    }
    .detail-icon {
      width: 36px; height: 36px; border-radius: 8px;
      background: var(--blanc); display: flex; align-items: center; justify-content: center;
      font-size: 14px; color: var(--accent-dark); flex-shrink: 0;
    }
    .detail-icon.danger { color: var(--danger); }
    .detail-content label { display: block; font-size: 11px; color: var(--gris); margin-bottom: 1px; }
    .detail-content span { font-weight: 500; font-size: 13px; }
    .detail-content span.out { color: var(--danger); }
    .detail-colors { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
    .detail-color-dot {
      width: 20px; height: 20px; border-radius: 50%;
      border: 2px solid var(--border); flex-shrink: 0;
    }
    .colors-item { grid-column: 1 / -1; }
    .description { margin-bottom: 24px; }
    .description h3 { font-size: 16px; margin-bottom: 8px; }
    .description p { color: var(--gris); line-height: 1.8; font-size: 14px; }
    .sizes-section { margin-bottom: 24px; }
    .sizes-section h3 { font-size: 16px; margin-bottom: 12px; }
    .sizes { display: flex; flex-wrap: wrap; gap: 8px; }
    .size-btn {
      width: 48px; height: 48px; border: 2px solid var(--border);
      border-radius: 8px; background: var(--blanc);
      font-weight: 500; cursor: pointer; transition: var(--transition);
    }
    .size-btn:hover { border-color: var(--noir); }
    .size-btn.selected { background: var(--noir); color: var(--blanc); border-color: var(--noir); }
    .error { color: var(--danger); font-size: 13px; margin-top: 8px; }
    .colors-section { margin-bottom: 24px; }
    .colors-section h3 { font-size: 16px; margin-bottom: 12px; }
    .colors { display: flex; flex-wrap: wrap; gap: 10px; }
    .color-btn {
      width: 44px; height: 44px; border-radius: 50%;
      border: 3px solid var(--border); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.3s; position: relative;
    }
    .color-btn:hover { transform: scale(1.1); }
    .color-btn.selected {
      border-color: var(--noir);
      box-shadow: 0 0 0 2px var(--blanc), 0 0 0 4px var(--noir);
    }
    .quantity-section { margin-bottom: 24px; }
    .quantity-section h3 { font-size: 16px; margin-bottom: 12px; }
    .quantity-control {
      display: inline-flex; align-items: center;
      border: 2px solid var(--border); border-radius: 8px; overflow: hidden;
    }
    .quantity-control button {
      width: 48px; height: 48px; border: none;
      background: var(--beige-light); cursor: pointer;
      transition: background 0.3s;
      display: flex; align-items: center; justify-content: center;
      touch-action: manipulation;
    }
    .quantity-control button:disabled { opacity: 0.4; cursor: not-allowed; }
    .quantity-control button:hover:not(:disabled) { background: var(--beige-dark); }
    .quantity-control span { width: 60px; text-align: center; font-weight: 600; font-size: 16px; }
    .add-to-cart { width: 100%; justify-content: center; }

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999; padding: 20px;
    }
    .modal {
      background: var(--blanc); border-radius: var(--radius);
      width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto;
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 24px; border-bottom: 1px solid var(--border);
    }
    .modal-header h2 { font-size: 20px; }
    .close-btn {
      width: 36px; height: 36px; border: none;
      background: var(--beige); border-radius: 50%; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .modal-body { padding: 24px; }
    .order-summary { background: var(--beige-light); border-radius: 8px; padding: 16px; margin-bottom: 24px; }
    .order-summary h3 { font-size: 14px; margin-bottom: 12px; }
    .order-item { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .order-item img { width: 60px; height: 60px; border-radius: 8px; object-fit: cover; }
    .item-name { font-weight: 500; font-size: 14px; }
    .item-detail { font-size: 12px; color: var(--gris); }
    .item-price { font-weight: 600; margin-left: auto; }
    .order-line { display: flex; justify-content: space-between; font-size: 14px; color: var(--gris); padding: 6px 0; }
    .order-total { display: flex; justify-content: space-between; padding-top: 12px; border-top: 1px solid var(--border); font-weight: 600; }
    .total-price { font-size: 20px; color: var(--noir); }
    .order-form h3 { font-size: 16px; margin-bottom: 16px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-error { color: var(--danger); font-size: 14px; margin-bottom: 12px; }
    .toast {
      position: fixed; top: 20px; right: 20px; padding: 16px 24px;
      border-radius: var(--radius); color: white; font-weight: 500;
      z-index: 10000; animation: slideIn 0.3s ease;
    }
    .toast.success { background: var(--success); }
    .toast.error { background: var(--danger); }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    @media (max-width: 1024px) {
      .detail-grid { gap: 32px; }
    }
    @media (max-width: 768px) {
      .product-detail { padding: 16px 0; }
      .breadcrumb { margin-bottom: 20px; }
      .detail-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      .gallery { position: static; }
      .slider-slide img { max-height: none; }
      .slider-viewport { aspect-ratio: 1/1; }
      .info h1 { font-size: 22px; }
      .current-price { font-size: 26px; }
      .old-price { font-size: 16px; }
      .details-grid { gap: 12px; padding: 14px; grid-template-columns: 1fr 1fr; }
      .detail-icon { width: 32px; height: 32px; font-size: 13px; }
      .detail-content label { font-size: 10px; }
      .detail-content span { font-size: 12px; }
      .form-row { grid-template-columns: 1fr; }
      .modal { max-width: 100%; border-radius: 16px 16px 0 0; margin-top: auto; max-height: 92vh; padding-bottom: env(safe-area-inset-bottom, 0); }
      .modal-overlay { align-items: flex-end; padding: 0; }
      .modal-body { padding: 20px 16px; }
      .thumbnails img { width: 56px; height: 56px; flex-shrink: 0; }
      .slider-arrow { opacity: 1; width: 36px; height: 36px; font-size: 14px; background: rgba(255,255,255,0.95); }
      .slider-arrow-left { left: 8px; }
      .slider-arrow-right { right: 8px; }
    }
    @media (max-width: 480px) {
      .product-detail { padding: 12px 0; }
      .breadcrumb { font-size: 12px; gap: 6px; margin-bottom: 16px; }
      .slider-viewport { aspect-ratio: 1/1; }
      .info h1 { font-size: 20px; }
      .current-price { font-size: 24px; }
      .old-price { font-size: 14px; }
      .details-grid { gap: 10px; padding: 12px; grid-template-columns: 1fr 1fr; }
      .thumbnails { gap: 6px; }
      .thumbnails img { width: 50px; height: 50px; flex-shrink: 0; }
      .size-btn { width: 44px; height: 44px; }
      .color-btn { width: 40px; height: 40px; }
      .modal-header { padding: 16px; }
      .modal-header h2 { font-size: 18px; }
      .order-item img { width: 50px; height: 50px; }
    }
  `]
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  selectedImage = '';
  selectedTaille = '';
  selectedCouleur = '';
  quantity = 1;
  showOrderForm = false;
  orderLoading = false;
  orderError = '';
  showToast = false;
  toastMessage = '';
  toastType = 'success';
  tailleError = false;
  couleurError = false;

  currentSlideIndex = 0;
  private touchStartX = 0;
  private touchDeltaX = 0;

  client = {
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    ville: '',
    codePostal: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private orderService: OrderService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productService.getProduct(id).subscribe({
        next: (data) => {
          this.product = data;
          this.selectedImage = data.images[0] || '';
          this.currentSlideIndex = 0;
        },
        error: (err) => console.error(err)
      });
    }
  }

  nextSlide() {
    if (!this.product) return;
    const total = this.product.images.length || 1;
    this.currentSlideIndex = (this.currentSlideIndex + 1) % total;
  }

  prevSlide() {
    if (!this.product) return;
    const total = this.product.images.length || 1;
    this.currentSlideIndex = (this.currentSlideIndex - 1 + total) % total;
  }

  goToSlide(index: number) {
    this.currentSlideIndex = index;
  }

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
    this.touchDeltaX = 0;
  }

  onTouchMove(event: TouchEvent) {
    this.touchDeltaX = event.touches[0].clientX - this.touchStartX;
  }

  onTouchEnd() {
    if (Math.abs(this.touchDeltaX) > 50) {
      if (this.touchDeltaX < 0) {
        this.nextSlide();
      } else {
        this.prevSlide();
      }
    }
    this.touchDeltaX = 0;
  }

  decrementQuantity() {
    if (this.quantity > 1) this.quantity--;
  }

  incrementQuantity() {
    if (this.product && this.quantity < this.product.quantite) this.quantity++;
  }

  getDisplayPrice(): number {
    if (!this.product) return 0;
    if (this.product.promotions > 0) {
      return this.product.prix * (1 - this.product.promotions / 100);
    }
    return this.product.prix;
  }

  openOrderForm() {
    this.tailleError = false;
    this.couleurError = false;
    if (this.product && this.product.tailles.length > 0 && !this.selectedTaille) {
      this.tailleError = true;
      return;
    }
    if (this.product && this.product.couleurs && this.product.couleurs.length > 0 && !this.selectedCouleur) {
      this.couleurError = true;
      return;
    }
    this.showOrderForm = true;
  }

  submitOrder() {
    if (!this.client.nom || !this.client.prenom || !this.client.telephone || !this.client.adresse) {
      this.orderError = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.orderLoading = true;
    this.orderError = '';

    const order = {
      produits: [{
        produit: this.product?._id,
        taille: this.selectedTaille,
        couleur: this.selectedCouleur,
        quantite: this.quantity
      }],
      client: this.client
    };

    this.orderService.createOrder(order).subscribe({
      next: () => {
        this.showOrderForm = false;
        this.orderLoading = false;
        this.showToastMessage('Commande passee avec succes !', 'success');
        setTimeout(() => this.router.navigate(['/']), 2000);
      },
      error: (err) => {
        this.orderLoading = false;
        this.orderError = err.error?.error || 'Erreur lors de la commande';
      }
    });
  }

  showToastMessage(message: string, type: string) {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }

  goBack() {
    window.history.back();
  }

  isLightColor(hex: string): boolean {
    if (!hex || !hex.startsWith('#')) return false;
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 186;
  }

  getImageUrl(image: string): string {
    return this.productService.getImageUrl(image);
  }

  onImageError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop';
  }

  trackByImage(index: number, item: string): string {
    return item;
  }
}
