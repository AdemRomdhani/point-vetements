import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartItem, Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly CART_KEY = 'pointvetements_cart';
  private cartSubject = new BehaviorSubject<CartItem[]>(this.loadCart());
  cart$: Observable<CartItem[]> = this.cartSubject.asObservable();

  private loadCart(): CartItem[] {
    try {
      const data = localStorage.getItem(this.CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveCart(items: CartItem[]): void {
    localStorage.setItem(this.CART_KEY, JSON.stringify(items));
    this.cartSubject.next(items);
  }

  getItems(): CartItem[] {
    return this.cartSubject.value;
  }

  getItemCount(): number {
    return this.cartSubject.value.reduce((sum, item) => sum + item.quantite, 0);
  }

  getTotal(): number {
    return this.cartSubject.value.reduce((sum, item) => {
      const price = item.produit.promotions > 0
        ? item.produit.prix * (1 - item.produit.promotions / 100)
        : item.produit.prix;
      return sum + price * item.quantite;
    }, 0);
  }

  addItem(product: Product, quantite: number, taille: string, couleur: string): void {
    const items = this.cartSubject.value;
    const existing = items.find(i =>
      i.produit._id === product._id &&
      i.taille === taille &&
      i.couleur === couleur
    );

    if (existing) {
      existing.quantite += quantite;
    } else {
      items.push({ produit: product, quantite, taille, couleur });
    }
    this.saveCart([...items]);
  }

  updateQuantity(index: number, quantite: number): void {
    const items = this.cartSubject.value;
    if (quantite <= 0) {
      items.splice(index, 1);
    } else {
      items[index].quantite = quantite;
    }
    this.saveCart([...items]);
  }

  removeItem(index: number): void {
    const items = this.cartSubject.value;
    items.splice(index, 1);
    this.saveCart([...items]);
  }

  clear(): void {
    this.saveCart([]);
  }
}
