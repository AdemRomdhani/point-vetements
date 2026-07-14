import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { CartItem, Client } from '../../models/product.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="cart-page" *ngIf="!showConfirmation">
      <div class="container">
        <h2><i class="fas fa-shopping-cart"></i> Mon Panier</h2>

        <div class="cart-content" *ngIf="items.length > 0">
          <div class="cart-items">
            <div class="cart-item" *ngFor="let item of items; let i = index">
              <img [src]="getImageUrl(item.produit.images[0])" [alt]="item.produit.nom" class="item-image" (error)="onImageError($event)">
              <div class="item-info">
                <h4>{{ item.produit.nom }}</h4>
                <p class="item-details" *ngIf="item.taille">Taille: {{ item.taille }}</p>
                <p class="item-details" *ngIf="item.couleur">Couleur: {{ item.couleur }}</p>
                <p class="item-price">{{ getItemPrice(item) | number:'1.2-2' }} DT</p>
              </div>
              <div class="item-actions">
                <div class="quantity-control">
                  <button (click)="updateQuantity(i, item.quantite - 1)" class="qty-btn">-</button>
                  <span class="qty-value">{{ item.quantite }}</span>
                  <button (click)="updateQuantity(i, item.quantite + 1)" class="qty-btn">+</button>
                </div>
                <button class="remove-btn" (click)="removeItem(i)"><i class="fas fa-trash"></i></button>
              </div>
            </div>
          </div>

          <div class="cart-summary">
            <h3>Resume</h3>
            <div class="summary-row">
              <span>Sous-total</span>
              <span>{{ getSubtotal() | number:'1.2-2' }} DT</span>
            </div>
            <div class="summary-row">
              <span>Frais de livraison</span>
              <span>{{ fraisLivraison | number:'1.2-2' }} DT</span>
            </div>
            <div class="summary-row total">
              <span>Total</span>
              <span>{{ getTotal() | number:'1.2-2' }} DT</span>
            </div>

            <div class="client-form">
              <h4>Informations de livraison</h4>
              <input type="text" placeholder="Nom *" [(ngModel)]="client.nom" required>
              <input type="text" placeholder="Prenom" [(ngModel)]="client.prenom">
              <input type="tel" placeholder="Telephone *" [(ngModel)]="client.telephone" required>
              <input type="email" placeholder="Email (pour confirmation)" [(ngModel)]="client.email">
              <input type="text" placeholder="Adresse *" [(ngModel)]="client.adresse" required>
              <input type="text" placeholder="Ville *" [(ngModel)]="client.ville" required>
              <input type="text" placeholder="Code postal" [(ngModel)]="client.codePostal">
            </div>

            <button class="btn btn-primary btn-full" (click)="placeOrder()" [disabled]="ordering || !isFormValid()">
              <i class="fas" [class.fa-spinner]="ordering" [class.fa-check]="!ordering"></i>
              {{ ordering ? 'Commande en cours...' : 'Passer la commande' }}
            </button>

            <p class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</p>
          </div>
        </div>

        <div class="empty-state" *ngIf="items.length === 0">
          <i class="fas fa-shopping-cart"></i>
          <h3>Votre panier est vide</h3>
          <p>Decouvrez nos produits et ajoutez-les a votre panier.</p>
          <a routerLink="/" class="btn btn-primary">Voir les produits</a>
        </div>
      </div>
    </div>

    <div class="confirmation-page" *ngIf="showConfirmation">
      <div class="container">
        <div class="confirmation-card">
          <div class="confirmation-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <h2>Commande confirmee !</h2>
          <p>Votre commande <strong>#{{ orderConfirmation?._id?.substring(0, 8) }}</strong> a ete passee avec succes.</p>
          <p class="tracking-info" *ngIf="orderConfirmation?.tracking_numero">
            Numero de suivi: <strong>{{ orderConfirmation?.tracking_numero }}</strong>
          </p>
          <p class="confirmation-detail">
            Un email de confirmation sera envoye si vous avez fourni votre adresse email.
          </p>
          <div class="confirmation-actions">
            <a [routerLink]="['/suivi', orderConfirmation?._id]" class="btn btn-secondary">Suivre ma commande</a>
            <a routerLink="/" class="btn btn-primary">Retour a la boutique</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cart-page { padding: 40px 0; }
    .cart-page h2 { font-size: 28px; margin-bottom: 30px; display: flex; align-items: center; gap: 10px; }
    .cart-page h2 i { color: var(--accent); }
    .cart-content { display: grid; grid-template-columns: 1fr 380px; gap: 30px; align-items: start; }
    .cart-items { display: flex; flex-direction: column; gap: 16px; }
    .cart-item { display: flex; gap: 16px; padding: 16px; background: var(--blanc); border-radius: var(--radius); box-shadow: var(--shadow); align-items: center; }
    .item-image { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
    .item-info { flex: 1; }
    .item-info h4 { font-size: 16px; margin-bottom: 4px; }
    .item-details { font-size: 13px; color: var(--gris); margin-bottom: 2px; }
    .item-price { font-size: 16px; font-weight: 600; color: var(--noir); margin-top: 4px; }
    .item-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
    .quantity-control { display: flex; align-items: center; gap: 8px; }
    .qty-btn { width: 32px; height: 32px; border: 1px solid var(--border); background: var(--blanc); border-radius: 6px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; }
    .qty-btn:hover { background: var(--beige); }
    .qty-value { font-weight: 600; min-width: 24px; text-align: center; }
    .remove-btn { background: none; border: none; color: var(--danger); cursor: pointer; font-size: 14px; padding: 4px; }
    .remove-btn:hover { color: #b71c1c; }
    .cart-summary { background: var(--blanc); border-radius: var(--radius); box-shadow: var(--shadow); padding: 24px; position: sticky; top: 100px; }
    .cart-summary h3 { font-size: 18px; margin-bottom: 20px; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
    .summary-row.total { border-top: 2px solid var(--border); padding-top: 12px; margin-top: 12px; font-size: 18px; font-weight: 700; }
    .client-form { margin-top: 24px; }
    .client-form h4 { font-size: 14px; margin-bottom: 12px; color: var(--gris); }
    .client-form input { width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; margin-bottom: 10px; font-family: 'Inter', sans-serif; }
    .client-form input:focus { outline: none; border-color: var(--accent); }
    .btn-full { width: 100%; margin-top: 16px; }
    .error-msg { color: var(--danger); font-size: 13px; margin-top: 10px; text-align: center; }
    .empty-state { text-align: center; padding: 80px 20px; }
    .empty-state i { font-size: 60px; color: var(--border); margin-bottom: 20px; }
    .empty-state h3 { font-size: 24px; margin-bottom: 10px; }
    .empty-state p { color: var(--gris); margin-bottom: 24px; }
    .confirmation-page { padding: 60px 0; text-align: center; }
    .confirmation-card { max-width: 500px; margin: 0 auto; background: var(--blanc); border-radius: var(--radius); box-shadow: var(--shadow); padding: 40px; }
    .confirmation-icon { font-size: 60px; color: var(--success); margin-bottom: 20px; }
    .confirmation-card h2 { margin-bottom: 12px; }
    .tracking-info { background: var(--beige); padding: 10px 16px; border-radius: 8px; margin: 16px 0; font-size: 14px; }
    .confirmation-detail { color: var(--gris); font-size: 13px; margin: 16px 0; }
    .confirmation-actions { display: flex; gap: 12px; justify-content: center; margin-top: 24px; }
    @media (max-width: 768px) {
      .cart-content { grid-template-columns: 1fr; }
      .cart-summary { position: static; }
      .cart-item { flex-wrap: wrap; }
      .confirmation-actions { flex-direction: column; }
    }
  `]
})
export class CartComponent implements OnInit {
  items: CartItem[] = [];
  fraisLivraison = 8;
  ordering = false;
  errorMsg = '';
  showConfirmation = false;
  orderConfirmation: any = null;

  client: Client = { nom: '', prenom: '', telephone: '', email: '', adresse: '', ville: '', codePostal: '' };

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cartService.cart$.subscribe(items => this.items = items);
    this.loadConfig();
  }

  loadConfig() {
    this.productService.getConfig().subscribe({
      next: (config: any) => {
        if (config.fraisLivraison) this.fraisLivraison = parseFloat(config.fraisLivraison);
      },
      error: () => {}
    });
  }

  getItemPrice(item: CartItem): number {
    if (item.produit.promotions > 0) {
      return item.produit.prix * (1 - item.produit.promotions / 100);
    }
    return item.produit.prix;
  }

  getSubtotal(): number {
    return this.cartService.getTotal();
  }

  getTotal(): number {
    return this.getSubtotal() + this.fraisLivraison;
  }

  updateQuantity(index: number, quantite: number) {
    this.cartService.updateQuantity(index, quantite);
  }

  removeItem(index: number) {
    this.cartService.removeItem(index);
  }

  isFormValid(): boolean {
    return !!(this.client.nom && this.client.telephone && this.client.adresse && this.client.ville);
  }

  placeOrder() {
    if (!this.isFormValid()) return;
    this.ordering = true;
    this.errorMsg = '';

    const order = {
      produits: this.items.map(item => ({
        produit: item.produit._id,
        quantite: item.quantite,
        taille: item.taille,
        couleur: item.couleur
      })),
      client: this.client
    };

    this.orderService.createOrder(order).subscribe({
      next: (res) => {
        this.ordering = false;
        this.orderConfirmation = res;
        this.showConfirmation = true;
        this.cartService.clear();
      },
      error: (err) => {
        this.ordering = false;
        this.errorMsg = err.error?.error || 'Erreur lors de la commande';
      }
    });
  }

  getImageUrl(image: string): string {
    return this.productService.getImageUrl(image);
  }

  onImageError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop';
  }
}
