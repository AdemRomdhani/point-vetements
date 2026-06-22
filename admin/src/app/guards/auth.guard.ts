import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return of(false);
    }
    return this.auth.verify().pipe(
      map(valid => {
        if (valid) return true;
        this.router.navigate(['/login']);
        return false;
      }),
      catchError(() => {
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
