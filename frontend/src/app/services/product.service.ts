import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, shareReplay, tap } from 'rxjs';
import { Product, Review } from '../models/product.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = environment.apiUrl + '/products';
  private baseUrl = environment.baseUrl;
  private configCache$: Observable<any> | null = null;
  private productCache = new Map<string, { data: Observable<Product>; expiry: number }>();
  private readonly CACHE_TTL = 60000;

  constructor(private http: HttpClient) {}

  getProducts(filters?: any): Observable<{ data: Product[]; pagination: any }> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<{ data: Product[]; pagination: any }>(`${this.apiUrl}/public`, { params });
  }

  getProductsList(filters?: any): Observable<Product[]> {
    return this.getProducts(filters).pipe(map(res => res.data));
  }

  getProduct(id: string): Observable<Product> {
    const now = Date.now();
    const cached = this.productCache.get(id);
    if (cached && cached.expiry > now) {
      return cached.data;
    }
    const request$ = this.http.get<Product>(`${this.apiUrl}/${id}`).pipe(
      shareReplay(1)
    );
    this.productCache.set(id, { data: request$, expiry: now + this.CACHE_TTL });
    return request$;
  }

  getReviews(productId: string, page: number = 1, limit: number = 10): Observable<any> {
    return this.http.get(`${environment.apiUrl}/reviews/product/${productId}`, {
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  submitReview(review: { produit_id: string; nom: string; prenom?: string; email?: string; rating: number; commentaire?: string }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/reviews`, review);
  }

  getConfig(): Observable<any> {
    if (!this.configCache$) {
      this.configCache$ = this.http.get(`${environment.apiUrl}/config`).pipe(
        shareReplay(1)
      );
    }
    return this.configCache$;
  }

  getImageUrl(image: string): string {
    if (!image) return '';
    if (image.startsWith('http')) return image;
    return this.baseUrl + image;
  }
}
