import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Product } from '../models/product.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = environment.apiUrl + '/products';
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  getProducts(filters?: any): Observable<Product[]> {
    return this.http.get<{ data: Product[] }>(`${this.apiUrl}/public`).pipe(
      map(res => res.data)
    );
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  getImageUrl(image: string): string {
    if (!image) return '';
    if (image.startsWith('http')) return image;
    return this.baseUrl + image;
  }
}
