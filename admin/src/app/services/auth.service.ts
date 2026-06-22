import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'pv_admin_token';
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.loggedIn.asObservable();

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap((res: any) => {
        localStorage.setItem(this.tokenKey, res.token);
        this.loggedIn.next(true);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.loggedIn.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return this.hasToken();
  }

  verify(): Observable<boolean> {
    const token = this.getToken();
    if (!token) return of(false);
    return this.http.get<{ valid: boolean }>(`${environment.apiUrl}/auth/verify`).pipe(
      map(res => {
        if (!res.valid) this.logout();
        return res.valid;
      }),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }
}
