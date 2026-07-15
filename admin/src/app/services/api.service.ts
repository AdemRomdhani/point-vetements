import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Product {
  _id: string;
  nom: string;
  description: string;
  prix: number;
  categorie: string;
  marque: string;
  sexe: string;
  typeVetement: string;
  matiere: string;
  couleur: string;
  couleurs: string[];
  saison: string;
  tailles: string[];
  quantite: number;
  images: string[];
  disponible: boolean;
  promotions: number;
  dateAjout: string;
}

export interface Order {
  _id: string;
  produits: any[];
  client: {
    nom: string;
    prenom: string;
    telephone: string;
    adresse: string;
    ville: string;
    codePostal: string;
  };
  montantTotal: number;
  fraisLivraison: number;
  statut: string;
  dateCommande: string;
  dateLivraison?: string;
  notes: string;
}

export interface Review {
  _id: string;
  produit_id: string;
  nom: string;
  prenom: string;
  email: string;
  rating: number;
  commentaire: string;
  approuve: number;
  dateReview: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private baseUrl = environment.baseUrl;
  private productsCache$: Observable<Product[]> | null = null;

  constructor(private http: HttpClient) {}

  getImageUrl(image: string): string {
    if (!image) return '';
    if (image.startsWith('http')) return image;
    return this.baseUrl + image;
  }

  getProducts(filters?: any): Observable<PaginatedResponse<Product>> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<PaginatedResponse<Product>>(`${this.apiUrl}/products`, { params });
  }

  getProductsPublic(): Observable<Product[]> {
    if (!this.productsCache$) {
      this.productsCache$ = this.http.get<Product[]>(`${this.apiUrl}/products/public`).pipe(shareReplay(1));
    }
    return this.productsCache$;
  }

  invalidateProductsCache() {
    this.productsCache$ = null;
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  createProduct(product: FormData): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, product);
  }

  updateProduct(id: string, product: FormData): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/products/${id}`, product);
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${id}`);
  }

  getOrders(statut?: string, page?: number): Observable<PaginatedResponse<Order>> {
    let params = new HttpParams();
    if (statut) params = params.set('statut', statut);
    if (page) params = params.set('page', page.toString());
    return this.http.get<PaginatedResponse<Order>>(`${this.apiUrl}/orders`, { params });
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/${id}`);
  }

  updateOrderStatus(id: string, statut: string): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/orders/${id}/statut`, { statut });
  }

  deleteOrder(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/orders/${id}`);
  }

  cleanupOldDeliveredOrders(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/orders/cleanup/old-delivered`);
  }

  getOrderStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/stats/summary`);
  }

  healthCheck(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }

  getDashboard(): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/dashboard`);
  }

  getReviews(page: number = 1, limit: number = 20): Observable<PaginatedResponse<Review>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<PaginatedResponse<Review>>(`${this.apiUrl}/reviews`, { params });
  }

  deleteReview(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reviews/${id}`);
  }
}
