import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../models/product.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = environment.apiUrl + '/orders';

  constructor(private http: HttpClient) {}

  createOrder(order: any): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, order);
  }
}
